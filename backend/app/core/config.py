from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "MetricsNumero"
    app_env: str = "development"
    debug: bool = True

    database_url: str

    redis_url: str

    access_secret_key: str

    refresh_secret_key: str

    upload_dir: str = "uploads"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()