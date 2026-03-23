// api.service.js
// Shared API services for inspection report

const API_BASE_URL = process.env.REACT_APP_API_URL;

/**
 * Get all sites 
 * @returns {Promise<Array>} Promise that resolves with array of sites
 */
export const getSites = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/adm/sites`, {
      headers
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch sites');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting sites:', error);
    throw error;
  }
};

/**
 * Helper function for making authenticated API requests
 */
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Get all users from database
 * @returns {Promise<Array>} Promise that resolves with users array
 */
export const getUsers = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    const splunkUser = window.$C?.USERNAME;
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (splunkUser) {
      headers['X-Splunk-User'] = splunkUser;
    }
    
    const response = await fetch(`${API_BASE_URL}/adm/users`, {
      headers
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};