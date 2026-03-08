from typing import Optional
from pydantic import BaseModel


class FlagCreate(BaseModel):
    key: str
    description: Optional[str] = None
    enabled: Optional[bool] = False
    rollout: Optional[int] = 0
    environment: Optional[str] = "prod"


class FlagUpdate(BaseModel):
    enabled: Optional[bool]
    rollout: Optional[int]
    description: Optional[str]
    environment: Optional[str]


class EvaluateRequest(BaseModel):
    key: str
    user_id: str
    environment: Optional[str] = "prod"
