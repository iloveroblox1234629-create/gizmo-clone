import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, ForeignKey, 
    DateTime, Enum as SQLEnum, JSON, Index
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base
from pgvector.sqlalchemy import Vector

class User(Base):
    __tablename__ = 'users'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String, nullable=False)
    
    # Fast reads for gamification (Source of truth is gamification_ledger)
    cached_lives = Column(Integer, default=5)
    cached_xp = Column(Integer, default=0)
    
    max_lives = Column(Integer, default=5)
    last_life_refill_at = Column(DateTime(timezone=True), server_default=func.now())
    
    current_streak = Column(Integer, default=0)
    last_review_date = Column(DateTime(timezone=True), nullable=True)
    
    # FSRS weights
    fsrs_weights = Column(
        ARRAY(Float), 
        default=[0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61]
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    decks = relationship("Deck", back_populates="creator")
    ledger_entries = relationship("GamificationLedger", back_populates="user")
    memberships = relationship("DeckMembership", back_populates="user")


class TransactionType(enum.Enum):
    LIFE_USED = "LIFE_USED"
    LIFE_REFILL = "LIFE_REFILL"
    XP_EARNED = "XP_EARNED"
    STREAK_EXTENDED = "STREAK_EXTENDED"

class GamificationLedger(Base):
    __tablename__ = 'gamification_ledger'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    amount = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="ledger_entries")
    
    __table_args__ = (
        Index('idx_ledger_user_type', 'user_id', 'transaction_type'),
    )


class Deck(Base):
    __tablename__ = 'decks'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    creator_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete="SET NULL"))
    title = Column(String, nullable=False)
    is_public = Column(Boolean, default=False)
    source_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    creator = relationship("User", back_populates="decks")
    cards = relationship("Card", back_populates="deck", cascade="all, delete-orphan")
    memberships = relationship("DeckMembership", back_populates="deck", cascade="all, delete-orphan")


class RoleType(enum.Enum):
    OWNER = "OWNER"
    STUDENT = "STUDENT"

class DeckMembership(Base):
    __tablename__ = 'deck_memberships'

    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete="CASCADE"), primary_key=True)
    deck_id = Column(UUID(as_uuid=True), ForeignKey('decks.id', ondelete="CASCADE"), primary_key=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    role = Column(SQLEnum(RoleType), default=RoleType.STUDENT)

    user = relationship("User", back_populates="memberships")
    deck = relationship("Deck", back_populates="memberships")


class Card(Base):
    __tablename__ = 'cards'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    deck_id = Column(UUID(as_uuid=True), ForeignKey('decks.id', ondelete="CASCADE"), nullable=False)
    parent_card_id = Column(UUID(as_uuid=True), ForeignKey('cards.id', ondelete="SET NULL"), nullable=True)
    
    question = Column(String, nullable=False)
    answer = Column(String, nullable=False)
    explanation = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    difficulty_score = Column(Float, nullable=True)
    
    content_hash = Column(String(64), nullable=True)
    embedding = Column(Vector(1536)) # Assuming OpenAI embeddings dimensionality

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    deck = relationship("Deck", back_populates="cards")
    states = relationship("CardState", back_populates="card", cascade="all, delete-orphan")
    review_logs = relationship("ReviewLog", back_populates="card", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_deck_content_hash', 'deck_id', 'content_hash'),
    )


class CardState(Base):
    __tablename__ = 'card_states'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    card_id = Column(UUID(as_uuid=True), ForeignKey('cards.id', ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    
    stability = Column(Float, default=0.0)
    difficulty = Column(Float, default=0.0)
    elapsed_days = Column(Integer, default=0)
    scheduled_days = Column(Integer, default=0)
    reps = Column(Integer, default=0)
    lapses = Column(Integer, default=0)
    state = Column(Integer, default=0) # 0: New, 1: Learning, 2: Review, 3: Relearning
    
    last_review = Column(DateTime(timezone=True), nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)

    card = relationship("Card", back_populates="states")
    
    __table_args__ = (
        Index('idx_card_user_unique', 'card_id', 'user_id', unique=True),
    )


class ReviewLog(Base):
    __tablename__ = 'review_logs'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    card_id = Column(UUID(as_uuid=True), ForeignKey('cards.id', ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    
    rating = Column(Integer)
    stability = Column(Float)
    difficulty = Column(Float)
    elapsed_days = Column(Integer)
    scheduled_days = Column(Integer)
    review_duration_ms = Column(Integer)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    card = relationship("Card", back_populates="review_logs")


class ImportSourceType(enum.Enum):
    YOUTUBE = "YOUTUBE"
    PDF = "PDF"
    NOTION = "NOTION"
    WEB = "WEB"

class ImportStatus(enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class MagicImport(Base):
    __tablename__ = 'magic_imports'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    target_deck_id = Column(UUID(as_uuid=True), ForeignKey('decks.id', ondelete="SET NULL"), nullable=True)
    
    source_type = Column(SQLEnum(ImportSourceType), nullable=False)
    status = Column(SQLEnum(ImportStatus), default=ImportStatus.PENDING)
    
    raw_content = Column(String, nullable=True)
    processed_chunks = Column(JSONB, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
