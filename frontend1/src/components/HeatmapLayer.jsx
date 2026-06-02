
import { CircleMarker, Tooltip } from "react-leaflet";

function HeatmapLayer({ points = [], userLocation }) {
  return (
    <>
      {/* Heatmap points */}
      {points.map((p, idx) => (
        <CircleMarker
          key={idx}
          center={[p.lat, p.lon]}
          radius={15}
          pathOptions={{
            color:
              p.safety_score < 40
                ? "#ff0000"
                : p.safety_score < 70
                ? "#ff9800"
                : "#00c853",
            fillOpacity: 0.7
          }}
        />
      ))}

      {/* Live User Location */}
      {userLocation && (
        <CircleMarker
          center={[userLocation.lat, userLocation.lon]}
          radius={10}
          pathOptions={{
            color: "#1976d2",
            fillColor: "#1976d2",
            fillOpacity: 1
          }}
        >
          <Tooltip>You are here</Tooltip>
        </CircleMarker>
      )}
    </>
  );
}

export default HeatmapLayer;