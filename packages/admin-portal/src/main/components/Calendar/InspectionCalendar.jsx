// src/main/components/Calendar/InspectionCalendar.jsx
import React, { useRef, useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { getSites } from '../../services/site.service';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';
import './InspectionCalendar.css';

const InspectionCalendar = () => {
  const [sites, setSites] = useState([]);
  const [events, setEvents] = useState([]);
  const externalRef = useRef(null);
  const calendarRef = useRef(null);

  // Default fallback positions for known locations
  const cityCoordinates = {
    Nairobi: [-1.2921, 36.8219],
    Nakuru: [-0.3031, 36.0800],
    Mombasa: [-4.0435, 39.6682],
    Kisumu: [-0.0917, 34.7679],
    Eldoret: [0.5143, 35.2698],
  };

  // ✅ Pick emoji based on inspection status
  const getStatusIcon = (status) => {
    let emoji = '🟡'; // default pending
    if (status === 'completed') emoji = '🟢';
    if (status === 'overdue') emoji = '🔴';

    return L.divIcon({
      className: 'custom-status-marker',
      html: `<div style="font-size:24px">${emoji}</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
    });
  };

  // Load sites dynamically
  useEffect(() => {
    const loadSites = async () => {
      try {
        const loadedSites = await getSites();
        const normalizedSites = (Array.isArray(loadedSites) ? loadedSites : [])
          .map(site => ({
            id: site.id || site.site_id || site.siteId,
            name: site.name || site.site_name || '',
            location: site.location || 'Nairobi',
            status: site.status || 'pending', // default all to pending
          }))
          .filter(Boolean)
          .map(site => ({
            ...site,
            position: cityCoordinates[site.location] || cityCoordinates['Nairobi'],
          }));

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
              {site.name}
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

      {/* Map with color-coded site status */}
      <div className="map-container">
        <h3>Inspection Status Map</h3>
        <MapContainer
          center={[-1.2921, 36.8219]}
          zoom={7}
          style={{ height: '400px', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          />
          {sites.map(site => (
            <Marker
              key={site.id}
              position={site.position}
              icon={getStatusIcon(site.status)}
            >
              <Popup>
                <strong>{site.name}</strong>
                <br />
                Location: {site.location}
                <br />
                Status:{' '}
                {site.status === 'completed' ? (
                  <span style={{ color: 'green' }}>Completed</span>
                ) : site.status === 'overdue' ? (
                  <span style={{ color: 'red' }}>Overdue</span>
                ) : (
                  <span style={{ color: 'orange' }}>Pending</span>
                )}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default InspectionCalendar;