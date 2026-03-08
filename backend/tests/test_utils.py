from app.utils import is_user_in_rollout


def test_rollout_zero():
    assert not is_user_in_rollout("user-1", 0)


def test_rollout_full():
    assert is_user_in_rollout("any-user", 100)


def test_determinism():
    # mesma user_id e rollout devem produzir resultado determinístico
    r1 = is_user_in_rollout("user-123", 10)
    r2 = is_user_in_rollout("user-123", 10)
    assert r1 == r2


def test_edge_values():
    # rollout 1 ainda aceita alguns usuários
    assert isinstance(is_user_in_rollout("u1", 1), bool)
    assert isinstance(is_user_in_rollout("u2", 99), bool)
