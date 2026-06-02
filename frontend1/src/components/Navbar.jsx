import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav style={{
      display: "flex",
      gap: 20,
      padding: 15,
      background: "#1976d2",
      color: "white"
    }}>
      <Link to="/" style={{ color: "white", textDecoration: "none" }}>Home</Link>
      <Link to="/map" style={{ color: "white", textDecoration: "none" }}>Navigation</Link>
      <Link to="/emergency" style={{ color: "white", textDecoration: "none" }}>Emergency</Link>
    </nav>
  );
}

export default Navbar;