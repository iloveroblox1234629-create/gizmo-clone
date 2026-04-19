"""Gamification system: lives, streaks, XP."""
import json
from datetime import datetime, date
from typing import Dict
from aqt import mw
from aqt.qt import Qt, QTimer, QWidget, QLabel, QHBoxLayout, QVBoxLayout, QPushButton


class GamificationManager:
    """Manages gamification state across review sessions."""

    STATE_KEYS = ["lives", "xp", "level", "streak_days", "last_study_date", "total_correct"]

    def __init__(self):
        self.state: Dict = {}
        self.overlay_widget = None
        self.load_state()

    def load_state(self):
        """Load gamification state from Anki's add-on config."""
        raw = mw.addonManager.getConfig(__name__.split('.')[0]) or {}
        self.state = {k: raw.get(k, self._get_default(k)) for k in self.STATE_KEYS}

    def save_state(self):
        """Save gamification state."""
        cfg = config.load_config()
        cfg.update(self.state)
        config.save_config(cfg)

    def _get_default(self, key: str):
        defaults = {
            "lives": config.get("start_with_lives", 3),
            "xp": 0,
            "level": 1,
            "streak_days": 0,
            "last_study_date": None,
            "total_correct": 0
        }
        return defaults[key]

    # Lives management
    def lose_life(self) -> bool:
        """Lose one life. Returns False if out of lives."""
        self.state["lives"] -= 1
        self._check_streak()
        self.save_state()
        return self.state["lives"] > 0

    def gain_life(self) -> bool:
        """Gain one life, up to max."""
        max_lives = config.get("start_with_lives", 3)
        if self.state["lives"] < max_lives:
            self.state["lives"] += 1
            self.save_state()
        return self.state["lives"] > 0

    def reset_lives(self):
        """Reset lives at start of new session."""
        self.state["lives"] = config.get("start_with_lives", 3)
        self._check_streak()
        self.save_state()

    def is_alive(self) -> bool:
        """Check if player has lives remaining."""
        return self.state["lives"] > 0

    # XP & Level
    def add_xp(self, amount: int):
        """Add XP and possibly level up."""
        self.state["xp"] += amount
        self._check_level()
        self.save_state()

    def _check_level(self):
        """Level up if XP threshold reached."""
        xp_needed = self.state["level"] * 100
        while self.state["xp"] >= xp_needed:
            self.state["xp"] -= xp_needed
            self.state["level"] += 1
            xp_needed = self.state["level"] * 100

    def get_level_progress(self) -> tuple:
        """Get (current XP, XP needed for next level)."""
        xp_needed = self.state["level"] * 100
        return self.state["xp"], xp_needed

    # Streak management
    def _check_streak(self):
        """Update daily streak based on last study date."""
        today = date.today().isoformat()
        last_date = self.state.get("last_study_date")

        if last_date != today:
            # Check if it's a consecutive day
            if last_date:
                last = date.fromisoformat(last_date)
                if (date.today() - last).days == 1:
                    # Consecutive - increment streak
                    self.state["streak_days"] += 1
                elif (date.today() - last).days > 1:
                    # Streak broken
                    self.state["streak_days"] = 1
            else:
                # First time
                self.state["streak_days"] = 1

            self.state["last_study_date"] = today

    def get_streak_multiplier(self) -> float:
        """Get current streak XP multiplier."""
        base = config.get("streak_bonus_multiplier", 1.5)
        return 1 + (self.state["streak_days"] - 1) * (base - 1)

    # Statistics
    def record_correct(self, difficulty: str = "normal"):
        """Record a correct answer."""
        self.state["total_correct"] += 1
        self._check_streak()

        # Award XP
        xp_amount = config.get("xp_per_correct", 10)
        if difficulty == "hard":
            xp_amount = config.get("xp_per_hard", 5)

        # Apply streak multiplier
        multiplier = self.get_streak_multiplier()
        xp_amount = int(xp_amount * multiplier)

        self.add_xp(xp_amount)
        self.save_state()

    def get_stats(self) -> Dict:
        """Get formatted stats string."""
        return {
            "lives": self.state["lives"],
            "xp": self.state["xp"],
            "level": self.state["level"],
            "streak": self.state["streak_days"],
            "total": self.state["total_correct"]
        }

    # Overlay UI
    def create_overlay(self, parent: QWidget) -> QWidget:
        """Create the gamification overlay widget."""
        from aqt.qt import Qt

        self.overlay_widget = QWidget(parent)
        self.overlay_widget.setWindowFlags(Qt.WindowStaysOnTopHint | Qt.FramelessWindowHint)
        self.overlay_widget.setAttribute(Qt.WA_TranslucentBackground)

        layout = QVBoxLayout(self.overlay_widget)
        layout.setContentsMargins(8, 8, 8, 8)

        # Stats label
        self.stats_label = QLabel()
        self.stats_label.setStyleSheet("""
            QLabel {
                color: white;
                background: rgba(0, 0, 0, 0.8);
                padding: 8px 12px;
                border-radius: 6px;
                font-weight: bold;
                font-size: 12px;
            }
        """)
        layout.addWidget(self.stats_label)

        self.update_overlay()
        self.position_overlay()
        return self.overlay_widget

    def update_overlay(self):
        """Update overlay text."""
        stats = self.get_stats()
        text = f"❤️ {stats['lives']} | ⭐ Lvl {stats['level']} | 🔥 {stats['streak']}d"
        if self.overlay_widget:
            self.stats_label.setText(text)

    def position_overlay(self):
        """Position the overlay in the configured corner."""
        if not self.overlay_widget:
            return

        from aqt.qt import Qt
        position = config.get("overlay_position", "top-right")
        screen = self.overlay_widget.screen().availableGeometry()

        # Let the widget size itself first
        self.overlay_widget.adjustSize()
        size = self.overlay_widget.size()

        x, y = 10, 10
        if "right" in position:
            x = screen.width() - size.width() - 10
        if "bottom" in position:
            y = screen.height() - size.height() - 10

        self.overlay_widget.move(x, y)


def init_overlay(reviewer) -> GamificationManager:
    """Initialize gamification overlay on reviewer."""
    gamification = GamificationManager()
    overlay = gamification.create_overlay(reviewer)

    # Show overlay and position it
    overlay.show()
    overlay.raise_()

    # Re-position when reviewer is shown
    from aqt.qt import QTimer
    def reposition():
        gamification.position_overlay()
        overlay.show()
        overlay.raise_()

    QTimer.singleShot(100, reposition)

    return gamification