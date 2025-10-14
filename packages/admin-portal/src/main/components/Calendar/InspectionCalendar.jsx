// src/main/components/Calendar/InspectionCalendar.jsx
import React, { useRef, useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getSites } from '../../services/site.service';
import { authFetch } from '../../services/auth.service';
import { getUsers } from '../../services/users.service';

// Cache for calendar data
let calendarCache = {
  sites: null,
  users: null,
  tasks: null,
  timestamp: null
};
const CACHE_DURATION = 60000; // 1 minute
import { sendInspectionReminder } from '../Notifications/NotificationTrigger';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api.config';

// Fix Leaflet default icons
import 'leaflet/dist/leaflet.css';

// Enhanced Leaflet icons
const createCustomIcon = (color, emoji) => L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    background: linear-gradient(135deg, ${color}, ${color}dd);
    width: 32px; height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    border: 3px solid white;
  ">${emoji}</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

import './InspectionCalendar.css';

// Define city → coordinates with enhanced data
const cityCoordinates = {
  Nairobi: { coords: [-1.286389, 36.817223], priority: 'high', zone: 'central' },
  Nakuru: { coords: [-0.3031, 36.0800], priority: 'medium', zone: 'rift-valley' },
  Mombasa: { coords: [-4.0435, 39.6682], priority: 'high', zone: 'coastal' },
  Kisumu: { coords: [-0.0917, 34.7680], priority: 'medium', zone: 'western' },
  Eldoret: { coords: [0.5143, 35.2698], priority: 'low', zone: 'rift-valley' },
};

// Enhanced status icons with better visual design
const statusIcons = {
  scheduled: createCustomIcon('#007bff', '📅'),
  completed: createCustomIcon('#28a745', '✅'),
  pending: createCustomIcon('#ffc107', '⏳'),
  overdue: createCustomIcon('#dc3545', '🚨'),
  available: createCustomIcon('#6c757d', '📍'),
};

// ---- Enhanced AI Suggestions Function ----
const getAISuggestions = (sites, events, selectedSite = null) => {
  const suggestions = [];
  const now = new Date();
  const scheduledSites = new Set(events.map(e => e.extendedProps?.siteId));

  // Analyze each site for intelligent suggestions
  sites.forEach(site => {
    const cityData = cityCoordinates[site.location];
    const isScheduled = scheduledSites.has(site.id);
    const priority = cityData?.priority || 'medium';
    
    if (!isScheduled) {
      // Calculate optimal inspection date based on priority and location
      const daysOffset = priority === 'high' ? 1 : priority === 'medium' ? 3 : 7;
      const suggestedDate = new Date(now);
      suggestedDate.setDate(now.getDate() + daysOffset);
      
      // Calculate efficiency score based on location clustering
      const nearbyScheduled = events.filter(e => {
        const eventSite = sites.find(s => s.id === e.extendedProps?.siteId);
        return eventSite?.location === site.location;
      }).length;
      
      const efficiency = nearbyScheduled > 0 ? 'high' : 'medium';
      const reason = nearbyScheduled > 0 ? 'Cluster with existing inspections' : 
                    priority === 'high' ? 'High priority location' : 'Routine inspection due';
      
      suggestions.push({
        id: site.id,
        siteName: site.name,
        location: site.location,
        priority,
        efficiency,
        suggestedDate: suggestedDate.toDateString(),
        reason,
        daysFromNow: daysOffset,
        zone: cityData?.zone || 'unknown'
      });
    }
  });

  // Sort by priority and efficiency
  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const efficiencyOrder = { high: 3, medium: 2, low: 1 };
    
    const scoreA = priorityOrder[a.priority] + efficiencyOrder[a.efficiency];
    const scoreB = priorityOrder[b.priority] + efficiencyOrder[b.efficiency];
    
    return scoreB - scoreA;
  }).slice(0, 8); // Top 8 suggestions
};

const InspectionCalendar = () => {
  const [sites, setSites] = useState([]);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [pendingEvent, setPendingEvent] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedSite, setSelectedSite] = useState(null);
  const [mapCenter, setMapCenter] = useState([-1.286389, 36.817223]);
  const [mapZoom, setMapZoom] = useState(6);
  const [activeView, setActiveView] = useState('calendar');
  const externalRef = useRef(null);
  const calendarRef = useRef(null);
  const mapRef = useRef(null);

  // API functions for persistence
  const saveTask = async (eventData, assignedUserEmail) => {
    try {
      const taskData = {
        title: eventData.title,
        asset_id: eventData.extendedProps?.siteId || eventData.title,
        frequency: 'once',
        assigned_to: assignedUserEmail,
        next_run: eventData.start.toISOString()
      };
      
      const response = await authFetch(`${API_BASE_URL}${API_ENDPOINTS.TASK_CREATE}`, {
        method: 'POST',
        body: JSON.stringify(taskData)
      });
      
      const data = await response.json();
      console.log('Save task response:', data);
      return data;
    } catch (error) {
      console.error('Error saving task:', error);
      throw error;
    }
  };

  const loadTasks = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}${API_ENDPOINTS.TASKS}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  };
  
  // Clear cache function
  const clearCalendarCache = () => {
    calendarCache = {
      sites: null,
      users: null,
      tasks: null,
      timestamp: null
    };
  };

  const deleteTask = async (taskId) => {
    try {
      await authFetch(`${API_BASE_URL}${API_ENDPOINTS.TASK_BY_ID(taskId)}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  // Optimized data loading with caching and progressive updates
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const now = Date.now();
        
        // Check cache first
        const useCache = calendarCache.timestamp && 
          (now - calendarCache.timestamp < CACHE_DURATION);
        
        if (useCache) {
          console.log('Calendar: Using cached data');
          setSites(calendarCache.sites || []);
          setUsers(calendarCache.users || []);
          setEvents(calendarCache.tasks || []);
          setLoading(false);
          return;
        }
        
        console.log('Calendar: Loading fresh data');
        
        // Load sites first (fastest)
        const loadedSites = await getSites().catch(() => []);
        const normalizedSites = (Array.isArray(loadedSites) ? loadedSites : []).map(site => ({
          id: site.id || site.site_id || site.siteId,
          name: site.name || site.site_name || '',
          location: site.location || 'Nairobi',
          status: 'pending',
        })).filter(Boolean);
        setSites(normalizedSites);
        calendarCache.sites = normalizedSites;
        
        // Load users with cache (faster on subsequent loads)
        const loadedUsers = await getUsers().catch(() => []);
        const normalizedUsers = Array.isArray(loadedUsers) ? loadedUsers : [];
        setUsers(normalizedUsers);
        calendarCache.users = normalizedUsers;
        
        // Load tasks in background
        loadTasksAsync();
        
        // Update cache timestamp
        calendarCache.timestamp = now;
        
      } catch (err) {
        console.error('Failed to load calendar data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    // Async task loading to avoid blocking UI
    const loadTasksAsync = async () => {
      try {
        const tasks = await loadTasks();
        const calendarEvents = tasks.map(task => ({
          id: task.task_id,
          title: task.title,
          start: task.next_run,
          extendedProps: {
            siteId: task.asset_id,
            taskId: task.task_id
          }
        }));
        setEvents(calendarEvents);
        calendarCache.tasks = calendarEvents;
      } catch (err) {
        console.error('Failed to load tasks:', err);
        setEvents([]);
      }
    };

    loadData();
  }, []);

  // Make external sites draggable
  useEffect(() => {
    if (!externalRef.current) return;

    const draggable = new Draggable(externalRef.current, {
      itemSelector: '.external-event',
      eventData: (el) => ({
        title: el.dataset.title,
        extendedProps: { siteId: el.dataset.siteId },
      }),
    });

    return () => draggable.destroy();
  }, [sites]);

  // Add event when dropped onto calendar - show assignment modal
  const handleEventReceive = (info) => {
    const eventData = {
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      extendedProps: info.event.extendedProps,
    };
    
    setPendingEvent({ eventData, info });
    setSelectedUser('');
    setShowAssignModal(true);
  };
  
  // Handle user assignment and save task
  const handleAssignUser = async () => {
    if (!selectedUser || !pendingEvent) return;
    
    try {
      const { eventData, info } = pendingEvent;
      
      // Save to backend with assigned user
      const response = await saveTask(eventData, selectedUser);
      
      // Check if save was successful
      if (!response.ok) {
        throw new Error(response.error || 'Failed to save task');
      }
      
      const savedTask = response.task;
      
      // Find selected user's name
      const selectedUserObj = users.find(u => u.email === selectedUser);
      const userName = selectedUserObj ? selectedUserObj.name : selectedUser;
      
      // Send inspection reminder notification
      sendInspectionReminder({
        asset_id: savedTask.asset_id,
        scheduled_for: eventData.start.toISOString(),
        inspector: selectedUser,
        inspector_name: userName
      });
      
      // Add to local state with backend ID
      const newEvent = {
        id: savedTask.task_id,
        title: info.event.title,
        start: info.event.start,
        end: info.event.end,
        extendedProps: {
          ...info.event.extendedProps,
          taskId: savedTask.task_id,
          assignedTo: selectedUser
        },
      };
      
      const updatedEvents = [...events, newEvent];
      setEvents(updatedEvents);
      
      // Update cache
      calendarCache.tasks = updatedEvents;
      console.log('Event saved successfully:', savedTask);
      
      // Close modal
      setShowAssignModal(false);
      setPendingEvent(null);
    } catch (error) {
      console.error('Failed to save event:', error);
      // Remove the event from calendar if save failed
      pendingEvent.info.revert();
      alert('Failed to save inspection to calendar. Please try again.');
      setShowAssignModal(false);
      setPendingEvent(null);
    }
  };
  
  // Handle modal cancel
  const handleCancelAssign = () => {
    if (pendingEvent) {
      pendingEvent.info.revert();
    }
    setShowAssignModal(false);
    setPendingEvent(null);
    setSelectedUser('');
  };

  // Update event when dragged
  const handleEventDrop = (info) => {
    setEvents(
      events.map((e) =>
        e.id === info.event.id
          ? { ...e, start: info.event.start, end: info.event.end }
          : e
      )
    );
  };

  // Enhanced AI Suggestions with site selection
  const suggestions = getAISuggestions(sites, events, selectedSite);
  
  // Handle suggestion click - apply to calendar
  const applySuggestion = (suggestion) => {
    const site = sites.find(s => s.id === suggestion.id);
    if (!site) return;
    
    // Create event data
    const eventData = {
      title: site.name,
      start: new Date(suggestion.suggestedDate),
      extendedProps: { siteId: site.id }
    };
    
    // Show assignment modal
    setPendingEvent({ eventData, info: { event: eventData, revert: () => {} } });
    setSelectedUser('');
    setShowAssignModal(true);
  };
  
  // Handle map marker click
  const handleMarkerClick = (site) => {
    setSelectedSite(site);
    const cityData = cityCoordinates[site.location];
    if (cityData) {
      setMapCenter(cityData.coords);
      setMapZoom(10);
    }
  };
  
  // Enhanced event click with action modal
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showChangeInspector, setShowChangeInspector] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newInspector, setNewInspector] = useState('');
  
  const handleCalendarEventClick = (info) => {
    const currentInspector = info.event.extendedProps?.assignedTo;
    console.log('Event clicked:', info.event.title, 'Assigned to:', currentInspector);
    
    setSelectedEvent({
      event: info.event,
      site: sites.find(s => s.id === info.event.extendedProps?.siteId),
      currentInspector: currentInspector
    });
    setShowEventModal(true);
  };
  
  const handleViewOnMap = () => {
    if (selectedEvent?.site) {
      setSelectedSite(selectedEvent.site);
      const cityData = cityCoordinates[selectedEvent.site.location];
      if (cityData) {
        setMapCenter(cityData.coords);
        setMapZoom(12);
        setActiveView('map');
      }
    }
    setShowEventModal(false);
    setSelectedEvent(null);
  };
  
  const handleChangeInspector = () => {
    setNewInspector(selectedEvent?.currentInspector || '');
    setShowChangeInspector(true);
  };
  
  const handleUpdateInspector = async () => {
    if (!selectedEvent || !newInspector) return;
    
    try {
      const taskId = selectedEvent.event.extendedProps?.taskId || selectedEvent.event.id;
      
      // Update task with new inspector
      const response = await authFetch(`${API_BASE_URL}${API_ENDPOINTS.TASK_BY_ID(taskId)}`, {
        method: 'PUT',
        body: JSON.stringify({ assigned_to: newInspector })
      });
      
      if (response.ok) {
        // Update local state with new inspector
        const updatedEvents = events.map(e => {
          if (e.id === selectedEvent.event.id) {
            console.log('Updating event:', e.title, 'from', e.extendedProps?.assignedTo, 'to', newInspector);
            return { ...e, extendedProps: { ...e.extendedProps, assignedTo: newInspector } };
          }
          return e;
        });
        setEvents(updatedEvents);
        calendarCache.tasks = updatedEvents;
        
        // Send notification to new inspector
        const newInspectorObj = users.find(u => u.email === newInspector);
        if (newInspectorObj) {
          sendInspectionReminder({
            asset_id: selectedEvent.event.extendedProps?.siteId,
            scheduled_for: selectedEvent.event.start,
            inspector: newInspector,
            inspector_name: newInspectorObj.name
          });
        }
      }
    } catch (error) {
      console.error('Failed to update inspector:', error);
      alert('Failed to update inspector assignment.');
    }
    
    setShowChangeInspector(false);
    setShowEventModal(false);
    setSelectedEvent(null);
    setNewInspector('');
  };
  
  const handleDeleteEvent = () => {
    setShowDeleteConfirm(true);
  };
  
  const confirmDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      const taskId = selectedEvent.event.extendedProps?.taskId || selectedEvent.event.id;
      if (taskId) await deleteTask(taskId);
      
      const updatedEvents = events.filter((e) => e.id !== selectedEvent.event.id);
      setEvents(updatedEvents);
      calendarCache.tasks = updatedEvents;
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete inspection from calendar.');
    }
    
    setShowDeleteConfirm(false);
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  return (
    <div style={{ padding: '0', backgroundColor: 'transparent' }}>
      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          borderRadius: '16px',
          margin: '1rem'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📅</div>
          <p style={{ color: '#6c757d', fontSize: '16px' }}>Loading calendar data...</p>
        </div>
      )}
      
      {/* Event Action Modal */}
      {showEventModal && selectedEvent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            minWidth: '400px',
            maxWidth: '90vw',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #007bff 0%, #6610f2 100%)',
              padding: '1.5rem',
              color: 'white'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: '600' }}>📅 {selectedEvent.event.title}</h3>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
                {selectedEvent.site ? `📍 ${selectedEvent.site.location}` : 'Scheduled Inspection'}
              </p>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              <p style={{ color: '#6c757d', margin: '0 0 1.5rem 0', fontSize: '14px' }}>
                What would you like to do with this inspection?
              </p>
              
              {/* Show current inspector info */}
              <div style={{
                padding: '12px',
                backgroundColor: selectedEvent.currentInspector ? '#e8f5e8' : '#fff3cd',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '13px',
                color: '#495057',
                border: `1px solid ${selectedEvent.currentInspector ? '#c3e6cb' : '#ffeaa7'}`
              }}>
                <strong>Current Inspector:</strong> {selectedEvent.currentInspector ? 
                  (users.find(u => u.email === selectedEvent.currentInspector)?.name || selectedEvent.currentInspector) : 
                  'No inspector assigned yet'
                }
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {selectedEvent.site && (
                  <button
                    onClick={handleViewOnMap}
                    style={{
                      padding: '12px 16px',
                      background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    🗺️ View Site on Map
                  </button>
                )}
                
                <button
                  onClick={handleChangeInspector}
                  style={{
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  👤 Change Inspector
                </button>
                
                <button
                  onClick={handleDeleteEvent}
                  style={{
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  🗑️ Delete Inspection
                </button>
                
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    setSelectedEvent(null);
                  }}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Change Inspector Modal */}
      {showChangeInspector && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            minWidth: '500px',
            maxWidth: '90vw',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #007bff 0%, #6610f2 100%)',
              padding: '2rem',
              color: 'white'
            }}>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '600' }}>👤 Change Inspector</h2>
              <p style={{ margin: 0, opacity: 0.9 }}>Reassign this inspection to a different team member</p>
            </div>
            
            <div style={{ padding: '2rem' }}>
              {/* Current Inspector Highlight */}
              <div style={{
                padding: '1rem',
                backgroundColor: selectedEvent?.currentInspector ? '#e3f2fd' : '#fff3cd',
                border: `2px solid ${selectedEvent?.currentInspector ? '#2196f3' : '#ffc107'}`,
                borderRadius: '12px',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: selectedEvent?.currentInspector ? '#2196f3' : '#ffc107',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px'
                }}>
                  {selectedEvent?.currentInspector ? '👤' : '❓'}
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: selectedEvent?.currentInspector ? '#1976d2' : '#f57c00', fontSize: '14px' }}>
                    {selectedEvent?.currentInspector ? 'CURRENTLY ASSIGNED TO:' : 'NO INSPECTOR ASSIGNED:'}
                  </div>
                  <div style={{ fontWeight: '700', color: selectedEvent?.currentInspector ? '#0d47a1' : '#e65100', fontSize: '16px' }}>
                    {selectedEvent?.currentInspector ? 
                      (users.find(u => u.email === selectedEvent.currentInspector)?.name || selectedEvent.currentInspector) :
                      'This inspection needs an inspector'
                    }
                  </div>
                  {selectedEvent?.currentInspector && (
                    <div style={{ fontSize: '12px', color: '#1565c0' }}>
                      {selectedEvent.currentInspector}
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  color: '#495057'
                }}>Select New Inspector:</label>
                <select
                  value={newInspector}
                  onChange={(e) => setNewInspector(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: '#f8f9fa',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#007bff'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                >
                  <option value="">{selectedEvent?.currentInspector ? 'Choose a different inspector...' : 'Choose an inspector...'}</option>
                  {users.map(user => {
                    const isCurrent = user.email === selectedEvent?.currentInspector;
                    return (
                      <option 
                        key={user.email} 
                        value={user.email}
                        style={{
                          backgroundColor: isCurrent ? '#e3f2fd' : 'white',
                          fontWeight: isCurrent ? 'bold' : 'normal'
                        }}
                      >
                        {isCurrent ? '👤 [CURRENT] ' : ''}{user.name} ({user.email})
                      </option>
                    );
                  })}
                </select>
                
                {/* Debug info */}
                <div style={{
                  marginTop: '0.5rem',
                  padding: '8px 12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#6c757d',
                  fontFamily: 'monospace'
                }}>
                  Debug: Current = {selectedEvent?.currentInspector || 'null'}
                </div>
              </div>
              
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                justifyContent: 'flex-end',
                paddingTop: '1rem',
                borderTop: '1px solid #e9ecef'
              }}>
                <button
                  onClick={() => {
                    setShowChangeInspector(false);
                    setNewInspector('');
                  }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateInspector}
                  disabled={!newInspector}
                  style={{
                    padding: '12px 24px',
                    background: newInspector ? 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: newInspector ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    boxShadow: newInspector ? '0 4px 12px rgba(0,123,255,0.3)' : 'none'
                  }}
                >
                  Update Inspector
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1002,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            minWidth: '450px',
            maxWidth: '90vw',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
              padding: '2rem',
              color: 'white',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '600' }}>Confirm Deletion</h2>
              <p style={{ margin: 0, opacity: 0.9 }}>This action cannot be undone</p>
            </div>
            
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p style={{ color: '#495057', margin: '0 0 1.5rem 0', fontSize: '16px', lineHeight: '1.5' }}>
                Are you sure you want to delete the inspection for <strong>"{selectedEvent?.event.title}"</strong>?
                {selectedEvent?.site && (
                  <><br /><span style={{ color: '#6c757d', fontSize: '14px' }}>📍 {selectedEvent.site.location}</span></>
                )}
              </p>
              
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    minWidth: '120px'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteEvent}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(220,53,69,0.3)',
                    minWidth: '120px'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(220,53,69,0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(220,53,69,0.3)';
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Enhanced User Assignment Modal */}
      {showAssignModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            minWidth: '500px',
            maxWidth: '90vw',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #007bff 0%, #6610f2 100%)',
              padding: '2rem',
              color: 'white'
            }}>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '600' }}>👤 Assign Inspection</h2>
              <p style={{ margin: 0, opacity: 0.9 }}>Schedule this inspection with a team member</p>
            </div>
            
            <div style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  color: '#495057'
                }}>Inspector:</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: '#f8f9fa',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#007bff'}
                  onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                >
                  <option value="">Select an inspector...</option>
                  {users.map(user => (
                    <option key={user.email} value={user.email}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                justifyContent: 'flex-end',
                paddingTop: '1rem',
                borderTop: '1px solid #e9ecef'
              }}>
                <button
                  onClick={handleCancelAssign}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#5a6268'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#6c757d'}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignUser}
                  disabled={!selectedUser}
                  style={{
                    padding: '12px 24px',
                    background: selectedUser ? 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: selectedUser ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedUser ? '0 4px 12px rgba(0,123,255,0.3)' : 'none'
                  }}
                >
                  Assign Inspector
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        padding: '0.5rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
        border: '1px solid #e9ecef'
      }}>
        {[
          { id: 'calendar', label: '📅 Calendar', icon: '📅' },
          { id: 'map', label: '🗺️ Site Map', icon: '🗺️' },
          { id: 'suggestions', label: '🤖 AI Insights', icon: '🤖' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            style={{
              flex: 1,
              padding: '1rem 1.5rem',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              background: activeView === tab.id 
                ? 'linear-gradient(135deg, #007bff 0%, #6610f2 100%)'
                : 'transparent',
              color: activeView === tab.id ? 'white' : '#6c757d',
              boxShadow: activeView === tab.id ? '0 4px 12px rgba(0,123,255,0.3)' : 'none'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Calendar View */}
      {activeView === 'calendar' && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', height: '600px' }}>
          {/* Enhanced Draggable Sites Panel */}
          <div style={{
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderRadius: '16px',
            padding: '1.5rem',
            border: '1px solid #e9ecef',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ 
              margin: '0 0 1rem 0', 
              color: '#495057', 
              fontSize: '1.1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🏗️ Available Sites
            </h3>
            <p style={{ 
              fontSize: '12px', 
              color: '#6c757d', 
              margin: '0 0 1rem 0',
              fontStyle: 'italic'
            }}>
              Drag sites onto the calendar to schedule inspections
            </p>
            
            <div ref={externalRef} style={{ maxHeight: '450px', overflowY: 'auto' }}>
              {sites.map(site => {
                const isScheduled = events.some(e => e.extendedProps?.siteId === site.id);
                const cityData = cityCoordinates[site.location];
                
                return (
                  <div
                    key={site.id}
                    className="external-event"
                    data-site-id={site.id}
                    data-title={site.name}
                    style={{
                      margin: '0 0 0.75rem 0',
                      padding: '1rem',
                      background: isScheduled 
                        ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
                        : 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                      color: 'white',
                      borderRadius: '12px',
                      cursor: isScheduled ? 'default' : 'grab',
                      fontSize: '13px',
                      fontWeight: '500',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      transition: 'all 0.2s ease',
                      opacity: isScheduled ? 0.7 : 1,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseOver={(e) => {
                      if (!isScheduled) {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isScheduled) {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{site.name}</div>
                        <div style={{ fontSize: '11px', opacity: 0.9 }}>📍 {site.location}</div>
                      </div>
                      <div style={{ 
                        fontSize: '18px',
                        opacity: 0.8
                      }}>
                        {isScheduled ? '✅' : cityData?.priority === 'high' ? '🔥' : '📋'}
                      </div>
                    </div>
                    {isScheduled && (
                      <div style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        fontSize: '10px',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px'
                      }}>
                        SCHEDULED
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Enhanced Calendar */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid #e9ecef'
          }}>
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
              }}
              editable={true}
              droppable={true}
              events={events}
              eventReceive={handleEventReceive}
              eventDrop={handleEventDrop}
              eventClick={handleCalendarEventClick}
              height="500px"
              eventDisplay="block"
              eventBackgroundColor="#007bff"
              eventBorderColor="#0056b3"
              eventTextColor="white"
              dayMaxEvents={3}
              moreLinkClick="popover"
              eventDidMount={(info) => {
                info.el.style.borderRadius = '6px';
                info.el.style.border = 'none';
                info.el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
            />
          </div>
        </div>
      )}

      {/* Enhanced Interactive Map */}
      {activeView === 'map' && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ 
              margin: 0, 
              color: '#495057', 
              fontSize: '1.2rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🗺️ Interactive Site Map
            </h3>
            {selectedSite && (
              <div style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#e3f2fd',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#1976d2',
                fontWeight: '500'
              }}>
                📍 Viewing: {selectedSite.name}
              </div>
            )}
          </div>
          
          {sites.length > 0 && (
            <div style={{ height: '500px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e9ecef' }}>
              <MapContainer
                ref={mapRef}
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
                key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                {sites.map(site => {
                  const cityData = cityCoordinates[site.location];
                  if (!cityData) return null;
                  
                  const isScheduled = events.some(e => e.extendedProps?.siteId === site.id);
                  const isSelected = selectedSite?.id === site.id;
                  const status = isScheduled ? 'scheduled' : 'available';

                  return (
                    <Marker
                      key={site.id}
                      position={cityData.coords}
                      icon={statusIcons[status]}
                      eventHandlers={{
                        click: () => handleMarkerClick(site)
                      }}
                    >
                      <Popup>
                        <div style={{ minWidth: '200px', padding: '0.5rem' }}>
                          <h4 style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>{site.name}</h4>
                          <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '0.5rem' }}>
                            📍 {site.location} • {cityData.zone} zone
                          </div>
                          <div style={{ 
                            display: 'inline-block',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: isScheduled ? '#d4edda' : '#fff3cd',
                            color: isScheduled ? '#155724' : '#856404',
                            marginBottom: '0.5rem'
                          }}>
                            {isScheduled ? '✅ SCHEDULED' : '📅 AVAILABLE'}
                          </div>
                          <div style={{ 
                            display: 'inline-block',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: cityData.priority === 'high' ? '#f8d7da' : 
                                           cityData.priority === 'medium' ? '#fff3cd' : '#d1ecf1',
                            color: cityData.priority === 'high' ? '#721c24' : 
                                   cityData.priority === 'medium' ? '#856404' : '#0c5460',
                            marginLeft: '0.5rem'
                          }}>
                            {cityData.priority.toUpperCase()} PRIORITY
                          </div>
                          {site.description && (
                            <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '0.5rem' }}>
                              {site.description}
                            </div>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          )}
          
          {/* Map Legend */}
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            display: 'flex',
            gap: '2rem',
            flexWrap: 'wrap',
            fontSize: '13px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#007bff' }}></div>
              <span>📅 Scheduled</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#6c757d' }}></div>
              <span>📍 Available</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#dc3545' }}></div>
              <span>🔥 High Priority</span>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced AI Suggestions */}
      {activeView === 'suggestions' && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              margin: '0 0 0.5rem 0', 
              color: '#495057', 
              fontSize: '1.3rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🤖 AI-Powered Inspection Insights
            </h3>
            <p style={{ color: '#6c757d', margin: 0, fontSize: '14px' }}>
              Smart recommendations based on priority, location clustering, and scheduling efficiency
            </p>
          </div>
          
          {suggestions.length > 0 ? (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {suggestions.map((suggestion, idx) => {
                const priorityColors = {
                  high: { bg: '#fff5f5', border: '#fed7d7', text: '#c53030', icon: '🔥' },
                  medium: { bg: '#fffbf0', border: '#feebc8', text: '#d69e2e', icon: '⚡' },
                  low: { bg: '#f0fff4', border: '#c6f6d5', text: '#38a169', icon: '📋' }
                };
                
                const efficiencyColors = {
                  high: { bg: '#e6fffa', text: '#319795', icon: '🎯' },
                  medium: { bg: '#f7fafc', text: '#4a5568', icon: '📊' },
                  low: { bg: '#fef5e7', text: '#d69e2e', icon: '⏰' }
                };
                
                const pColor = priorityColors[suggestion.priority];
                const eColor = efficiencyColors[suggestion.efficiency];
                
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: `2px solid ${pColor.border}`,
                      backgroundColor: pColor.bg,
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onClick={() => applySuggestion(suggestion)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <h4 style={{ 
                          margin: '0 0 0.5rem 0', 
                          color: '#2d3748', 
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          🏗️ {suggestion.siteName}
                        </h4>
                        <div style={{ fontSize: '13px', color: '#4a5568', marginBottom: '0.5rem' }}>
                          📍 {suggestion.location} • {suggestion.zone} zone
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <div style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: 'white',
                          color: pColor.text,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          {pColor.icon} {suggestion.priority.toUpperCase()}
                        </div>
                        <div style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: eColor.bg,
                          color: eColor.text,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          {eColor.icon} {suggestion.efficiency.toUpperCase()} EFFICIENCY
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#718096', marginBottom: '0.25rem' }}>Suggested Date</div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#2d3748' }}>📅 {suggestion.suggestedDate}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#718096', marginBottom: '0.25rem' }}>Timeline</div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#2d3748' }}>⏱️ {suggestion.daysFromNow} days from now</div>
                      </div>
                    </div>
                    
                    <div style={{ 
                      padding: '0.75rem',
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#4a5568',
                      fontStyle: 'italic',
                      marginBottom: '1rem'
                    }}>
                      💡 {suggestion.reason}
                    </div>
                    
                    <button
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(0,123,255,0.3)'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = '0 6px 16px rgba(0,123,255,0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 12px rgba(0,123,255,0.3)';
                      }}
                    >
                      📅 Schedule This Inspection
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              border: '2px dashed #dee2e6'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
              <h4 style={{ color: '#6c757d', margin: '0 0 0.5rem 0' }}>All Sites Scheduled!</h4>
              <p style={{ color: '#6c757d', margin: 0, fontSize: '14px' }}>
                Great job! All available sites have been scheduled for inspection.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InspectionCalendar;