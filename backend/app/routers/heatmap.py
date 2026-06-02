from fastapi import APIRouter
from app.services.heatmap_engine import generate_heatmap

router = APIRouter()

@router.get("/area")
def area_heatmap(
    lat: float,
    lon: float,
    hour: int,
    radius_km: float = 1
):
    heatmap = generate_heatmap(lat, lon, hour, radius_km)

    return {
        "center": {"lat": lat, "lon": lon},
        "radius_km": radius_km,
        "points": heatmap
    }