import React from 'react';
import MapComponent from '../MapComponent';

export default function MapView() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <MapComponent />
      {/* Simple overlay for routes/legend could go here */}
    </div>
  );
}
