import hashlib


def is_user_in_rollout(user_id: str, rollout: int) -> bool:
    """Deterministicamente decide se `user_id` está dentro do rollout (0-100)."""
    if rollout <= 0:
        return False
    if rollout >= 100:
        return True
    h = int(hashlib.sha256(user_id.encode()).hexdigest(), 16) % 100
    return h < int(rollout)
