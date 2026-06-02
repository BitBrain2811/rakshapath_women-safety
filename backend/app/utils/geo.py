import math

def generate_grid(lat, lon, radius_km=1, step=0.005):
    """
    Generates lat/lon grid around a point
    step ≈ 500m
    """
    points = []
    lat_range = int((radius_km / 111) / step)

    for i in range(-lat_range, lat_range + 1):
        for j in range(-lat_range, lat_range + 1):
            points.append({
                "lat": lat + i * step,
                "lon": lon + j * step
            })
    return points