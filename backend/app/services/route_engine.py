from app.services.safety_engine import compute_safety_score

def get_safest_route(start, end, hour):
    """
    Generates 3 routes (Safest, Alternative, Shortest but Congested) with
    interpolated Leaflet polylines, instructions, traffic info, and safety scores.
    """
    s_lat, s_lon = float(start["lat"]), float(start["lon"])
    e_lat, e_lon = float(end["lat"]), float(end["lon"])

    d_lat = e_lat - s_lat
    d_lon = e_lon - s_lon

    # Compute base safety score from start location
    base_score, _, _ = compute_safety_score(s_lat, s_lon, hour)

    # 1. ROUTE A: Safest Route (Curve Right - Green)
    # Mid-points shifted to the right of the direction vector: perp_lat = -d_lon, perp_lon = d_lat
    # Shift scaled by 0.15 for visual difference
    p_lat1 = s_lat + 0.25 * d_lat - 0.1 * d_lon
    p_lon1 = s_lon + 0.25 * d_lon + 0.1 * d_lat
    p_lat2 = s_lat + 0.5 * d_lat - 0.15 * d_lon
    p_lon2 = s_lon + 0.5 * d_lon + 0.15 * d_lat
    p_lat3 = s_lat + 0.75 * d_lat - 0.1 * d_lon
    p_lon3 = s_lon + 0.75 * d_lon + 0.1 * d_lat

    route_a_coords = [
        [s_lat, s_lon],
        [p_lat1, p_lon1],
        [p_lat2, p_lon2],
        [p_lat3, p_lon3],
        [e_lat, e_lon]
    ]

    # Bound safety score for Safest between 80 and 98
    score_a = min(98, max(80, base_score + 15))
    route_a = {
        "name": "Safest Route (Recommended)",
        "safety_score": score_a,
        "risk_level": "LOW",
        "traffic": "Clear (Fast Flow)",
        "duration_mins": 14,
        "color": "#00c853",
        "coordinates": [[round(pt[0], 6), round(pt[1], 6)] for pt in route_a_coords],
        "instructions": [
            "Start from your current location.",
            "Turn right onto Guard Street (highly active & well-lit).",
            "Pass the local security checkpoint.",
            "Continue onto Safe Boulevard.",
            "Arrive at destination safely."
        ]
    }

    # 2. ROUTE B: Alternative Route (Curve Left - Yellow)
    q_lat1 = s_lat + 0.25 * d_lat + 0.1 * d_lon
    q_lon1 = s_lon + 0.25 * d_lon - 0.1 * d_lat
    q_lat2 = s_lat + 0.5 * d_lat + 0.15 * d_lon
    q_lon2 = s_lon + 0.5 * d_lon - 0.15 * d_lat
    q_lat3 = s_lat + 0.75 * d_lat + 0.1 * d_lon
    q_lon3 = s_lon + 0.75 * d_lon - 0.1 * d_lat

    route_b_coords = [
        [s_lat, s_lon],
        [q_lat1, q_lon1],
        [q_lat2, q_lon2],
        [q_lat3, q_lon3],
        [e_lat, e_lon]
    ]

    # Bound safety score for Alternative between 50 and 79
    score_b = min(79, max(50, base_score - 10))
    route_b = {
        "name": "Alternative Route (Moderate Traffic)",
        "safety_score": score_b,
        "risk_level": "MEDIUM",
        "traffic": "Moderate Traffic",
        "duration_mins": 11,
        "color": "#ffb300",
        "coordinates": [[round(pt[0], 6), round(pt[1], 6)] for pt in route_b_coords],
        "instructions": [
            "Start from your current location.",
            "Head north along Commercial Row.",
            "Turn left onto Second Avenue.",
            "Follow Bypass Road.",
            "Arrive at destination."
        ]
    }

    # 3. ROUTE C: Shortest Route (Straight Line - Red)
    r_lat1 = s_lat + 0.33 * d_lat
    r_lon1 = s_lon + 0.33 * d_lon
    r_lat2 = s_lat + 0.66 * d_lat
    r_lon2 = s_lon + 0.66 * d_lon

    route_c_coords = [
        [s_lat, s_lon],
        [r_lat1, r_lon1],
        [r_lat2, r_lon2],
        [e_lat, e_lon]
    ]

    # Bound safety score for Unsafe between 20 and 45
    score_c = min(45, max(20, base_score - 35))
    route_c = {
        "name": "Shortest Path (High Risk / Heavy Traffic)",
        "safety_score": score_c,
        "risk_level": "HIGH",
        "traffic": "Heavy Congestion / Unlit Alleyway",
        "duration_mins": 8,
        "color": "#d32f2f",
        "coordinates": [[round(pt[0], 6), round(pt[1], 6)] for pt in route_c_coords],
        "instructions": [
            "Start from your current location.",
            "Enter shortcut alleyway (Caution: Poor illumination).",
            "Proceed through heavily congested underpass.",
            "Arrive at destination."
        ]
    }

    all_routes = [route_a, route_b, route_c]
    
    # Safest is always route A by design
    return route_a, all_routes