import joblib
import os

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "risk_model.pkl"
)

# Load model ONCE when server starts
model = joblib.load(MODEL_PATH)
print("ML model loaded in backend")

def predict_risk(crime, lighting, crowd, hour):
    X = [[crime, lighting, crowd, hour]]
    return float(model.predict(X)[0])