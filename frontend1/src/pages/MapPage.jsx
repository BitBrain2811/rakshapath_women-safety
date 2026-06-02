import { useState } from "react";
import { useEffect, useState } from "react";
import MapView from "../components/MapView";
import HeatmapLayer from "../components/HeatmapLayer";
import SafetyPanel from "../components/SafetyPanel";
import Legend from "../components/Legend";
import { getSafetyScore, getHeatmap } from "../services/api";

function MapPage() {
  const [safety, setSafety] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const hour = new Date().getHours();
  useEffect(() => {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      setUserLocation({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude
      });
    },
    (err) => {
      console.error("Location error:", err);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000
    }
  );

  return () => navigator.geolocation.clearWatch(watchId);
}, []);

  const handleMapClick = (lat, lon) => {
    getSafetyScore(lat, lon, hour).then(res => setSafety(res.data));
    getHeatmap(lat, lon, hour).then(res => setHeatmap(res.data.points));
  };

  return (
    <div style={{ display: "flex", padding: 20 }}>
      <div style={{ width: 300 }}>
        <SafetyPanel data={safety} />
        <Legend />
      </div>

      <div style={{ flex: 1 }}>
        <MapView onMapClick={handleMapClick}>
  <HeatmapLayer
    points={heatmap}
    userLocation={userLocation}
  />
</MapView>
      </div>
    </div>
  );
}

export default MapPage;