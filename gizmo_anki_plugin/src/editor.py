"""Editor integration: toolbar button and selection handling."""
from aqt import mw
from aqt.qt import QAction, QMenu, QIcon
from aqt.editor import Editor
from typing import Optional

from .dialog import GenerateDialog, ImportDialog
from . import config


# Will hold reference to editor button action
GIZMO_ACTION = None


def on_generate_clicked(editor: Editor):
    """Handle editor button click."""
    selected = editor.web.selectedText()
    if not selected:
        from aqt import QMessageBox
        QMessageBox.information(
            mw, "Gizmo AI",
            "Please select some text first, then click the Gizmo button."
        )
        return

    # Show generation dialog with selected text
    dlg = GenerateDialog(mw, selected)
    dlg.exec()


def on_import_clicked():
    """Handle import menu click."""
    if not mw or not mw.col:
        return
    dlg = ImportDialog(mw)
    dlg.exec()


def setup_editor_button():
    """Add Gizmo button to editor toolbar."""
    from anki.hooks import wrap
    from aqt.editor import Editor

    def add_gizmo_button(editor: Editor, buttons: list):
        """Add button to editor's button list."""
        if not config.get("ai_enabled"):
            return

        # Create icon (text-based)
        icon = "✨"  # Sparkles emoji

        btn = QAction(icon, "Gizmo AI", editor)
        btn.setToolTip("Generate flashcards from selected text (Gizmo AI)")
        btn.triggered.connect(lambda e=editor: on_generate_clicked(e))

        buttons.append(btn)

    # Monkey-patch Editor's setup_buttons
    original_setup = Editor.setup_buttons

    def wrapped_setup_buttons(self):
        original_setup(self)
        if config.get("ai_enabled"):
            add_gizmo_button(self, self._buttons)

    Editor.setup_buttons = wrapped_setup_buttons

    # Add menu item to Tools menu
    from aqt.qt import QAction as QAction2
    action = QAction2("Gizmo AI - Import...", mw)
    action.setToolTip("Import flashcards from various sources")
    action.triggered.connect(on_import_clicked)
    mw.form.menuTools.addAction(action)