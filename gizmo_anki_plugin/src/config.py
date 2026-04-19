"""Configuration management for Gizmo AI."""
import json
from pathlib import Path
from typing import Any, Dict

from aqt import mw

ADDON_DIR = Path(__file__).resolve().parent.parent
CONFIG_FILE = ADDON_DIR / "config.json"
SCHEMA_FILE = ADDON_DIR / "config.schema.json"

DEFAULT_CONFIG = {
    "ai_enabled": True,
    "tutor_enabled": True,
    "gamification_enabled": True,
    "gemini_api_key": "",
    "openai_api_key": "",
    "ai_model": "gemini",
    "tutor_feedback": True,
    "start_with_lives": 3,
    "xp_per_correct": 10,
    "xp_per_hard": 5,
    "streak_bonus_multiplier": 1.5,
    "overlay_position": "top-right"
}


def load_config() -> Dict[str, Any]:
    """Load add-on configuration from Anki's add-on manager."""
    try:
        # Try Anki's built-in config first
        user_config = mw.addonManager.getConfig(__name__.split('.')[0]) or {}
    except Exception:
        user_config = {}

    # Merge with defaults
    config = DEFAULT_CONFIG.copy()
    config.update(user_config)

    # Validate minimal schema
    if not isinstance(config.get("ai_enabled"), bool):
        config["ai_enabled"] = True
    if not isinstance(config.get("tutor_enabled"), bool):
        config["tutor_enabled"] = True
    if not isinstance(config.get("gamification_enabled"), bool):
        config["gamification_enabled"] = True

    return config


def save_config(config: Dict[str, Any]) -> bool:
    """Save add-on configuration."""
    try:
        mw.addonManager.writeConfig(__name__.split('.')[0], config)
        return True
    except Exception as e:
        print(f"Gizmo AI: Failed to save config: {e}")
        return False


def get(key: str, default: Any = None) -> Any:
    """Get a configuration value."""
    config = load_config()
    return config.get(key, default)


def set_(key: str, value: Any) -> bool:
    """Set a configuration value."""
    config = load_config()
    config[key] = value
    return save_config(config)


def update(updates: Dict[str, Any]) -> bool:
    """Update multiple configuration values."""
    config = load_config()
    config.update(updates)
    return save_config(config)