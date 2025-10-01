import React, { useState, useEffect } from "react";
import { checkAuthStatus } from "../../../services/auth.service";
import GoogleAuth from "../../../components/Auth/GoogleAuth";
import Dashboard from "../../../components/Dashboard/Dashboard";

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



// =======================
// App Component
// =======================
const App = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // Check for auth token in URL first
        const urlParams = new URLSearchParams(window.location.search);
        const authToken = urlParams.get('auth_token');
        
        if (authToken) {
          localStorage.setItem('auth_token', authToken);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        const isAuthenticated = await checkAuthStatus();
        setAuthenticated(isAuthenticated);
      } catch (error) {
        console.error('Failed to check authentication:', error);
        setAuthenticated(false);
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, []);

  const handleAuthChange = (isSignedIn) => {
    setAuthenticated(isSignedIn);
  };

  if (initializing) {
    return (
      <div style={appStyles}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
          <p>Loading Digital Workspace...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div style={appStyles}>
        <h1 style={headerStyles}>Digital Workspace</h1>
        <div style={{ textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
          <p style={{ marginBottom: '2rem', color: '#6c757d' }}>
            Please sign in to access the workspace
          </p>
          <GoogleAuth onAuthChange={handleAuthChange} />
        </div>
      </div>
    );
  }

  return <Dashboard />;
};

export default App;