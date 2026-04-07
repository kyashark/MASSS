from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """Convert a plain password to a bcrypt hash for storage."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check if a plain password matches a stored hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: int) -> str:
    """
    Create a signed JWT token containing the user_id.
    Expires after ACCESS_TOKEN_EXPIRE_MINUTES (default 24 hours).
    """
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),  # "sub" is standard JWT for subject (user)
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def decode_access_token(token: str) -> int:
    """
    Decode a JWT token and return the user_id.
    Raises JWTError if the token is invalid or expired.
    """
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    user_id = payload.get("sub")
    if user_id is None:
        raise JWTError("Token missing subject")
    return int(user_id)
