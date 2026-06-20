from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

from app.services.pvp_service import pvp_manager

router = APIRouter(prefix="/pvp", tags=["pvp"])


class CreateRoomRequest(BaseModel):
    topic: str = "general"
    language: str = "zh"


@router.post("/rooms")
async def create_room(req: CreateRoomRequest) -> dict[str, Any]:
    room = await pvp_manager.create_room(topic=req.topic, language=req.language)
    return {"room_id": room.id, "topic": room.topic, "language": room.language}


@router.websocket("/ws/{room_id}")
async def pvp_websocket(websocket: WebSocket, room_id: str) -> None:
    await websocket.accept()
    try:
        # Wait for join message
        data = await websocket.receive_json()
        nickname = data.get("nickname", "Anonymous")
        user_id = data.get("user_id")
        room = await pvp_manager.join_room(room_id, websocket, nickname, user_id)
        if not room:
            await websocket.send_json({"type": "error", "message": "Room full or not found"})
            await websocket.close()
            return

        # Find own player id by websocket reference
        player_id = next((pid for pid, p in room.players.items() if p.websocket == websocket), None)

        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            if msg_type == "move" and player_id:
                await pvp_manager.submit_move(
                    room_id,
                    player_id,
                    data.get("weapon_id", "clarifier"),
                    data.get("rebuttal", ""),
                )
            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
