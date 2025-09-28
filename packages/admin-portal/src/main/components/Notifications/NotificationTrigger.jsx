// Utility functions to trigger notifications from other components
import { API_BASE_URL } from '../../config/api.config.js';

export const sendNotification = async (type, title, body, recipients = []) => {
    try {
        const response = await fetch(`${API_BASE_URL}/notifications/push`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                type,
                title,
                body,
                to: recipients,
                from: 'gidionmutai@btg.africa'
            })
        });
        
        if (response.ok) {
            console.log('Notification sent successfully');
        }
    } catch (error) {
        console.error('Failed to send notification:', error);
    }
};

export const sendInspectionReminder = (inspection) => {
    const scheduledDateTime = new Date(inspection.scheduled_for).toLocaleString();
    sendNotification(
        'inspection',
        `Inspection Reminder: ${inspection.asset_id}`,
        `Inspection scheduled for ${scheduledDateTime} assigned to ${inspection.inspector_name || inspection.inspector}`,
        [inspection.inspector]
    );
};

export const sendSafetyAlert = (checkIn) => {
    sendNotification(
        'safety',
        'Safety Alert: Severe Weather Detected',
        `Severe weather conditions detected at ${checkIn.site_id}. Weather: ${checkIn.weather_conditions}`,
        [] // Portal-only notification, no emails sent
    );
};