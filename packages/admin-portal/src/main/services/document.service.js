// document.service.js
// Document management service

import { authFetch } from './auth.service';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';

/**
 * Get all documents with optional filtering - includes inspection PDFs
 */
export const getDocuments = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.site_id) params.append('site_id', filters.site_id);
    
    // Fetch regular documents
    const documentsUrl = `${API_BASE_URL}${API_ENDPOINTS.DOCUMENTS}${params.toString() ? '?' + params.toString() : ''}`;
    const documentsResponse = await authFetch(documentsUrl);
    
    if (!documentsResponse.ok) {
      throw new Error('Failed to fetch documents');
    }
    
    const regularDocs = await documentsResponse.json();
    
    // Fetch inspections with PDFs (only if not filtering by a specific non-inspection type)
    let inspectionDocs = [];
    if (!filters.type || filters.type === 'inspection_report') {
      try {
        const inspectionsUrl = `${API_BASE_URL}/inspections`;
        const inspectionsResponse = await authFetch(inspectionsUrl);
        
        if (inspectionsResponse.ok) {
          const inspections = await inspectionsResponse.json();
          
          // Convert inspections with PDFs to document format
          inspectionDocs = inspections
            .filter(inspection => inspection.pdf_path) // Only completed inspections
            .map(inspection => ({
              id: `inspection_${inspection.inspection_id}`,
              name: `Inspection Report - ${inspection.asset_id}`,
              document_type: 'inspection_report',
              status: 'completed',
              site_id: inspection.site_id,
              site_name: inspection.site_name || 'Unknown Site',
              created_at: inspection.submitted_at || inspection.created_at,
              created_by: inspection.inspector,
              version: '1.0',
              file_id: null, // Local PDF, not in Drive
              hazard_flag: inspection.hazard_flag,
              asset_id: inspection.asset_id,
              inspection_id: inspection.inspection_id,
              pdf_url: `/inspections/${inspection.inspection_id}/pdf`,
              view_url: `/inspections/${inspection.inspection_id}/pdf?inline=true`
            }));
          
          // Apply site filter to inspection docs if specified
          if (filters.site_id) {
            inspectionDocs = inspectionDocs.filter(doc => doc.site_id === filters.site_id);
          }
          
          // Apply status filter to inspection docs if specified
          if (filters.status && filters.status !== 'completed') {
            inspectionDocs = []; // Inspection reports are always 'completed'
          }
        }
      } catch (inspectionError) {
        console.warn('Failed to fetch inspections:', inspectionError);
        // Continue with regular documents only
      }
    }
    
    // Combine and sort by date
    const allDocuments = [...regularDocs, ...inspectionDocs]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return allDocuments;
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
    // Handle inspection documents differently
    if (docId.startsWith('inspection_')) {
      // Inspection reports can't have their status changed
      console.warn('Cannot update status of inspection reports');
      return { success: false, message: 'Inspection report status cannot be changed' };
    }
    
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

/**
 * Get document download URL
 */
export const getDocumentDownloadUrl = (docId) => {
  if (docId.startsWith('inspection_')) {
    const inspectionId = docId.replace('inspection_', '');
    return `${API_BASE_URL}/inspections/${inspectionId}/pdf`;
  } else {
    return `${API_BASE_URL}${API_ENDPOINTS.DOCUMENT_DOWNLOAD(docId)}`;
  }
};

/**
 * Get document view URL (for inline viewing)
 */
export const getDocumentViewUrl = (docId) => {
  if (docId.startsWith('inspection_')) {
    const inspectionId = docId.replace('inspection_', '');
    return `${API_BASE_URL}/inspections/${inspectionId}/pdf?inline=true`;
  } else {
    return `${API_BASE_URL}${API_ENDPOINTS.DOCUMENT_DOWNLOAD(docId)}?inline=true`;
  }
};