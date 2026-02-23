"""
auth.py — JWT authentication helpers for the LLM Text Summarizer API.

In-memory user store (lost on restart) is intentional for dev/demo use.
Swap `fake_users_db` for a persistent DB in production.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# ── Config ────────────────────────────────────────────────────────────────────
import os
from dotenv import load_dotenv

load_dotenv()

# In production, load SECRET_KEY from an environment variable / secrets manager.
SECRET_KEY = os.environ.get("SECRET_KEY", "user123456")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# ── Internals ─────────────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Simple in-memory store: { username: hashed_password }
fake_users_db: dict[str, str] = {}


# ── Helpers ───────────────────────────────────────────────────────────────────
def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ── FastAPI dependency ────────────────────────────────────────────────────────
def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    """
    Validate the Bearer JWT and return the username (subject claim).
    Raises HTTP 401 on any validation failure.
    """
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str | None = payload.get("sub")
        if username is None:
            raise credentials_exc
    except JWTError:
        raise credentials_exc

    if username not in fake_users_db:
        raise credentials_exc

    return username
