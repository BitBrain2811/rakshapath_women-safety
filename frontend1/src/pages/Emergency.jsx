import EmergencyContacts from "../components/EmergencyContacts";

function Emergency() {
  return (
    <div style={{ padding: 30 }}>
      <h2>Emergency Help</h2>
      <p>Quick access to emergency services.</p>
      <EmergencyContacts />
    </div>
  );
}

export default Emergency;