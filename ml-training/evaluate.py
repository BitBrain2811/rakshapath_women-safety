import pandas as pd
import joblib
from sklearn.metrics import mean_absolute_error, r2_score

crime_df = pd.read_csv("../backend/data/crime_data.csv")
lighting_df = pd.read_csv("../backend/data/lighting_data.csv")
crowd_df = pd.read_csv("../backend/data/crowd_simulated.csv")

df = crime_df.merge(
    lighting_df, on=["lat", "lon"], how="left"
).merge(
    crowd_df, on="hour", how="left"
)

df.fillna(df.mean(numeric_only=True), inplace=True)

X = df[["crime_density", "lighting_score", "crowd_score", "hour"]]
y_true = (
    0.5 * df["crime_density"]
    + 0.3 * (1 - df["lighting_score"])
    + 0.2 * (1 - df["crowd_score"])
)

model = joblib.load("../backend/app/ml/risk_model.pkl")
y_pred = model.predict(X)

print("MAE:", mean_absolute_error(y_true, y_pred))
print("R2:", r2_score(y_true, y_pred))

features = X.columns
importance = model.feature_importances_

for f, i in zip(features, importance):
    print(f, round(i, 3))