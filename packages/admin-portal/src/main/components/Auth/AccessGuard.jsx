import React, { useState, useEffect } from 'react';

const AccessGuard = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    checkSplunkAccess();
  }, []);

  const checkSplunkAccess = async () => {
    try {
      // Get Splunk user context
      const splunkUser = await getSplunkUserContext();
      
      if (!splunkUser) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // Check if user has any worksite roles
      const worksiteRoles = ['dwa_admin', 'dwa_inspector', 'dwa_contractor', 'dwa_subcontractor'];
      const userRoles = splunkUser.roles || [];
      const hasWorksiteRole = userRoles.some(role => worksiteRoles.includes(role.toLowerCase()));

      setUserInfo(splunkUser);
      setHasAccess(hasWorksiteRole);
    } catch (error) {
      console.error('Access check failed:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const getSplunkUserContext = async () => {
    try {
      console.log('🔍 Getting Splunk user context...');
      
      // Check if we're in Splunk environment
      const isSplunkEnvironment = window.$C && window.$C.SPLUNKD_PATH;
      
      if (isSplunkEnvironment) {
        console.log('✅ Splunk environment detected');
        
        // Use Splunk REST API to get current user context
        const xhr = new XMLHttpRequest();
        xhr.open('GET', '/splunkd/services/authentication/current-context?output_mode=json', false);
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.send();
        
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          console.log('📊 Splunk API response:', response);
          console.log('📊 Entry content:', response.entry?.[0]?.content);
          
          if (response && response.entry && response.entry[0] && response.entry[0].content) {
            const content = response.entry[0].content;
            const userRoles = Array.isArray(content.roles) ? content.roles : (content.roles ? [content.roles] : []);
            const username = window.$C.USERNAME || content.username || 'splunk_user';
            
            console.log('✅ Got user context:', { username, roles: userRoles, fullContent: content });
            
            return {
              username: username,
              roles: userRoles
            };
          }
        } else {
          console.warn('⚠️ Splunk API failed with status:', xhr.status);
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to get Splunk user context:', error);
      return null;
    }
  };

  if (loading) {
    return (
      <div style={loadingStyles}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
          <p>Checking access permissions...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div style={accessDeniedStyles}>
        <div style={accessDeniedCard}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚫</div>
          <h1 style={accessDeniedTitle}>Access Denied</h1>
          <p style={accessDeniedMessage}>
            You don't have the required permissions to access Digital Worksite.
          </p>
          <div style={accessDeniedDetails}>
            <p><strong>Required Roles:</strong></p>
            <ul style={{ textAlign: 'left', margin: '1rem 0' }}>
              <li>dwa_admin (Administrator)</li>
              <li>dwa_inspector (Inspector)</li>
              <li>dwa_contractor (Contractor)</li>
              <li>dwa_subcontractor (Subcontractor)</li>
            </ul>
            {userInfo && (
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <p><strong>Your Info:</strong></p>
                <p>Username: {userInfo.username}</p>
                <p>Roles: {userInfo.roles?.join(', ') || 'None'}</p>
              </div>
            )}
          </div>
          <div style={accessDeniedActions}>
            <p>Please contact your Splunk administrator to request access.</p>
            <button 
              onClick={() => window.location.reload()} 
              style={retryButton}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

// Styles
const loadingStyles = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  backgroundColor: '#f8f9fa',
  fontFamily: 'Arial, sans-serif'
};

const accessDeniedStyles = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  backgroundColor: '#f8f9fa',
  fontFamily: 'Arial, sans-serif',
  padding: '20px'
};

const accessDeniedCard = {
  backgroundColor: 'white',
  borderRadius: '8px',
  padding: '3rem',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  textAlign: 'center',
  maxWidth: '500px',
  width: '100%'
};

const accessDeniedTitle = {
  color: '#dc3545',
  fontSize: '2rem',
  marginBottom: '1rem',
  fontWeight: 'bold'
};

const accessDeniedMessage = {
  color: '#6c757d',
  fontSize: '1.1rem',
  marginBottom: '2rem',
  lineHeight: '1.5'
};

const accessDeniedDetails = {
  textAlign: 'left',
  marginBottom: '2rem',
  padding: '1rem',
  backgroundColor: '#fff3cd',
  borderRadius: '4px',
  border: '1px solid #ffeaa7'
};

const accessDeniedActions = {
  borderTop: '1px solid #dee2e6',
  paddingTop: '2rem'
};

const retryButton = {
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  padding: '0.75rem 1.5rem',
  borderRadius: '4px',
  fontSize: '1rem',
  cursor: 'pointer',
  marginTop: '1rem'
};

export default AccessGuard;