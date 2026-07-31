from app.config import Settings


def test_settings_defaults():
    s = Settings(_env_file=None)
    assert s.APP_NAME == "Quantora AI Service"
    assert s.APP_VERSION == "0.0.1"
    assert s.ENVIRONMENT == "development"
    assert s.DEBUG is True
    assert s.REDIS_URL == "redis://localhost:6379"
    assert s.OPENAI_API_KEY is None
    assert s.ANTHROPIC_API_KEY is None
    assert "http://localhost:4200" in s.CORS_ORIGINS


def test_settings_env_overrides(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("DEBUG", "false")
    monkeypatch.setenv("REDIS_URL", "redis://cache.internal:6379")
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test")
    s = Settings(_env_file=None)
    assert s.ENVIRONMENT == "production"
    assert s.DEBUG is False
    assert s.REDIS_URL == "redis://cache.internal:6379"
    assert s.OPENAI_API_KEY == "sk-test"


def test_settings_empty_db_urls_default_to_empty():
    s = Settings(_env_file=None)
    assert s.MONGODB_URL == ""
    assert s.POSTGRES_URL == ""
    assert s.SUPABASE_URL is None
