from pydantic import BaseModel

class DummyUser(BaseModel):
    id: int
    email: str


def get_current_user() -> DummyUser:
    """
    Dummy auth:
    Pretend user is always logged in
    """
    return DummyUser(
        id=1,
        email="testuser@example.com"
    )
