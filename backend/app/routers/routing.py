from fastapi import APIRouter
from app.services.route_engine import get_safest_route

router = APIRouter()

@router.post("/safest")
def safest_route(payload: dict):
    start = payload["start"]
    end = payload["end"]
    hour = payload["hour"]

    safest, all_routes = get_safest_route(start, end, hour)

    return {
        "safest_route": safest,
        "all_routes": all_routes
    }