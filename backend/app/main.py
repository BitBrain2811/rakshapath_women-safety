# Triggering auto-reload watcher for build detection
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.routers import safety, routing, heatmap, auth

app = FastAPI(title="SafePath AI")

# CORS Middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(auth.router, prefix="/auth")
app.include_router(safety.router, prefix="/safety")
app.include_router(routing.router, prefix="/route")
app.include_router(heatmap.router, prefix="/heatmap")

# React Build serving setup
frontend_build_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend1", "build"))

if os.path.exists(frontend_build_dir):
    # Serve index.html on root path
    @app.get("/")
    def serve_react_root():
        return FileResponse(os.path.join(frontend_build_dir, "index.html"))
        
    # Serve static assets (js, css, media, etc.)
    app.mount("/", StaticFiles(directory=frontend_build_dir), name="frontend")
else:
    @app.get("/")
    def health():
        return {"status": "Backend running. Frontend build directory not found. Please compile frontend using npm run build."}