import os
from celery import Celery
from app.database import SessionLocal
from app.models.schema import MagicImport, ImportStatus, Card, Deck
from app.services.extractor import process_content_to_atomic_cards
import hashlib

celery_app = Celery(
    "gizmo_worker",
    broker=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    backend=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
)

@celery_app.task(bind=True, max_retries=3)
def process_magic_import(self, import_id: str):
    """
    Background worker that processes a MagicImport job.
    Uses 'processed_chunks' to resume if a previous attempt failed.
    """
    db = SessionLocal()
    try:
        import_job = db.query(MagicImport).filter(MagicImport.id == import_id).first()
        if not import_job:
            return

        import_job.status = ImportStatus.PROCESSING
        db.commit()

        # Step 1: Read raw content and previously processed chunks
        raw_content = import_job.raw_content
        processed_chunks = import_job.processed_chunks or []

        # Step 2: Use LLM to extract atomic flashcards (with resume logic)
        # Assuming process_content_to_atomic_cards handles chunking and skipping 
        # already processed chunks.
        new_chunks = process_content_to_atomic_cards(raw_content, processed_chunks)
        
        # Checkpoint the JSONB progress incrementally if possible, but here we save at the end of the step
        import_job.processed_chunks = new_chunks
        db.commit()

        # Step 3: Insert into Cards table
        target_deck_id = import_job.target_deck_id
        if target_deck_id:
            for flashcard in new_chunks:
                # Create SHA-256 hash to prevent semantic duplication
                content_str = f"{flashcard['question']}|{flashcard['answer']}"
                content_hash = hashlib.sha256(content_str.encode('utf-8')).hexdigest()
                
                # Check for duplication
                existing = db.query(Card).filter(
                    Card.deck_id == target_deck_id,
                    Card.content_hash == content_hash
                ).first()
                
                if not existing:
                    card = Card(
                        deck_id=target_deck_id,
                        question=flashcard['question'],
                        answer=flashcard['answer'],
                        explanation=flashcard.get('explanation'),
                        difficulty_score=flashcard.get('difficulty_score', 0.5),
                        content_hash=content_hash,
                        # embedding will be generated synchronously or as a separate task
                    )
                    db.add(card)
            
            db.commit()

        # Step 4: Mark as completed
        import_job.status = ImportStatus.COMPLETED
        db.commit()
        
    except Exception as exc:
        db.rollback()
        import_job.status = ImportStatus.FAILED
        db.commit()
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
    finally:
        db.close()
