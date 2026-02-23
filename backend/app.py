from datetime import timedelta

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm
from pathlib import Path
from pydantic import BaseModel

from .model_utils import summarize_text_dynamic
from .auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    fake_users_db,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

app = FastAPI(title="AI Text Summarizer")

# Resolve paths relative to this file so the app works from any working directory
BASE_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(BASE_DIR.parent / "frontend"))
app.mount(
    "/static",
    StaticFiles(directory=str(BASE_DIR.parent / "frontend" / "static")),
    name="static",
)

# Allow all origins during development; restrict in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request models ────────────────────────────────────────────────────────────

class TextRequest(BaseModel):
    text: str


class RegisterRequest(BaseModel):
    username: str
    password: str


# ── Public routes ─────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    """Serve the main frontend page."""
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/auth/register", status_code=201)
def register(body: RegisterRequest):
    """Create a new user. Returns 400 if the username is already taken."""
    if not body.username.strip() or not body.password:
        raise HTTPException(status_code=422, detail="Username and password are required")
    if body.username in fake_users_db:
        raise HTTPException(status_code=400, detail="Username already taken")
    fake_users_db[body.username] = hash_password(body.password)
    return {"message": "User registered successfully"}


@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Validate credentials and return a Bearer JWT. Uses OAuth2 form encoding."""
    hashed = fake_users_db.get(form_data.username)
    if not hashed or not verify_password(form_data.password, hashed):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token(
        data={"sub": form_data.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": token, "token_type": "bearer"}


# ── Protected routes ──────────────────────────────────────────────────────────

@app.post("/summarize")
async def summarize(
    request: TextRequest,
    current_user: str = Depends(get_current_user),
):
    """Accept raw text and return a model-generated summary. Requires a valid JWT."""
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        summary = summarize_text_dynamic(request.text)
        return {"summary": summary, "user": current_user}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)