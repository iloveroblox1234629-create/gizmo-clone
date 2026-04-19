"""
Gizmo AI - AI-powered flashcard generation and tutoring for Anki.
"""
from pathlib import Path

from aqt import mw
from aqt.qt import qconnect, QAction

from .src import config
from .src.dialog import GenerateDialog
from .src.reviewer import init_reviewer_hooks
from .src.gamification import GamificationManager
from .src.editor import setup_editor_button
from .src.importer import setup_import_hooks

# Initialize config
config.load_config()

# Initialize gamification manager
gamification = GamificationManager()


def setup_menu() -> None:
    """Add Gizmo menu items."""
    menu = mw.form.menuTools.addMenu("Gizmo AI")

    action = QAction("Generate from Selection", mw)
    qconnect(action.triggered, show_generate_dialog)
    menu.addAction(action)

    config_action = QAction("Configure Gizmo", mw)
    from .src.dialog import ConfigDialog
    qconnect(config_action.triggered, lambda: ConfigDialog(mw).exec())
    menu.addAction(config_action)


def show_generate_dialog() -> None:
    """Show the AI generation dialog."""
    if not config.get("ai_enabled"):
        from aqt import QMessageBox
        QMessageBox.warning(mw, "Gizmo AI", "AI features are disabled in settings.")
        return

    if not (config.get("gemini_api_key") or config.get("openai_api_key")):
        from aqt import QMessageBox
        QMessageBox.warning(mw, "Gizmo AI",
                          "Please configure your API key in Tools → Add-ons → Gizmo → Config")
        return

    GenerateDialog(mw).exec()


# Initialize hooks
def init() -> None:
    """Initialize all add-on components."""
    # Setup menu
    setup_menu()

    # Setup editor button
    setup_editor_button()

    # Setup reviewer hooks (AI tutor + gamification)
    init_reviewer_hooks(gamification)

    # Setup import hooks
    setup_import_hooks()


# Anki add-on entry point
init()