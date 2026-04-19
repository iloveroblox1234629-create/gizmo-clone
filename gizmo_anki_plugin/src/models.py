"""Models and note type management for Gizmo AI."""
from typing import Optional, Dict
from aqt import mw
from anki.collection import Collection
from anki.models import NotetypeDict


NOTE_TYPE_NAME = "Gizmo-AI"
FIELDS = ["Front", "Back", "Type", "AIHint"]


def create_note_type(col: Collection) -> NotetypeDict:
    """Create the Gizmo-AI note type if it doesn't exist."""
    # Check if already exists
    existing = col.models.by_name(NOTE_TYPE_NAME)
    if existing:
        return existing

    # Create new note type
    nt = col.models.new(NOTE_TYPE_NAME)

    # Add fields
    for field_name in FIELDS:
        field = col.models.new_field(field_name)
        col.models.add_field(nt, field)

    # Add card template
    t = col.models.new_template("Card 1")
    t["qfmt"] = """
<div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 20px; padding: 20px;">
{{Front}}
</div>
"""
    t["afmt"] = """
<div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 20px; padding: 20px;">
{{Front}}

<hr style="margin: 20px 0; border: none; border-top: 2px solid #ddd;" />

<div id="answer" style="color: #2d5a27;">
{{Back}}
</div>

{{#Type}}
<div style="font-size: 12px; color: #888; margin-top: 10px;">
Type: {{Type}}
</div>
{{/Type}}

{{#AIHint}}
<div style="font-size: 12px; color: #aaa; margin-top: 5px;">
Hint: {{AIHint}}
</div>
{{/AIHint}}
</div>
"""
    col.models.add_template(nt, t)

    # Set styling
    nt["css"] = """
.card {
  font-family: 'Segoe UI', Arial, sans-serif;
  font-size: 20px;
  text-align: center;
  color: black;
  background-color: white;
}

#answer {
  color: #2d5a27;
  font-weight: bold;
}

.highlight {
  background-color: #ffeb3b;
  padding: 2px;
}

.gamification-overlay {
  position: fixed;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 6px;
  font-size: 14px;
  font-weight: bold;
  z-index: 1000;
}
"""

    col.models.add(nt)
    return nt


def add_note(col: Collection, deck_id: int, fields: Dict[str, str]) -> Optional[int]:
    """Add a new Gizmo note to the collection."""
    nt = col.models.by_name(NOTE_TYPE_NAME)
    if not nt:
        nt = create_note_type(col)

    note = col.new_note(nt)

    # Set fields
    for field_name in FIELDS:
        if field_name in fields:
            note[field_name] = fields[field_name]

    # Add note
    col.add_note(note, deck_id)
    return note.id


def get_note_type() -> Optional[NotetypeDict]:
    """Get the Gizmo note type if it exists."""
    return mw.col.models.by_name(NOTE_TYPE_NAME) if mw.col else None