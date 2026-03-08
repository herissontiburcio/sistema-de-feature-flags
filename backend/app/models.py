from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field, Column, JSON


class Flag(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    key: str = Field(index=True)
    description: Optional[str] = None
    enabled: bool = Field(default=False)
    rollout: int = Field(default=0)
    environment: str = Field(default="prod")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Audit(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    flag_id: int = Field(index=True)
    action: str
    changed_by: Optional[str] = None
    changes: Optional[dict] = Field(sa_column=Column(JSON), default=None)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
