from app.utils.geo import generate_grid
from app.services.safety_engine import compute_safety_score

def generate_heatmap(lat, lon, hour, radius_km=1):
    grid = generate_grid(lat, lon, radius_km)
    heatmap = []

    for point in grid:
        score, level, _ = compute_safety_score(
            point["lat"],
            point["lon"],
            hour
        )

        heatmap.append({
            "lat": round(point["lat"], 6),
            "lon": round(point["lon"], 6),
            "safety_score": score,
            "risk_level": level
        })

    return heatmap