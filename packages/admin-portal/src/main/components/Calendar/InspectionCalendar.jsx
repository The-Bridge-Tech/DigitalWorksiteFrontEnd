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

// Fix Leaflet default icons
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

import './InspectionCalendar.css';

// Define city → coordinates (since we don’t have exact lat/long)
const cityCoordinates = {
  Nairobi: [-1.286389, 36.817223],
  Nakuru: [-0.3031, 36.0800],
  Mombasa: [-4.0435, 39.6682],
  Kisumu: [-0.0917, 34.7680],
  Eldoret: [0.5143, 35.2698],
};

// Define color-coded icons by status
const statusIcons = {
  completed: new L.DivIcon({
    className: 'custom-icon',
    html: '✅',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  }),
  pending: new L.DivIcon({
    className: 'custom-icon',
    html: '🟡',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  }),
  overdue: new L.DivIcon({
    className: 'custom-icon',
    html: '🔴',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  }),
};

// ---- AI Suggestions Function ----
const getAISuggestions = (sites, events) => {
  const suggestions = [];

  // Group by city
  const groupedByCity = sites.reduce((acc, site) => {
    acc[site.location] = acc[site.location] || [];
    acc[site.location].push(site);
    return acc;
  }, {});

  // Loop through grouped sites
  Object.entries(groupedByCity).forEach(([city, citySites]) => {
    citySites.forEach((site, index) => {
      const priority = city === 'Nairobi' ? 'High' : 'Normal';

      // Suggest next available slot (just sequential days for now)
      const nextAvailableDate = new Date();
      nextAvailableDate.setDate(nextAvailableDate.getDate() + suggestions.length);

      suggestions.push({
        siteName: site.name,
        location: site.location,
        priority,
        suggestedDate: nextAvailableDate.toDateString(),
      });
    });
  });

  return suggestions;
};

const InspectionCalendar = () => {
  const [sites, setSites] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const externalRef = useRef(null);
  const calendarRef = useRef(null);

  // API functions for persistence
  const saveTask = async (eventData) => {
    try {
      const taskData = {
        title: eventData.title,
        asset_id: eventData.extendedProps?.siteId || eventData.title,
        frequency: 'once',
        assigned_to: 'System',
        next_run: eventData.start.toISOString()
      };
      
      const response = await authFetch('http://localhost:5004/tasks/create', {
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
      const response = await authFetch('http://localhost:5004/tasks');
      const data = await response.json();
      console.log('Loaded tasks:', data);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await authFetch(`http://localhost:5004/tasks/${taskId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  // Load sites and existing calendar events
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load sites
        const loadedSites = await getSites();
        const normalizedSites = (Array.isArray(loadedSites) ? loadedSites : []).map(site => ({
          id: site.id || site.site_id || site.siteId,
          name: site.name || site.site_name || '',
          location: site.location || 'Nairobi',
          status: 'pending',
        })).filter(Boolean);
        setSites(normalizedSites);
        
        // Load existing tasks/events
        const tasks = await loadTasks();
        console.log('Converting tasks to events:', tasks);
        const calendarEvents = tasks.map(task => ({
          id: task.task_id,
          title: task.title,
          start: task.next_run,
          extendedProps: {
            siteId: task.asset_id,
            taskId: task.task_id
          }
        }));
        console.log('Calendar events:', calendarEvents);
        setEvents(calendarEvents);
        
      } catch (err) {
        console.error('Failed to load calendar data:', err);
      } finally {
        setLoading(false);
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

  // Add event when dropped onto calendar and save to backend
  const handleEventReceive = async (info) => {
    try {
      const eventData = {
        title: info.event.title,
        start: info.event.start,
        end: info.event.end,
        extendedProps: info.event.extendedProps,
      };
      
      // Save to backend
      const response = await saveTask(eventData);
      
      // Check if save was successful
      if (!response.ok) {
        throw new Error(response.error || 'Failed to save task');
      }
      
      const savedTask = response.task;
      
      // Add to local state with backend ID
      const newEvent = {
        id: savedTask.task_id,
        title: info.event.title,
        start: info.event.start,
        end: info.event.end,
        extendedProps: {
          ...info.event.extendedProps,
          taskId: savedTask.task_id
        },
      };
      
      setEvents([...events, newEvent]);
      console.log('Event saved successfully:', savedTask);
    } catch (error) {
      console.error('Failed to save event:', error);
      // Remove the event from calendar if save failed
      info.revert();
      alert('Failed to save inspection to calendar. Please try again.');
    }
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

  // Delete event on click and remove from backend
  const handleEventClick = async (info) => {
    if (window.confirm(`Delete "${info.event.title}"?`)) {
      try {
        const taskId = info.event.extendedProps?.taskId || info.event.id;
        
        // Delete from backend if it has a taskId
        if (taskId) {
          await deleteTask(taskId);
        }
        
        // Remove from local state
        setEvents(events.filter((e) => e.id !== info.event.id));
        console.log('Event deleted successfully');
      } catch (error) {
        console.error('Failed to delete event:', error);
        alert('Failed to delete inspection from calendar. Please try again.');
      }
    }
  };

  // AI Suggestions
  const suggestions = getAISuggestions(sites, events);

  return (
    <div className="inspection-calendar">
      <h2>Inspection Calendar</h2>
      
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          Loading calendar data...
        </div>
      )}

      <div className="calendar-container">
        {/* Draggable sites */}
        <div className="external-events" ref={externalRef}>
          <h4>Sites (drag onto calendar)</h4>
          {sites.map(site => (
            <div
              key={site.id}
              className="external-event"
              data-site-id={site.id}
              data-title={site.name}
            >
              {site.name} ({site.location})
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div className="calendar-wrapper">
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
            eventClick={handleEventClick}
            height="auto"
          />
        </div>
      </div>

      {/* Map Section */}
      <div className="map-section">
        <h3>Inspection Map</h3>
        {sites.length > 0 && (
          <MapContainer
            center={[-1.286389, 36.817223]}
            zoom={6}
            style={{ height: '400px', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {sites.map(site => {
              const coords = cityCoordinates[site.location];
              if (!coords) return null;

              return (
                <Marker
                  key={site.id}
                  position={coords}
                  icon={statusIcons[site.status || 'pending']}
                >
                  <Popup>
                    <strong>{site.name}</strong><br />
                    Location: {site.location}<br />
                    Status: {site.status}
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}
      </div>

      {/* AI Suggestions Section */}
      <div className="ai-suggestions">
        <h3>AI Suggestions</h3>
        {suggestions.length > 0 ? (
          <ul>
            {suggestions.map((s, idx) => (
              <li key={idx}>
                <strong>{s.siteName}</strong> ({s.location}) → 
                <em> {s.priority} Priority</em>, Suggested: {s.suggestedDate}
              </li>
            ))}
          </ul>
        ) : (
          <p>No suggestions available.</p>
        )}
      </div>
    </div>
  );
};

export default InspectionCalendar;