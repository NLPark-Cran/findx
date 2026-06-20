from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+asyncpg://findx_user:findx_password@localhost:5432/findx"
    redis_url: str = "redis://localhost:6379/0"

    tokendance_api_key: str = ""
    tokendance_base_url: str = "https://tokendance.space/gateway/v1"
    tokendance_model: str = "qwen3.7-max"

    minimax_api_key: str = ""
    minimax_base_url: str = "https://api.minimaxi.com/v1"

    backend_port: int = 8006
    frontend_url: str = "https://findx.hub.tt2.li"

    @property
    def async_database_url(self) -> str:
        return self.database_url


settings = Settings()
