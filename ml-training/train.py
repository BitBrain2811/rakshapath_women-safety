import pandas as pd
import joblib
from sklearn.ensemble import RandomForestRegressor

# ----------------------------
# Load CSV data
# ----------------------------
crime_df = pd.read_csv("../backend/data/crime_data.csv")
lighting_df = pd.read_csv("../backend/data/lighting_data.csv")
crowd_df = pd.read_csv("../backend/data/crowd_simulated.csv")

# ----------------------------
# Merge datasets
# ----------------------------
df = crime_df.merge(
    lighting_df,
    on=["lat", "lon"],
    how="left"
).merge(
    crowd_df,
    on="hour",
    how="left"
)

# Fill missing values
df.fillna(df.mean(numeric_only=True), inplace=True)

# ----------------------------
# Features & target
# ----------------------------
X = df[["crime_density", "lighting_score", "crowd_score", "hour"]]

# Risk score (training target)
y = (
    0.5 * df["crime_density"]
    + 0.3 * (1 - df["lighting_score"])
    + 0.2 * (1 - df["crowd_score"])
)

# ----------------------------
# Train ML model
# ----------------------------
model = RandomForestRegressor(
    n_estimators=200,
    random_state=42
)
model.fit(X, y)

# ----------------------------
# SAVE MODEL (THIS CREATES risk_model.pkl)
# ----------------------------
joblib.dump(model, "../backend/app/ml/risk_model.pkl")

print("✅ risk_model.pkl created successfully")