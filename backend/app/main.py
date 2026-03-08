from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Session, select
from .database import init_db, get_engine
from .models import Flag, Audit
from .schemas import FlagCreate, FlagUpdate, EvaluateRequest
from sqlmodel import Session
from datetime import datetime
from .utils import is_user_in_rollout

app = FastAPI(title="Feature Flags API")


@app.on_event("startup")
def on_startup():
    init_db()


def get_session():
    engine = get_engine()
    with Session(engine) as session:
        yield session


@app.post("/api/flags", response_model=Flag)
def create_flag(payload: FlagCreate, session: Session = Depends(get_session)):
    flag = Flag(**payload.dict())
    session.add(flag)
    session.commit()
    session.refresh(flag)
    audit = Audit(flag_id=flag.id, action="create", changes=payload.dict())
    session.add(audit)
    session.commit()
    return flag


@app.get("/api/flags")
def list_flags(environment: str = None, session: Session = Depends(get_session)):
    q = select(Flag)
    if environment:
        q = q.where(Flag.environment == environment)
    flags = session.exec(q).all()
    return flags


@app.patch("/api/flags/{flag_id}", response_model=Flag)
def update_flag(flag_id: int, payload: FlagUpdate, session: Session = Depends(get_session)):
    flag = session.get(Flag, flag_id)
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
    original = flag.dict()
    updates = payload.dict(exclude_unset=True)
    for k, v in updates.items():
        setattr(flag, k, v)
    flag.updated_at = datetime.utcnow()
    session.add(flag)
    session.commit()
    session.refresh(flag)
    changes = {"before": original, "after": flag.dict()}
    audit = Audit(flag_id=flag.id, action="update", changes=changes)
    session.add(audit)
    session.commit()
    return flag


@app.get("/api/flags/{flag_id}/audit")
def flag_audit(flag_id: int, session: Session = Depends(get_session)):
    q = select(Audit).where(Audit.flag_id == flag_id).order_by(Audit.timestamp.desc())
    items = session.exec(q).all()
    return items


@app.post("/api/flags/evaluate")
def evaluate(req: EvaluateRequest, session: Session = Depends(get_session)):
    q = select(Flag).where(Flag.key == req.key, Flag.environment == req.environment)
    flag = session.exec(q).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
    if not flag.enabled or flag.rollout == 0:
        return {"enabled": flag.enabled, "in_rollout": False}
    in_rollout = is_user_in_rollout(req.user_id, flag.rollout)
    return {"enabled": flag.enabled, "in_rollout": in_rollout}
