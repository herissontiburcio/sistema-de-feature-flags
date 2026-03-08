from app.database import init_db, get_engine
from app.models import Flag, Audit
from sqlmodel import Session


def seed():
    init_db()
    engine = get_engine()
    with Session(engine) as session:
        exists = session.exec(
            "SELECT COUNT(1) FROM flag WHERE key = 'nova-homepage'"
        ).one()
        if exists and exists[0] > 0:
            print('Seed já existe: nova-homepage')
            return
        f = Flag(key="nova-homepage", description="Flag de exemplo", enabled=False, rollout=10, environment="prod")
        session.add(f)
        session.commit()
        session.refresh(f)
        a = Audit(flag_id=f.id, action="seed", changed_by="seed-script", changes={"created": True})
        session.add(a)
        session.commit()
    print("Seed inserido: nova-homepage")


if __name__ == '__main__':
    seed()
