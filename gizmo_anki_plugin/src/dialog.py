"""Dialogs for Gizmo AI: generation and configuration."""
import json
from typing import List, Dict
from aqt import mw, QMessageBox, QPushButton
from aqt.qt import (
    Qt, QDialog, QVBoxLayout, QHBoxLayout, QLabel, QTextEdit,
    QLineEdit, QSpinBox, QCheckBox, QComboBox, QDialogButtonBox,
    QTabWidget, QWidget, QListWidget, QListWidgetItem, QFileDialog,
    QProgressBar, QRadioButton, QButtonGroup, QGroupBox
)

from . import config
from .ai_client import generate_from_text
from .models import add_note
from .importer import import_quizlet, import_anki_csv, import_text, import_pdf, import_pptx, import_youtube


class GenerateDialog(QDialog):
    """Dialog to generate flashcards from selected text."""

    def __init__(self, parent, text: str = ""):
        super().__init__(parent)
        self.parent = parent
        self.text = text
        self.generated_cards: List[Dict] = []
        self.init_ui()

    def init_ui(self):
        self.setWindowTitle("Gizmo AI - Generate Flashcards")
        self.resize(700, 600)
        layout = QVBoxLayout(self)

        # Source text area
        layout.addWidget(QLabel("<b>Source Text</b>"))
        self.text_edit = QTextEdit()
        self.text_edit.setPlainText(self.text)
        self.text_edit.setPlaceholderText("Paste or type text here to generate flashcards...")
        layout.addWidget(self.text_edit)

        # Generation options
        options_layout = QHBoxLayout()
        options_layout.addWidget(QLabel("Number of cards:"))
        self.count_spin = QSpinBox()
        self.count_spin.setRange(1, 20)
        self.count_spin.setValue(5)
        options_layout.addWidget(self.count_spin)
        options_layout.addStretch()
        layout.addLayout(options_layout)

        # Generate button
        self.generate_btn = QPushButton("✨ Generate Flashcards")
        self.generate_btn.clicked.connect(self.generate)
        layout.addWidget(self.generate_btn)

        # Progress bar
        self.progress = QProgressBar()
        self.progress.setVisible(False)
        layout.addWidget(self.progress)

        # Preview area
        layout.addWidget(QLabel("<b>Preview & Edit</b>"))
        self.preview_list = QListWidget()
        self.preview_list.setDragDropMode(QListWidget.InternalMove)
        layout.addWidget(self.preview_list)

        # Action buttons
        btn_layout = QHBoxLayout()
        self.add_btn = QPushButton("Add to Anki")
        self.add_btn.clicked.connect(self.add_to_anki)
        self.add_btn.setEnabled(False)
        btn_layout.addWidget(self.add_btn)

        self.regenerate_btn = QPushButton("Regenerate")
        self.regenerate_btn.clicked.connect(self.generate)
        btn_layout.addWidget(self.regenerate_btn)

        btn_layout.addStretch()
        layout.addLayout(btn_layout)

        # Standard dialog buttons
        button_box = QDialogButtonBox(QDialogButtonBox.Close)
        button_box.rejected.connect(self.reject)
        layout.addWidget(button_box)

    def generate(self):
        """Generate flashcards from the current text."""
        text = self.text_edit.toPlainText().strip()
        if not text:
            QMessageBox.warning(self, "Error", "Please enter some text.")
            return

        count = self.count_spin.value()

        self.progress.setVisible(True)
        self.progress.setRange(0, 0)  # Indeterminate
        self.generate_btn.setEnabled(False)
        self.preview_list.clear()
        self.generated_cards = []

        try:
            success, cards, error = generate_from_text(text, count)
            if not success:
                QMessageBox.critical(self, "Generation Failed", error)
                return

            self.generated_cards = cards
            for card in cards:
                item = QListWidgetItem()
                item.setData(Qt.UserRole, card)
                # Display as "Q: ... A: ..."
                display = f"Q: {card.get('front', '')[:100]}...\nA: {card.get('back', '')[:100]}..."
                item.setText(display)
                self.preview_list.addItem(item)

            self.add_btn.setEnabled(len(cards) > 0)

        finally:
            self.progress.setVisible(False)
            self.generate_btn.setEnabled(True)

    def add_to_anki(self):
        """Add selected cards to Anki."""
        if not mw or not mw.col:
            QMessageBox.warning(self, "Error", "Anki collection not available.")
            return

        deck_id = mw.col.decks.current()["id"]
        added = 0

        for i in range(self.preview_list.count()):
            item = self.preview_list.item(i)
            card_data = item.data(Qt.UserRole)
            if card_data:
                note_fields = {
                    "Front": card_data.get("front", ""),
                    "Back": card_data.get("back", ""),
                    "Type": "AI-generated",
                    "AIHint": ""
                }
                try:
                    add_note(mw.col, deck_id, note_fields)
                    added += 1
                except Exception as e:
                    print(f"Failed to add note: {e}")

        QMessageBox.information(self, "Success", f"Added {added} cards to deck '{mw.col.decks.current()['name']}'")
        self.accept()


class ImportDialog(QDialog):
    """Dialog to import flashcards from various formats."""

    IMPORTERS = {
        "Text": import_text,
        "Quizlet TSV": import_quizlet,
        "Anki CSV": import_anki_csv,
        "PDF": import_pdf,
        "PowerPoint": import_pptx,
        "YouTube": import_youtube,
    }

    def __init__(self, parent):
        super().__init__(parent)
        self.setWindowTitle("Gizmo AI - Import Flashcards")
        self.resize(600, 500)
        self.init_ui()

    def init_ui(self):
        layout = QVBoxLayout(self)

        # Format selection
        layout.addWidget(QLabel("<b>Select Format</b>"))
        self.format_combo = QComboBox()
        for name in self.IMPORTERS:
            self.format_combo.addItem(name)
        layout.addWidget(self.format_combo)

        # File/URL input
        layout.addWidget(QLabel("Source:"))
        input_layout = QHBoxLayout()
        self.path_edit = QLineEdit()
        self.path_edit.setPlaceholderText("File path or URL...")
        input_layout.addWidget(self.path_edit)

        self.browse_btn = QPushButton("Browse...")
        self.browse_btn.clicked.connect(self.browse_file)
        input_layout.addWidget(self.browse_btn)
        layout.addLayout(input_layout)

        # Description
        self.desc_label = QLabel("")
        self.desc_label.setWordWrap(True)
        layout.addWidget(self.desc_label)
        self.format_combo.currentIndexChanged.connect(self.update_description)

        # Preview
        layout.addWidget(QLabel("<b>Preview</b>"))
        self.preview = QTextEdit()
        self.preview.setReadOnly(True)
        layout.addWidget(self.preview)

        # Buttons
        btn_layout = QHBoxLayout()
        self.import_btn = QPushButton("Import")
        self.import_btn.clicked.connect(self.import_cards)
        btn_layout.addWidget(self.import_btn)
        btn_layout.addStretch()
        layout.addLayout(btn_layout)

        self.update_description()

    def browse_file(self):
        """Open file browser."""
        path, _ = QFileDialog.getOpenFileName(
            self, "Select File", "",
            "All Files (*);;Text Files (*.txt);;CSV Files (*.csv);;PDF Files (*.pdf);;PowerPoint Files (*.pptx)"
        )
        if path:
            self.path_edit.setText(path)

    def update_description(self):
        """Update format description."""
        fmt = self.format_combo.currentText()
        descriptions = {
            "Text": "Plain text file with Q&A pairs separated by blank lines.",
            "Quizlet TSV": "Tab-separated file from Quizlet export (Term,Definition).",
            "Anki CSV": "CSV file with 'front' and 'back' columns.",
            "PDF": "PDF file - extracts text and generates cards.",
            "PowerPoint": "PowerPoint file - extracts text from slides.",
            "YouTube": "YouTube URL - fetches transcript and generates summary cards."
        }
        self.desc_label.setText(descriptions.get(fmt, ""))

    def import_cards(self):
        """Import cards from selected source."""
        fmt = self.format_combo.currentText()
        source = self.path_edit.text().strip()

        if not source:
            QMessageBox.warning(self, "Error", "Please specify a source.")
            return

        importer = self.IMPORTERS.get(fmt)
        if not importer:
            QMessageBox.warning(self, "Error", "Unsupported format.")
            return

        try:
            cards = importer(source)
            self.preview.setPlainText(f"Imported {len(cards)} cards:\n\n")
            for i, card in enumerate(cards[:10], 1):
                self.preview.append(f"{i}. Q: {card.get('front', '')[:80]}\n   A: {card.get('back', '')[:80]}\n")

            if len(cards) > 10:
                self.preview.append(f"\n... and {len(cards) - 10} more cards.")

            # Confirm addition
            reply = QMessageBox.question(
                self, "Confirm Import",
                f"Add {len(cards)} cards to current deck?",
                QMessageBox.Yes | QMessageBox.No
            )
            if reply == QMessageBox.Yes:
                deck_id = mw.col.decks.current()["id"]
                for card in cards:
                    add_note(mw.col, deck_id, card)
                mw.col.reset()
                QMessageBox.information(self, "Success", f"Added {len(cards)} cards.")
                self.accept()

        except Exception as e:
            QMessageBox.critical(self, "Import Failed", str(e))


class ConfigDialog(QDialog):
    """Configuration dialog for Gizmo AI."""

    def __init__(self, parent):
        super().__init__(parent)
        self.parent = parent
        self.setWindowTitle("Gizmo AI Configuration")
        self.resize(600, 500)
        self.init_ui()
        self.load_settings()

    def init_ui(self):
        layout = QVBoxLayout(self)

        # Tab widget
        tabs = QTabWidget()
        layout.addWidget(tabs)

        # General tab
        general_tab = QWidget()
        general_layout = QVBoxLayout(general_tab)

        general_layout.addWidget(QLabel("<b>Feature Toggles</b>"))
        self.ai_enabled_cb = QCheckBox("Enable AI flashcard generation")
        general_layout.addWidget(self.ai_enabled_cb)

        self.tutor_enabled_cb = QCheckBox("Enable AI tutor grading")
        general_layout.addWidget(self.tutor_enabled_cb)

        self.gamification_enabled_cb = QCheckBox("Enable gamification (lives, XP, streaks)")
        general_layout.addWidget(self.gamification_enabled_cb)

        general_layout.addWidget(QLabel("<b>Defaults</b>"))
        self.default_model_combo = QComboBox()
        self.default_model_combo.addItems(["gemini", "gpt-4", "gpt-3.5-turbo"])
        general_layout.addWidget(QLabel("Default AI Model:"))
        general_layout.addWidget(self.default_model_combo)

        self.overlay_position_combo = QComboBox()
        self.overlay_position_combo.addItems(["top-left", "top-right", "bottom-left", "bottom-right"])
        general_layout.addWidget(QLabel("Overlay Position:"))
        general_layout.addWidget(self.overlay_position_combo)

        tabs.addTab(general_tab, "General")

        # API Keys tab
        api_tab = QWidget()
        api_layout = QVBoxLayout(api_tab)

        api_layout.addWidget(QLabel("<b>API Keys</b>"))
        self.gemini_key_edit = QLineEdit()
        self.gemini_key_edit.setEchoMode(QLineEdit.Password)
        api_layout.addWidget(QLabel("Google AI API Key (Gemini):"))
        api_layout.addWidget(self.gemini_key_edit)

        self.openai_key_edit = QLineEdit()
        self.openai_key_edit.setEchoMode(QLineEdit.Password)
        api_layout.addWidget(QLabel("OpenAI API Key:"))
        api_layout.addWidget(self.openai_key_edit)

        api_layout.addWidget(QLabel(
            "Get keys from:\n"
            "• Gemini: https://makersuite.google.com\n"
            "• OpenAI: https://platform.openai.com"
        ))

        tabs.addTab(api_tab, "API Keys")

        # Gamification tab
        game_tab = QWidget()
        game_layout = QVBoxLayout(game_tab)

        game_layout.addWidget(QLabel("<b>Lives & Difficulty</b>"))
        self.start_lives_spin = QSpinBox()
        self.start_lives_spin.setRange(1, 10)
        game_layout.addWidget(QLabel("Starting Lives:"))
        game_layout.addWidget(self.start_lives_spin)

        game_layout.addWidget(QLabel("<b>XP & Rewards</b>"))
        self.xp_correct_spin = QSpinBox()
        self.xp_correct_spin.setRange(1, 100)
        game_layout.addWidget(QLabel("XP per Correct Answer:"))
        game_layout.addWidget(self.xp_correct_spin)

        self.xp_hard_spin = QSpinBox()
        self.xp_hard_spin.setRange(0, 50)
        game_layout.addWidget(QLabel("XP per Hard Answer:"))
        game_layout.addWidget(self.xp_hard_spin)

        self.streak_multiplier_spin = QSpinBox()
        self.streak_multiplier_spin.setRange(100, 500)
        self.streak_multiplier_spin.setSuffix("%")
        game_layout.addWidget(QLabel("Streak Bonus:"))
        game_layout.addWidget(self.streak_multiplier_spin)

        tabs.addTab(game_tab, "Gamification")

        # Tutor tab
        tutor_tab = QWidget()
        tutor_layout = QVBoxLayout(tutor_tab)

        tutor_layout.addWidget(QLabel("<b>Tutor Feedback</b>"))
        self.tutor_feedback_cb = QCheckBox("Show detailed feedback after each answer")
        tutor_layout.addWidget(self.tutor_feedback_cb)

        tutor_layout.addWidget(QLabel(
            "The AI tutor evaluates semantic accuracy and provides\n"
            "personalized feedback to help improve retention."
        ))

        tutor_layout.addStretch()
        tabs.addTab(tutor_tab, "Tutor")

        # Buttons
        button_box = QDialogButtonBox(
            QDialogButtonBox.Ok | QDialogButtonBox.Cancel | QDialogButtonBox.Apply
        )
        button_box.accepted.connect(self.accept)
        button_box.rejected.connect(self.reject)
        button_box.button(QDialogButtonBox.Apply).clicked.connect(self.apply_settings)
        layout.addWidget(button_box)

    def load_settings(self):
        """Load current settings."""
        cfg = config.load_config()

        self.ai_enabled_cb.setChecked(cfg.get("ai_enabled", True))
        self.tutor_enabled_cb.setChecked(cfg.get("tutor_enabled", True))
        self.gamification_enabled_cb.setChecked(cfg.get("gamification_enabled", True))

        model = cfg.get("ai_model", "gemini")
        idx = self.default_model_combo.findText(model)
        if idx >= 0:
            self.default_model_combo.setCurrentIndex(idx)

        position = cfg.get("overlay_position", "top-right")
        idx = self.overlay_position_combo.findText(position)
        if idx >= 0:
            self.overlay_position_combo.setCurrentIndex(idx)

        self.gemini_key_edit.setText(cfg.get("gemini_api_key", ""))
        self.openai_key_edit.setText(cfg.get("openai_api_key", ""))

        self.start_lives_spin.setValue(cfg.get("start_with_lives", 3))
        self.xp_correct_spin.setValue(cfg.get("xp_per_correct", 10))
        self.xp_hard_spin.setValue(cfg.get("xp_per_hard", 5))
        self.streak_multiplier_spin.setValue(int(cfg.get("streak_bonus_multiplier", 1.5) * 100))

        self.tutor_feedback_cb.setChecked(cfg.get("tutor_feedback", True))

    def apply_settings(self):
        """Apply current settings without closing."""
        updates = {
            "ai_enabled": self.ai_enabled_cb.isChecked(),
            "tutor_enabled": self.tutor_enabled_cb.isChecked(),
            "gamification_enabled": self.gamification_enabled_cb.isChecked(),
            "ai_model": self.default_model_combo.currentText(),
            "overlay_position": self.overlay_position_combo.currentText(),
            "gemini_api_key": self.gemini_key_edit.text().strip(),
            "openai_api_key": self.openai_key_edit.text().strip(),
            "start_with_lives": self.start_lives_spin.value(),
            "xp_per_correct": self.xp_correct_spin.value(),
            "xp_per_hard": self.xp_hard_spin.value(),
            "streak_bonus_multiplier": self.streak_multiplier_spin.value() / 100,
            "tutor_feedback": self.tutor_feedback_cb.isChecked(),
        }
        config.update(updates)
        QMessageBox.information(self, "Settings", "Settings saved successfully.")

    def accept(self):
        """Save and close."""
        self.apply_settings()
        super().accept()