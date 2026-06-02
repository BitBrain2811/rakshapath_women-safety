function Legend({ lang }) {
  const isHindi = lang === "hi";
  return (
    <div className="glass-card" style={{ marginTop: "12px" }}>
      <h3>{isHindi ? "सुरक्षा स्तर" : "Safety Levels"}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
          <span>🔴</span>
          <span><b>{isHindi ? "उच्च जोखिम (0–40) / भारी भीड़" : "High Risk (0–40) / Heavy Traffic"}</b></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
          <span>🟡</span>
          <span><b>{isHindi ? "मध्यम चेतावनी (41–69) / मध्यम भीड़" : "Medium Alert (41–69) / Moderate Traffic"}</b></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
          <span>🟢</span>
          <span><b>{isHindi ? "सुरक्षित मार्ग (70–100) / साफ रास्ता" : "Safe Route (70–100) / Clear Way"}</b></span>
        </div>
      </div>
    </div>
  );
}

export default Legend;