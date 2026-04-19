from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.schema import CardState, ReviewLog, User
# Assume a generic FSRS library or similar logic
from fsrs import FSRS, Card as FSRSCard, Rating, ReviewLog as FSRSReviewLog

def process_review(db: Session, user_id: str, card_id: str, rating_val: int, review_duration_ms: int):
    """
    Processes a card review, updates the card_state using FSRS logic,
    and logs the review in review_logs.
    """
    # 1. Fetch user to get custom FSRS weights
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError("User not found")

    # 2. Initialize FSRS instance with user's weights
    fsrs_engine = FSRS()
    if user.fsrs_weights and len(user.fsrs_weights) == 17:
        fsrs_engine.p.w = tuple(user.fsrs_weights)

    # 3. Fetch current CardState
    state = db.query(CardState).filter(CardState.card_id == card_id, CardState.user_id == user_id).first()
    if not state:
        # Create a new default state if it doesn't exist
        state = CardState(card_id=card_id, user_id=user_id)
        db.add(state)
        db.commit()
        db.refresh(state)

    # 4. Map DB state to FSRS Card object
    fsrs_card = FSRSCard()
    fsrs_card.stability = state.stability
    fsrs_card.difficulty = state.difficulty
    fsrs_card.elapsed_days = state.elapsed_days
    fsrs_card.scheduled_days = state.scheduled_days
    fsrs_card.reps = state.reps
    fsrs_card.lapses = state.lapses
    fsrs_card.state = state.state
    
    # Optional: handle last_review time for exact elapsed_days
    now = datetime.now(timezone.utc)
    if state.last_review:
        fsrs_card.last_review = state.last_review

    # 5. Get the rating enum
    # Rating values: 1: Again, 2: Hard, 3: Good, 4: Easy
    try:
        rating = Rating(rating_val)
    except ValueError:
        rating = Rating.Good

    # 6. Execute FSRS scheduling
    scheduling_cards = fsrs_engine.repeat(fsrs_card, now)
    scheduled_record = scheduling_cards[rating]
    
    new_card = scheduled_record.card
    review_log = scheduled_record.review_log

    # 7. Update DB CardState
    state.stability = new_card.stability
    state.difficulty = new_card.difficulty
    state.elapsed_days = new_card.elapsed_days
    state.scheduled_days = new_card.scheduled_days
    state.reps = new_card.reps
    state.lapses = new_card.lapses
    state.state = new_card.state
    state.last_review = now
    state.due_date = new_card.due

    # 8. Create ReviewLog entry
    new_log = ReviewLog(
        card_id=card_id,
        user_id=user_id,
        rating=rating_val,
        stability=review_log.stability,
        difficulty=review_log.difficulty,
        elapsed_days=review_log.elapsed_days,
        scheduled_days=review_log.scheduled_days,
        review_duration_ms=review_duration_ms
    )
    db.add(new_log)

    # 9. Commit transactions
    db.commit()
    db.refresh(state)
    
    return state
