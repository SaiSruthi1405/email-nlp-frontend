from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware
from auth import router as auth_router
import os

app = FastAPI()

# Add SessionMiddleware BEFORE including routers
# Use a secure random string for secret_key
app.add_middleware(SessionMiddleware, secret_key="your_random_secret_key_12345")

# Include auth routes
app.include_router(auth_router)

@app.get("/")
def home():
    return {"message": "Backend running"}