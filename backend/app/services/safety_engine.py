'''from app.services.data_fusion import (
    get_crime_risk,
    get_lighting_score,
    get_crowd_score
)
from app.config import *

def compute_safety_score(lat, lon, hour):
    crime = get_crime_risk(lat, lon)
    lighting = get_lighting_score(hour)
    crowd = get_crowd_score(hour)

    score = (
        (1 - crime) * CRIME_WEIGHT +
        lighting * LIGHTING_WEIGHT +
        crowd * CROWD_WEIGHT +
        TIME_WEIGHT
    )

    final_score = int(score * 100)

    if final_score < HIGH_RISK_THRESHOLD:
        level = "HIGH"
    elif final_score < MEDIUM_RISK_THRESHOLD:
        level = "MEDIUM"
    else:
        level = "LOW"

    explanation = {
        "crime_risk": round(crime, 2),
        "lighting": lighting,
        "crowd": crowd
    }

    return final_score, level, explanation'''
from app.services.data_fusion import (
    get_crime_risk,
    get_lighting_score,
    get_crowd_score
)
from app.ml.predictor import predict_risk

def compute_safety_score(lat, lon, hour):
    crime = get_crime_risk(lat, lon)
    lighting = get_lighting_score(hour)
    crowd = get_crowd_score(hour)

    ml_risk = predict_risk(
        crime=crime,
        lighting=lighting,
        crowd=crowd,
        hour=hour
    )

    safety_score = int((1 - ml_risk) * 100)

    if safety_score < 40:
        level = "HIGH"
    elif safety_score < 70:
        level = "MEDIUM"
    else:
        level = "LOW"

    return safety_score, level, {
        "crime": round(crime, 2),
        "lighting": lighting,
        "crowd": crowd,
        "ml_risk": round(ml_risk, 2)
    }