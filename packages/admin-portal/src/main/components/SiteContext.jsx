import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.config';
import RootFolderModal from './Setup/RootFolderModal';

const SiteContext = createContext();

export const useSite = () => {
    const context = useContext(SiteContext);
    if (!context) {
        throw new Error('useSite must be used within a SiteProvider');
    }
    return context;
};

export const SiteProvider = ({ children }) => {
    const [selectedSite, setSelectedSite] = useState(null);
    const [userSites, setUserSites] = useState([]);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showRootFolderModal, setShowRootFolderModal] = useState(false);

    // Fetch user's assigned sites
    const fetchUserSites = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                setLoading(false);
                return;
            }

            // Check if user is admin first
            const isAdminUser = checkSplunkAdminRole();
            
            // If admin, check root folder immediately
            if (isAdminUser) {
                setUserRole('admin');
                await checkRootFolderSetup();
            }

            // Try to fetch sites (may fail for non-Splunk users)
            try {
                // Get Splunk user context for API calls
                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };
                
                // Add Splunk roles only (no username matching)
                try {
                    if (window.$C && window.$C.USERNAME) {
                        const xhr = new XMLHttpRequest();
                        xhr.open('GET', '/splunkd/services/authentication/current-context?output_mode=json', false);
                        xhr.setRequestHeader('Accept', 'application/json');
                        xhr.send();
                        
                        if (xhr.status === 200) {
                            const response = JSON.parse(xhr.responseText);
                            const roles = response?.entry?.[0]?.content?.roles || [];
                            const userRoles = Array.isArray(roles) ? roles : [roles];
                            
                            headers['X-Splunk-Roles'] = userRoles.join(',');
                        }
                    }
                } catch (splunkError) {
                    console.log('Splunk context not available, using token auth only');
                }
                
                const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MY_SITES}`, {
                    headers
                });

                if (response.ok) {
                    const sites = await response.json();
                    setUserSites(sites);
                    
                    // Auto-select first site if available
                    if (sites.length > 0 && !selectedSite) {
                        setSelectedSite(sites[0]);
                    }
                }
            } catch (siteError) {
                console.log('Sites endpoint not available, continuing as admin user');
            }
        } catch (error) {
            console.error('Error fetching user sites:', error);
        } finally {
            setLoading(false);
        }
    };

    // Select a site
    const selectSite = (site) => {
        setSelectedSite(site);
        setUserRole(site.user_role);
        localStorage.setItem('selected_site_id', site.id);
    };

    // Check if user has permission
    const hasPermission = (permission) => {
        // Admin users have all permissions
        if (userRole === 'admin') {
            return true;
        }
        
        const rolePermissions = {
            site_manager: ['view_documents', 'create_documents', 'edit_documents',
                          'view_inspections', 'create_inspections', 'edit_inspections',
                          'view_checkins', 'manage_users', 'view_reports'],
            contractor: ['view_documents', 'create_documents', 'view_inspections', 
                        'create_inspections', 'view_checkins'],
            subcontractor: ['view_documents', 'create_documents', 'view_inspections', 
                           'create_inspections', 'view_checkins'],
            inspector: ['view_documents', 'view_inspections', 'create_inspections',
                       'edit_inspections', 'view_checkins'],
            viewer: ['view_documents', 'view_inspections', 'view_checkins', 'view_reports']
        };

        return rolePermissions[userRole]?.includes(permission) || false;
    };

    // Check if user is admin
    const isAdmin = () => {
        return userRole === 'admin' || checkSplunkAdminRole();
    };

    // Check if user has admin role from Splunk
    const checkSplunkAdminRole = () => {
        try {
            // Get Splunk user context if available
            if (window.$C && window.$C.USERNAME) {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', '/splunkd/services/authentication/current-context?output_mode=json', false);
                xhr.setRequestHeader('Accept', 'application/json');
                xhr.send();
                
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    const roles = response?.entry?.[0]?.content?.roles || [];
                    const userRoles = Array.isArray(roles) ? roles : [roles];
                    return userRoles.some(role => role.toLowerCase() === 'dwa_admin');
                }
            }
        } catch (error) {
            console.error('Error checking Splunk admin role:', error);
        }
        return false;
    };

    useEffect(() => {
        fetchUserSites();
        
        // Restore selected site from localStorage
        const savedSiteId = localStorage.getItem('selected_site_id');
        if (savedSiteId && userSites.length > 0) {
            const savedSite = userSites.find(site => site.id === savedSiteId);
            if (savedSite) {
                setSelectedSite(savedSite);
                setUserRole(savedSite.user_role);
            }
        }
    }, []);

    // Check if root folder is set up for admin users
    const checkRootFolderSetup = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SYSTEM_ROOT_FOLDER}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            // If no root folder found, show modal for admin
            if (!response.ok) {
                setShowRootFolderModal(true);
            }
        } catch (error) {
            console.error('Error checking root folder:', error);
            // Show modal on error (likely means not set up)
            setShowRootFolderModal(true);
        }
    };

    const handleRootFolderComplete = () => {
        setShowRootFolderModal(false);
    };

    const value = {
        selectedSite,
        userSites,
        userRole,
        loading,
        selectSite,
        hasPermission,
        isAdmin,
        refreshSites: fetchUserSites,
        // Debug function to force show modal
        showRootFolderSetup: () => setShowRootFolderModal(true)
    };

    return (
        <SiteContext.Provider value={value}>
            {children}
            {showRootFolderModal && (
                <RootFolderModal onComplete={handleRootFolderComplete} />
            )}

        </SiteContext.Provider>
    );
};