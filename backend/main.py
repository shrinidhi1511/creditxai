from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database.db import init_db
from backend.routes.auth import router as auth_router
from backend.routes.applications import router as app_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    await init_db()
    # Pre-load / train the ML model at startup
    from backend.ml.train import load_or_train
    load_or_train()
    yield


app = FastAPI(title="CreditXAI API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(app_router)


@app.get("/")
async def root():
    return {"message": "CreditXAI API is running 🧠"}
