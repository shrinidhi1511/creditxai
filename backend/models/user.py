from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.sqlite import TEXT
from datetime import datetime, timezone
import uuid
from backend.database.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(TEXT, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    email = Column(String(200), unique=True, nullable=False, index=True)
    hashed_password = Column(String(200), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
