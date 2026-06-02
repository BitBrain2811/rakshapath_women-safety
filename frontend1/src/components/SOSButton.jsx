function SOSButton({ userLocation }) {
  const handleSOS = () => {
    if (userLocation) {
      alert(
        `🚨 SOS Triggered!\nLat: ${userLocation.lat}\nLon: ${userLocation.lon}`
      );
    } else {
      alert("🚨 SOS Triggered! Location not available.");
    }
  };

  return (
    <button
      onClick={handleSOS}
      style={{
        position: "fixed",
        bottom: 30,
        right: 30,
        background: "#d32f2f",
        color: "white",
        fontSize: 22,
        borderRadius: "50%",
        width: 80,
        height: 80,
        border: "none",
        cursor: "pointer",
        zIndex: 1000,
      }}
    >
      SOS
    </button>
  );
}

export default SOSButton;