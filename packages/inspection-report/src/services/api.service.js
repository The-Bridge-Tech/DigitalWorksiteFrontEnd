// api.service.js
// Shared API services for inspection report

const API_BASE_URL = 'http://localhost:5004';

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
 * Get all users from Google Drive
 * @returns {Promise<Array>} Promise that resolves with users array
 */
export const getUsers = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      console.warn('No auth token found, returning empty users array');
      return [];
    }

    // Users folder ID from the users service
    const USERS_FOLDER_ID = '1Xq4i2gEBwbrRat3ucxgjROci9kdYi7ol';
    
    // Get JSON files from users folder
    const files = await fetchWithAuth(`${API_BASE_URL}/adm/files?folderId=${USERS_FOLDER_ID}&query=mimeType='application/json'`);
    
    if (!Array.isArray(files)) {
      console.warn('Invalid files response:', files);
      return [];
    }

    // Fetch content for each user file
    const users = await Promise.all(
      files.map(async (file) => {
        try {
          const content = await fetchWithAuth(`${API_BASE_URL}/adm/files/${file.id}/content`);
          
          let userObj;
          if (typeof content === 'string') {
            userObj = JSON.parse(content);
          } else if (content && typeof content.content === 'string') {
            userObj = JSON.parse(content.content);
          } else {
            console.warn(`Invalid content format for ${file.name}`);
            return null;
          }

          return {
            ...userObj,
            fileId: file.id,
            fileName: file.name,
            createdTime: file.createdTime,
            modifiedTime: file.modifiedTime,
          };
        } catch (err) {
          console.warn(`Failed to parse user ${file.name}:`, err);
          return null;
        }
      })
    );

    return users.filter(Boolean);
  } catch (error) {
    console.error('Error getting users:', error);
    // Return empty array on error to prevent crashes
    return [];
  }
};