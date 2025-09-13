import React from "react";
import IntegrationTest from "../../../components/IntegrationTest";
console.log("IntegrationTest loaded:", IntegrationTest);

// =======================
// Inline styles
// =======================
const appStyles = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  backgroundColor: "#f8f9fa",
  fontFamily: "Arial, sans-serif",
  padding: "20px",
};

const headerStyles = {
  fontSize: "2rem",
  color: "#343a40",
  marginBottom: "20px",
};

const footerStyles = {
  marginTop: "30px",
  fontSize: "0.9rem",
  color: "#6c757d",
};

// =======================
// App Component
// =======================
const App = () => {
  return (
    <div style={appStyles}>
      {/* Header */}
      <h1 style={headerStyles}>Splunk Admin Portal</h1>

      {/* IntegrationTest Component */}
      <IntegrationTest />

      {/* Footer */}
      <footer style={footerStyles}>
        Powered by Splunk React Integration
      </footer>
    </div>
  );
};

export default App;