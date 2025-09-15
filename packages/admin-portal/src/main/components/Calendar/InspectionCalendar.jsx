// src/main/components/Calendar/InspectionCalendar.jsx
import React, { useRef, useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { getSites } from '../../services/site.service'; // same service used in Site List

import './InspectionCalendar.css'; // custom styles scoped to this page

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
    </div>
  );
};

export default InspectionCalendar;