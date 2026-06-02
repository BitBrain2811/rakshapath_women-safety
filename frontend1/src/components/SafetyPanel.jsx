function SafetyPanel({ data, lang }) {
  if (!data) return null;
  const isHindi = lang === "hi";

  // Translate risk level
  let riskDisplay = data.risk_level;
  let riskColor = "#00c853"; // green
  if (data.risk_level === "HIGH") {
    riskDisplay = isHindi ? "🔴 उच्च जोखिम (HIGH)" : "🔴 HIGH RISK";
    riskColor = "#ff1744"; // red
  } else if (data.risk_level === "MEDIUM") {
    riskDisplay = isHindi ? "🟡 मध्यम चेतावनी (MEDIUM)" : "🟡 MEDIUM ALERT";
    riskColor = "#ffb300"; // yellow
  } else {
    riskDisplay = isHindi ? "🟢 सुरक्षित (LOW RISK)" : "🟢 SAFE / LOW RISK";
    riskColor = "#00c853"; // green
  }

  return (
    <div className="glass-card" style={{ marginTop: "12px", borderLeft: `5px solid ${riskColor}` }}>
      <h3>{isHindi ? "वर्तमान सुरक्षा विश्लेषण" : "Current Safety Analytics"}</h3>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px" }}>
        <div>
          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
            {isHindi ? "सुरक्षा स्कोर" : "Safety Score"}
          </div>
          <h1 style={{ margin: "4px 0 0 0", fontSize: "36px", fontWeight: "800", color: riskColor }}>
            {data.safety_score}
          </h1>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", marginBottom: "4px" }}>
            {isHindi ? "जोखिम स्तर" : "Risk Level"}
          </div>
          <span style={{ fontSize: "15px", fontWeight: "700" }}>{riskDisplay}</span>
        </div>
      </div>
    </div>
  );
}

export default SafetyPanel;