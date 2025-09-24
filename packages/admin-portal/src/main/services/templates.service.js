// templates.service.js
// Service for managing inspection templates (Using Backend API)

// API base URL
const API_BASE_URL = 'http://localhost:5004';

// templates.service.js - Update these functions

/**
 * Get all templates from a specific folder
 * @param {string} folderId - Google Drive folder ID
 * @returns {Promise<Array>} Promise that resolves with templates array
 */
export const getTemplates = async (folderId) => {
  try {
    console.log(`templates.service: Getting templates from folder ${folderId}...`);
    
    const token = localStorage.getItem('auth_token');
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const url = folderId 
      ? `${API_BASE_URL}/adm/templates?folderId=${encodeURIComponent(folderId)}`
      : `${API_BASE_URL}/adm/templates`;
    
    const response = await fetch(url, {
      headers
    });
    
    if (!response.ok) {
      // Handle 401 Unauthorized
      if (response.status === 401) {
        throw new Error('Authentication required. Please sign in.');
      }
      
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch templates');
    }
    
    const templates = await response.json();
    console.log(`templates.service: Found ${templates.length} templates`);
    
    return templates;
  } catch (error) {
    console.error('templates.service: Error fetching templates:', error);
    throw error;
  }
};

/**
 * Get a single template by ID
 * @param {string} templateId - Template file ID
 * @returns {Promise<Object>} Promise that resolves with template object
 */
export const getTemplate = async (templateId) => {
  try {
    console.log(`templates.service: Getting template with ID ${templateId}`);
    
    const token = localStorage.getItem('auth_token');
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/adm/templates/${templateId}`, {
      headers
    });
    
    if (!response.ok) {
      // Handle 401 Unauthorized
      if (response.status === 401) {
        throw new Error('Authentication required. Please sign in.');
      }
      
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to fetch template ${templateId}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`templates.service: Error fetching template ${templateId}:`, error);
    throw error;
  }
};

/**
 * Create a new template
 * @param {Object} templateData - Template data
 * @param {string} folderId - Google Drive folder ID to save template in
 * @returns {Promise<Object>} Promise that resolves with created template data
 */
export const createTemplate = async (templateData, folderId) => {
  try {
    console.log('templates.service: Creating new template:', templateData.name);
    
    // Validate required fields
    if (!templateData.name) throw new Error('Template name is required');
    if (!templateData.questions || !Array.isArray(templateData.questions)) {
      throw new Error('Questions must be an array');
    }
    if (!folderId) throw new Error('Folder ID is required');
    
    const token = localStorage.getItem('auth_token');
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Include folder ID in the request
    const requestData = {
      ...templateData,
      folderId: folderId
    };
    
    const response = await fetch(`${API_BASE_URL}/adm/templates`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      // Handle 401 Unauthorized
      if (response.status === 401) {
        throw new Error('Authentication required. Please sign in.');
      }
      
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create template');
    }
    
    const newTemplate = await response.json();
    console.log(`templates.service: Template created with ID ${newTemplate.fileId}`);
    
    return newTemplate;
  } catch (error) {
    console.error('templates.service: Error creating template:', error);
    throw error;
  }
};

/**
 * Update an existing template
 * @param {string} templateId - Template file ID
 * @param {Object} templateData - Updated template data
 * @returns {Promise<Object>} Promise that resolves with updated template data
 */
export const updateTemplate = async (templateId, templateData) => {
  try {
    console.log(`templates.service: Updating template with ID ${templateId}`);
    
    const token = localStorage.getItem('auth_token');
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/adm/templates/${templateId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(templateData)
    });
    
    if (!response.ok) {
      // Handle 401 Unauthorized
      if (response.status === 401) {
        throw new Error('Authentication required. Please sign in.');
      }
      
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to update template ${templateId}`);
    }
    
    const updatedTemplate = await response.json();
    console.log(`templates.service: Template updated successfully`);
    
    return updatedTemplate;
  } catch (error) {
    console.error(`templates.service: Error updating template ${templateId}:`, error);
    throw error;
  }
};

/**
 * Delete a template
 * @param {string} templateId - Template file ID
 * @returns {Promise<boolean>} Promise that resolves with true if successful
 */
export const deleteTemplate = async (templateId) => {
  try {
    console.log(`templates.service: Deleting template with ID ${templateId}`);
    
    const token = localStorage.getItem('auth_token');
    const headers = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/adm/templates/${templateId}`, {
      method: 'DELETE',
      headers
    });
    
    if (!response.ok) {
      // Handle 401 Unauthorized
      if (response.status === 401) {
        throw new Error('Authentication required. Please sign in.');
      }
      
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to delete template ${templateId}`);
    }
    
    console.log(`templates.service: Template deleted successfully`);
    
    return true;
  } catch (error) {
    console.error(`templates.service: Error deleting template ${templateId}:`, error);
    throw error;
  }
};