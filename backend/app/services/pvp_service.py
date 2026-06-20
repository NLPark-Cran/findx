import asyncio
import uuid
from dataclasses import dataclass, field
from typing import Any

from app.services.fallacy_judge import judge
from app.services.game_engine import compute_battle_result
from app.services.level_generator import generate_level_comments


@dataclass
class Player:
    websocket: Any
    user_id: str | None
    nickname: str
    score: float = 0.0
    submissions: dict[int, dict[str, Any]] = field(default_factory=dict)


@dataclass
class Room:
    id: str
    topic: str
    language: str
    comments: list[dict[str, Any]]
    players: dict[str, Player] = field(default_factory=dict)
    round_index: int = 0
    status: str = "waiting"  # waiting / playing / finished
    results: list[dict[str, Any]] = field(default_factory=list)


class PvPManager:
    def __init__(self) -> None:
        self.rooms: dict[str, Room] = {}

    async def create_room(self, topic: str = "general", language: str = "zh") -> Room:
        room_id = str(uuid.uuid4())[:8]
        comments = await generate_level_comments(topic=topic, difficulty=3, count=3, language=language)
        room = Room(
            id=room_id,
            topic=topic,
            language=language,
            comments=comments,
        )
        self.rooms[room_id] = room
        return room

    async def join_room(self, room_id: str, websocket: Any, nickname: str, user_id: str | None = None) -> Room | None:
        room = self.rooms.get(room_id)
        if not room or len(room.players) >= 2:
            return None
        player_id = str(uuid.uuid4())[:8]
        room.players[player_id] = Player(websocket=websocket, user_id=user_id, nickname=nickname)
        await self._broadcast(room, {"type": "player_joined", "nickname": nickname, "count": len(room.players)})
        if len(room.players) == 2:
            room.status = "playing"
            await self._start_round(room)
        return room

    async def submit_move(self, room_id: str, player_id: str, weapon_id: str, rebuttal: str) -> None:
        room = self.rooms.get(room_id)
        if not room or room.status != "playing":
            return
        player = room.players.get(player_id)
        if not player:
            return
        player.submissions[room.round_index] = {"weapon_id": weapon_id, "rebuttal": rebuttal}
        await self._broadcast(room, {"type": "submitted", "nickname": player.nickname})
        if len(player.submissions) == len(room.players):
            await self._resolve_round(room)

    async def _start_round(self, room: Room) -> None:
        if room.round_index >= len(room.comments):
            await self._finish_game(room)
            return
        comment = room.comments[room.round_index]
        text_key = "text_cn" if room.language == "zh" else "text_en"
        await self._broadcast(
            room,
            {
                "type": "round_start",
                "round": room.round_index + 1,
                "total_rounds": len(room.comments),
                "comment": {"text": comment.get(text_key, ""), "emotion": comment.get("emotion", {})},
                "time_limit": 45,
            },
        )
        # Auto-resolve after timeout if someone hasn't submitted
        asyncio.create_task(self._round_timeout(room, room.round_index))

    async def _round_timeout(self, room: Room, round_index: int) -> None:
        await asyncio.sleep(50)
        if room.round_index != round_index or room.status != "playing":
            return
        # Fill missing submissions with empty
        for pid, player in room.players.items():
            if round_index not in player.submissions:
                player.submissions[round_index] = {"weapon_id": "clarifier", "rebuttal": ""}
        await self._resolve_round(room)

    async def _resolve_round(self, room: Room) -> None:
        comment_data = room.comments[room.round_index]
        text_key = "text_cn" if room.language == "zh" else "text_en"
        text = comment_data.get(text_key, "")
        fallacy_types = comment_data.get("fallacy_types", [])

        round_result = {"round": room.round_index + 1, "players": []}
        for pid, player in room.players.items():
            sub = player.submissions.get(room.round_index, {"weapon_id": "clarifier", "rebuttal": ""})
            evaluation = await judge(text, fallacy_types, sub["weapon_id"], sub["rebuttal"], room.language)
            battle = compute_battle_result(hit_score=evaluation.get("hit_score", 0))
            player.score += battle["damage"]
            round_result["players"].append(
                {
                    "nickname": player.nickname,
                    "weapon_id": sub["weapon_id"],
                    "rebuttal": sub["rebuttal"],
                    "hit_score": evaluation.get("hit_score", 0),
                    "damage": battle["damage"],
                    "total_score": round(player.score, 1),
                    "reason": evaluation.get("reason", ""),
                }
            )
        room.results.append(round_result)
        await self._broadcast(room, {"type": "round_result", "result": round_result})
        room.round_index += 1
        await self._start_round(room)

    async def _finish_game(self, room: Room) -> None:
        room.status = "finished"
        players = list(room.players.values())
        if len(players) == 2:
            winner = "draw"
            if players[0].score > players[1].score:
                winner = players[0].nickname
            elif players[1].score > players[0].score:
                winner = players[1].nickname
        else:
            winner = None
        await self._broadcast(
            room,
            {
                "type": "game_over",
                "winner": winner,
                "scores": [{"nickname": p.nickname, "score": round(p.score, 1)} for p in players],
                "results": room.results,
            },
        )

    async def _broadcast(self, room: Room, message: dict[str, Any]) -> None:
        data = message
        for player in room.players.values():
            try:
                await player.websocket.send_json(data)
            except Exception:
                pass


pvp_manager = PvPManager()
