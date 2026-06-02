import React, { useState, useEffect } from 'react';
import MapView from '../components/Map/MapView';
import { analyzeAreaSafety } from '../services/aiModel';

const Dashboard = () => {
  const [safetyData, setSafetyData] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Initial Analysis (4.1 & 4.2)
    const data = analyzeAreaSafety(40.7128, -74.0060);
    setSafetyData(data);

    // Simulated Proactive Alert (4.4)
    setTimeout(() => {
      setAlerts([{ id: 1, msg: "Alert: Crowds thinning in Sector B. Re-calculating safest path..." }]);
    }, 5000);
  }, []);

  const triggerSOS = () => {
    alert("🚨 EMERGENCY: SOS Sent to Police & Trusted Contacts. Location Sharing Active.");
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      {/* Sidebar: Features 4.1, 4.2, 4.4, 4.5 */}
      <aside style={styles.sidebar}>
        <h2 style={{ color: '#E91E63' }}>Smart Dashboard</h2>
        
        {/* 4.1 & 4.2 UI */}
        <div style={styles.card}>
          <h4>Area Safety Score (AI)</h4>
          <h2 style={{ color: safetyData?.score > 0.6 ? '#4CAF50' : '#FF5252' }}>
            {safetyData?.score} / 1.0
          </h2>
          <p>Risk Level: <strong>{safetyData?.classification}</strong></p>
          <small>{safetyData?.prediction}</small>
        </div>

        {/* 4.4 Proactive Alerts */}
        <div style={styles.alertBox}>
          {alerts.map(a => <div key={a.id} style={styles.alertItem}>⚠️ {a.msg}</div>)}
        </div>

        {/* 4.5 SOS Button */}
        <button onClick={triggerSOS} style={styles.sosBtn}>TRGGER SOS</button>
      </aside>

      {/* 4.3 Map Section */}
      <main style={{ flex: 1, position: 'relative' }}>
        <MapView />
        <div style={styles.routeLegend}>
          <span>🟢 Safest Path (Recommended)</span><br/>
          <span>🟠 Medium Risk (Crowded)</span>
        </div>
      </main>
    </div>
  );
};

const styles = {
  sidebar: { width: '320px', background: '#fff', borderRight: '1px solid #eee', padding: '20px', display: 'flex', flexDirection: 'column' },
  card: { padding: '15px', borderRadius: '12px', background: '#f8f9fa', marginBottom: '20px' },
  alertBox: { flexGrow: 1, marginTop: '10px' },
  alertItem: { padding: '10px', background: '#FFF3E0', borderLeft: '4px solid #FF9800', fontSize: '13px', borderRadius: '4px' },
  sosBtn: { padding: '18px', background: '#B71C1C', color: 'white', borderRadius: '12px', border: 'none', fontWeight: '900', cursor: 'pointer', fontSize: '18px' },
  routeLegend: { position: 'absolute', bottom: '20px', left: '20px', zIndex: 1000, background: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }
};

export default Dashboard;