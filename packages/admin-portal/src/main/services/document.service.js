// document.service.js
// Document management service

import { authFetch } from './auth.service';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';

/**
 * Get all documents with optional filtering
 */
export const getDocuments = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.site_id) params.append('site_id', filters.site_id);
    
    const url = `${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await authFetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch documents');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting documents:', error);
    throw error;
  }
};

/**
 * Create a new document record
 */
export const createDocument = async (documentData) => {
  try {
    const response = await authFetch(`${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS}`, {
      method: 'POST',
      body: JSON.stringify(documentData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create document');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

/**
 * Update document status
 */
export const updateDocumentStatus = async (docId, status) => {
  try {
    const response = await authFetch(`${API_BASE_URL}${API_ENDPOINTS.DOCUMENT_STATUS(docId)}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update document status');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating document status:', error);
    throw error;
  }
};