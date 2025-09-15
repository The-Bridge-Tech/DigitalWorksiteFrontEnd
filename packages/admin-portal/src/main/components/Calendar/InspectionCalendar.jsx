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
  const externalRef = useRef(null);
  const calendarRef = useRef(null);

  // Load sites dynamically
  useEffect(() => {
    const loadSites = async () => {
      try {
        const loadedSites = await getSites();
        const normalizedSites = (Array.isArray(loadedSites) ? loadedSites : []).map(site => ({
          id: site.id || site.site_id || site.siteId,
          name: site.name || site.site_name || '',
          location: site.location || 'Nairobi',
          status: 'pending', // default for now
        })).filter(Boolean);
        setSites(normalizedSites);
      } catch (err) {
        console.error('Failed to load sites for calendar:', err);
      }
    };

    loadSites();
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

  // Add event when dropped onto calendar
  const handleEventReceive = (info) => {
    const newEvent = {
      id: String(events.length + 1),
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      extendedProps: info.event.extendedProps,
    };
    setEvents([...events, newEvent]);
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

  // Delete event on click
  const handleEventClick = (info) => {
    if (window.confirm(`Delete "${info.event.title}"?`)) {
      setEvents(events.filter((e) => e.id !== info.event.id));
    }
  };

  // AI Suggestions
  const suggestions = getAISuggestions(sites, events);

  return (
    <div className="inspection-calendar">
      <h2>Inspection Calendar</h2>

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