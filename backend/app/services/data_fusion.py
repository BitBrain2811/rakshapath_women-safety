import random

def get_crime_risk(lat, lon):
    """
    Simulated crime density score (0–1)
    Later: replace with real crime heatmap
    """
    return random.uniform(0.2, 0.9)

def get_lighting_score(hour):
    if 6 <= hour <= 18:
        return 1.0
    elif 18 < hour <= 21:
        return 0.7
    else:
        return 0.4

def get_crowd_score(hour):
    if 8 <= hour <= 10 or 17 <= hour <= 20:
        return 0.9
    elif 22 <= hour or hour <= 5:
        return 0.3
    else:
        return 0.6