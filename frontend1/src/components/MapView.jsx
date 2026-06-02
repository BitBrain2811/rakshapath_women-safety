import { useEffect } from "react";
import { MapContainer, TileLayer, useMapEvents, Polyline, CircleMarker, Tooltip, useMap } from "react-leaflet";

// Controller to auto-center/zoom the map to show the entire route
function MapBoundsController({ bounds, center }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (center) {
      map.setView(center, map.getZoom());
    }
  }, [bounds, center, map]);
  return null;
}

function ClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

function MapView({ children, onMapClick, routes = [], selectedRouteIndex = 0, destination = null, userLocation = null, onRouteClick = () => {}, mapStyle = "mapbox" }) {
  const mapCenter = userLocation ? [userLocation.lat, userLocation.lon] : [26.7606, 83.3731];

  // Calculate bounds if we have a selected route
  let routeBounds = null;
  if (routes.length > 0 && routes[selectedRouteIndex]) {
    const coords = routes[selectedRouteIndex].coordinates;
    if (coords && coords.length > 0) {
      routeBounds = coords.map(c => [c[0], c[1]]);
    }
  }

  // Choose TileLayer source dynamically
  let tileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  let tileAttribution = '&copy; <a href="https://carto.com/">CartoDB</a>';
  if (mapStyle === "osm") {
    tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    tileAttribution = "&copy; OpenStreetMap contributors";
  } else if (mapStyle === "google") {
    tileUrl = "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";
    tileAttribution = "&copy; Google Maps Hybrid";
  }

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution={tileAttribution}
          url={tileUrl}
        />
        
        <ClickHandler onClick={onMapClick} />
        <MapBoundsController bounds={routeBounds} center={userLocation ? [userLocation.lat, userLocation.lon] : null} />
        
        {/* Render Route Polylines */}
        {routes.map((route, index) => {
          const isSelected = index === selectedRouteIndex;
          return (
            <Polyline
              key={index}
              positions={route.coordinates}
              pathOptions={{
                color: route.color || "#999",
                weight: isSelected ? 8 : 4,
                opacity: isSelected ? 0.95 : 0.45,
                dashArray: isSelected ? null : "5, 10"
              }}
              eventHandlers={{
                click: () => onRouteClick(index)
              }}
            >
              <Tooltip sticky>
                <strong>{route.name}</strong><br />
                Safety Score: {route.safety_score} ({route.risk_level})<br />
                Time: {route.duration_mins} mins | Traffic: {route.traffic}
              </Tooltip>
            </Polyline>
          );
        })}

        {/* Destination Marker */}
        {destination && (
          <CircleMarker
            center={[destination.lat, destination.lon]}
            radius={8}
            pathOptions={{
              color: "#e91e63",
              fillColor: "#e91e63",
              fillOpacity: 1,
              weight: 3
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -10]}>
              📍 Destination
            </Tooltip>
          </CircleMarker>
        )}

        {children}
      </MapContainer>
    </div>
  );
}

export default MapView;