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
  
  // Site Management endpoints (new)
  MY_SITES: '/api/sites/my-sites',
  SITE_SUBCONTRACTORS: (siteId) => `/api/sites/${siteId}/subcontractors`,
  SITE_USERS: (siteId) => `/api/sites/${siteId}/users`,
  SITE_DOCUMENTS: (siteId) => `/api/sites/${siteId}/documents`,
  SITE_CHECKINS: (siteId) => `/api/sites/${siteId}/checkins`,
  SITE_INSPECTIONS: (siteId) => `/api/sites/${siteId}/inspections`,
  SUBCONTRACTORS: '/api/sites/subcontractors',
  
  // User permissions endpoints
  USER_PERMISSIONS: '/api/user/permissions',
  USER_MENU: '/api/user/menu',
  
  // User endpoints
  USER_CREATE: '/adm/users/create',
  USER_UPDATE: (id) => `/adm/users/${id}`,
  USER_DELETE: (id) => `/adm/users/${id}`,
  
  // System endpoints
  SYSTEM_ROOT_FOLDER: '/adm/system/root-folder',
  
  // Status endpoint
  STATUS: '/adm/status'
};