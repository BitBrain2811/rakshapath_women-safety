import pandas as pd
import numpy as np

np.random.seed(42)

rows = []

base_lat = 28.6100
base_lon = 77.2000

for i in range(15):
    lat = base_lat + i * 0.001
    lon = base_lon + i * 0.001
    hour = np.random.randint(18, 24)  # night-heavy data
    crime_density = round(np.clip(np.random.normal(0.6, 0.2), 0, 1), 2)

    rows.append([lat, lon, hour, crime_density])

df = pd.DataFrame(
    rows,
    columns=["lat", "lon", "hour", "crime_density"]
)

df.to_csv("crime_data.csv", index=False)
print(" crime_data.csv generated")