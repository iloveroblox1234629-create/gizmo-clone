"""Reviewer integration: AI tutor feedback and gamification overlay."""
from typing import Optional
from aqt import mw, QMessageBox, QTimer
from aqt.reviewer import Reviewer
from aqt.qt import Qt, QWidget, QLabel, QVBoxLayout, QPushButton

from . import config
from .ai_client import grade_answer
from .gamification import init_overlay, GamificationManager


# Current reviewer state
_current_reviewer: Optional[Reviewer] = None
_gamification: Optional[GamificationManager] = None
_overlay: Optional[QWidget] = None
_feedback_shown = False


def init_reviewer_hooks(gamification: GamificationManager):
    """Initialize reviewer hooks."""
    global _gamification
    _gamification = gamification

    # Hook into reviewer initialization
    from aqt import gui_hooks
    gui_hooks.reviewer_did_show_question.append(on_question_shown)
    gui_hooks.reviewer_did_answer_card.append(on_answer_given)
    gui_hooks.reviewer_will_end.append(on_reviewer_end)

    # Hook into profile load to reset gamification session
    from anki.hooks import addHook
    addHook("profileLoaded", reset_session)

    print("Gizmo AI: Reviewer hooks initialized")


def reset_session():
    """Reset lives for new session."""
    _gamification.reset_lives()
    print(f"Gizmo AI: Gamification session reset. Lives: {_gamification.state['lives']}")


def on_question_shown(card, reviewer: Reviewer):
    """Called when a question is shown."""
    global _current_reviewer, _feedback_shown
    _current_reviewer = reviewer
    _feedback_shown = False

    # Ensure overlay is visible
    if config.get("gamification_enabled"):
        global _overlay
        if _overlay is None:
            _overlay = init_overlay(reviewer)
        else:
            _overlay.show()
            _overlay.raise_()
        _gamification.update_overlay()


def on_answer_given(reviewer: Reviewer, card, ease: int):
    """Called after user answers a card."""
    global _feedback_shown
    if _feedback_shown:
        return

    _feedback_shown = True

    # Update gamification
    if config.get("gamification_enabled"):
        difficulty = {1: "again", 2: "hard", 3: "good", 4: "easy"}.get(ease, "normal")
        if difficulty in ("good", "easy"):
            _gamification.record_correct(difficulty)
        elif difficulty == "hard":
            _gamification.record_correct("hard")
        else:
            # Lose life for 'again'
            _gamification.lose_life()
        _gamification.update_overlay()

        # Check for game over
        if not _gamification.is_alive():
            QTimer.singleShot(500, show_game_over)
            return

    # Show AI tutor feedback
    if config.get("tutor_enabled") and config.get("tutor_feedback"):
        QTimer.singleShot(300, lambda: show_tutor_feedback(reviewer, card))


def on_reviewer_end():
    """Called when review session ends."""
    global _overlay
    if _overlay:
        _overlay.hide()


def show_tutor_feedback(reviewer: Reviewer, card):
    """Show AI tutor feedback after answering."""
    try:
        question = card.note()["Front"]
        correct = card.note()["Back"]
        # Get user's answer from reviewer state
        user_answer = getattr(reviewer, "typedAnswer", "") or ""

        if not user_answer:
            # Can't grade if no answer recorded
            return

        success, result, error = grade_answer(question, correct, user_answer)

        if not success:
            print(f"Gizmo AI tutor error: {error}")
            return

        # Create feedback dialog
        from aqt.qt import QDialog, QVBoxLayout, QLabel, QTimer
        dlg = QDialog(reviewer)
        dlg.setWindowTitle("Gizmo AI Tutor")
        dlg.setModal(False)  # Non-blocking
        layout = QVBoxLayout(dlg)

        # Score display
        score = result.get("semantic_score", 0)
        accuracy = result.get("accuracy", 0)
        completeness = result.get("completeness", 0)
        conciseness = result.get("conciseness", 0)

        score_color = "#2d5a27" if score >= 80 else "#f57c00" if score >= 60 else "#c01c28"
        score_label = QLabel(
            f'<h1 style="color:{score_color}">{score:.0f}%</h1>'
            f'<p>Semantic Accuracy</p>'
        )
        score_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(score_label)

        # Breakdown
        breakdown = QLabel(
            f"Accuracy: {accuracy:.0f}%<br>"
            f"Completeness: {completeness:.0f}%<br>"
            f"Conciseness: {conciseness:.0f}%"
        )
        breakdown.setWordWrap(True)
        layout.addWidget(breakdown)

        # Feedback
        feedback = result.get("feedback", "Good job!")
        feedback_label = QLabel(f"<b>Feedback:</b> {feedback}")
        feedback_label.setWordWrap(True)
        layout.addWidget(feedback_label)

        # Position dialog
        if reviewer and hasattr(reviewer, 'window'):
            r = reviewer.window().frameGeometry()
            dlg.move(r.x() + 50, r.y() + 100)

        # Auto-close after 4 seconds
        QTimer.singleShot(4000, dlg.close)
        dlg.show()

    except Exception as e:
        print(f"Gizmo AI tutor error: {e}")


def show_game_over():
    """Show game over screen."""
    from aqt.qt import QMessageBox
    stats = _gamification.get_stats()

    msg = QMessageBox()
    msg.setIcon(QMessageBox.Warning)
    msg.setWindowTitle("💀 Game Over")
    msg.setText("You've run out of lives!")
    msg.setInformativeText(
        f"Session Stats:\n"
        f"  Cards answered: {stats['total']}\n"
        f"  Current level: {stats['level']}\n"
        f"  Streak: {stats['streak']} days\n\n"
        f"Lives will reset after a break."
    )
    msg.exec()


def update_overlay():
    """Update gamification overlay display."""
    if _gamification:
        _gamification.update_overlay()