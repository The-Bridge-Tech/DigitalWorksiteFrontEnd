// Central API configuration
// Single source of truth for all API URLs

// Direct URL configuration - change this for different environments
export const API_BASE_URL = 'http://localhost:5004';

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH_STATUS: '/adm/auth/status',
  AUTH_GOOGLE: '/adm/auth/google',
  AUTH_LOGOUT: '/adm/auth/logout',
  
  // Site endpoints
  SITES: '/adm/sites',
  SITE_BY_ID: (id) => `/adm/sites/${id}`,
  
  // Template endpoints
  TEMPLATES: '/adm/templates',
  TEMPLATE_BY_ID: (id) => `/adm/templates/${id}`,
  
  // File endpoints
  FILES: '/adm/files',
  FILE_BY_ID: (id) => `/adm/files/${id}`,
  FILE_CONTENT: (id) => `/adm/files/${id}/content`,
  FILE_UPLOAD: '/adm/files/upload',
  
  // Inspection endpoints
  INSPECTIONS: '/inspections',
  INSPECTION_SUBMIT: '/inspections/submit',
  INSPECTION_BY_ID: (id) => `/inspections/${id}`,
  
  // Notification endpoints
  NOTIFICATIONS: '/notifications',
  NOTIFICATIONS_PUSH: '/notifications/push',
  NOTIFICATION_MARK_READ: (id) => `/notifications/${id}/mark_read`,
  
  // Check-in endpoints
  CHECKINS: '/checkins',
  CHECKIN_SCAN: '/checkins/scan',
  
  // Task endpoints
  TASKS: '/tasks',
  TASK_CREATE: '/tasks/create',
  TASK_BY_ID: (id) => `/tasks/${id}`,
  
  // Document endpoints
  DOCUMENTS: '/adm/documents',
  DOCUMENT_BY_ID: (id) => `/adm/documents/${id}`,
  DOCUMENT_STATUS: (id) => `/adm/documents/${id}/status`,
  
  // Status endpoint
  STATUS: '/adm/status'
};