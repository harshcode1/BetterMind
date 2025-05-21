// app/lib/googleCalendar.js
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Google Calendar API configuration
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

// Cache for available time slots
// Key: doctorId-date, Value: { slots, timestamp }
const availableSlotsCache = new Map();
// Cache expiration time (1 minute)
const SLOTS_CACHE_TTL = 60 * 1000;

// Create OAuth2 client
const createOAuth2Client = () => {
  return new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
};

// Generate authorization URL
export const getAuthUrl = () => {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // Force to get refresh token
  });
};

// Get tokens from authorization code
export const getTokens = async (code) => {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

// Create Google Calendar client with tokens
export const createCalendarClient = (tokens) => {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials(tokens);
  return google.calendar({ version: 'v3', auth: oauth2Client });
};

// Check if tokens are valid and refresh if needed
export const refreshTokensIfNeeded = async (tokens) => {
  if (!tokens) return null;

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials(tokens);

  // Check if access token is expired or will expire soon
  const expiryDate = oauth2Client.credentials.expiry_date;
  const now = Date.now();
  
  // If token is expired or will expire in the next 5 minutes
  if (expiryDate && expiryDate - now < 5 * 60 * 1000) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      return credentials;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      return null;
    }
  }
  
  return tokens;
};

// Get available time slots for a doctor
export const getAvailableTimeSlots = async (doctorCalendarId, date, tokens) => {
  try {
    // Create a cache key using doctorId and date
    const dateStr = new Date(date).toISOString().split('T')[0]; // YYYY-MM-DD format
    const cacheKey = `${doctorCalendarId}-${dateStr}`;
    
    // Check cache first
    const now = Date.now();
    const cachedSlots = availableSlotsCache.get(cacheKey);
    if (cachedSlots && (now - cachedSlots.timestamp < SLOTS_CACHE_TTL)) {
      return cachedSlots.slots;
    }
    
    // If not in cache or expired, proceed with API call
    // Refresh tokens if needed
    const refreshedTokens = await refreshTokensIfNeeded(tokens);
    if (!refreshedTokens) {
      throw new Error('Invalid or expired tokens');
    }
    
    const calendar = createCalendarClient(refreshedTokens);
    
    // Set time boundaries for the day
    const startTime = new Date(date);
    startTime.setHours(0, 0, 0, 0);
    
    const endTime = new Date(date);
    endTime.setHours(23, 59, 59, 999);
    
    // Get busy time slots from the doctor's calendar
    const busyResponse = await calendar.freebusy.query({
      requestBody: {
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        items: [{ id: doctorCalendarId }]
      }
    });
    
    const busySlots = busyResponse.data.calendars[doctorCalendarId].busy;
    
    // Define working hours (9 AM to 5 PM)
    const workingHours = {
      start: 9, // 9 AM
      end: 17   // 5 PM
    };
    
    // Generate all possible time slots (hourly)
    const allTimeSlots = [];
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      
      const slotEnd = new Date(date);
      slotEnd.setHours(hour + 1, 0, 0, 0);
      
      allTimeSlots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString()
      });
    }
    
    // Filter out busy time slots
    const availableTimeSlots = allTimeSlots.filter(slot => {
      const slotStart = new Date(slot.start).getTime();
      const slotEnd = new Date(slot.end).getTime();
      
      // Check if this slot overlaps with any busy slot
      return !busySlots.some(busySlot => {
        const busyStart = new Date(busySlot.start).getTime();
        const busyEnd = new Date(busySlot.end).getTime();
        
        // Check for overlap
        return (slotStart < busyEnd && slotEnd > busyStart);
      });
    });
    
    // Store in cache
    availableSlotsCache.set(cacheKey, {
      slots: availableTimeSlots,
      timestamp: now
    });
    
    return availableTimeSlots;
  } catch (error) {
    console.error('Error getting available time slots:', error);
    throw error;
  }
};

// Create an appointment in Google Calendar
export const createAppointment = async (doctorCalendarId, patientEmail, appointment, tokens) => {
  try {
    // Refresh tokens if needed
    const refreshedTokens = await refreshTokensIfNeeded(tokens);
    if (!refreshedTokens) {
      throw new Error('Invalid or expired tokens');
    }
    
    const calendar = createCalendarClient(refreshedTokens);
    
    // Create event
    const event = {
      summary: `Appointment with ${appointment.patientName}`,
      description: appointment.reason || 'Mental health consultation',
      start: {
        dateTime: appointment.startTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: appointment.endTime,
        timeZone: 'UTC',
      },
      attendees: [
        { email: patientEmail },
        { email: doctorCalendarId }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }       // 1 hour before
        ],
      },
    };
    
    const response = await calendar.events.insert({
      calendarId: doctorCalendarId,
      requestBody: event,
      sendUpdates: 'all', // Send updates to all attendees
    });
    
    return {
      id: response.data.id,
      htmlLink: response.data.htmlLink
    };
  } catch (error) {
    console.error('Error creating appointment in Google Calendar:', error);
    throw error;
  }
};

// Update an appointment in Google Calendar
export const updateAppointment = async (doctorCalendarId, eventId, appointment, tokens) => {
  try {
    // Refresh tokens if needed
    const refreshedTokens = await refreshTokensIfNeeded(tokens);
    if (!refreshedTokens) {
      throw new Error('Invalid or expired tokens');
    }
    
    const calendar = createCalendarClient(refreshedTokens);
    
    // Get existing event
    const existingEvent = await calendar.events.get({
      calendarId: doctorCalendarId,
      eventId: eventId
    });
    
    // Update event
    const updatedEvent = {
      ...existingEvent.data,
      summary: `Appointment with ${appointment.patientName}`,
      description: appointment.reason || 'Mental health consultation',
      start: {
        dateTime: appointment.startTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: appointment.endTime,
        timeZone: 'UTC',
      }
    };
    
    const response = await calendar.events.update({
      calendarId: doctorCalendarId,
      eventId: eventId,
      requestBody: updatedEvent,
      sendUpdates: 'all', // Send updates to all attendees
    });
    
    return {
      id: response.data.id,
      htmlLink: response.data.htmlLink
    };
  } catch (error) {
    console.error('Error updating appointment in Google Calendar:', error);
    throw error;
  }
};

// Cancel an appointment in Google Calendar
export const cancelAppointment = async (doctorCalendarId, eventId, tokens) => {
  try {
    // Refresh tokens if needed
    const refreshedTokens = await refreshTokensIfNeeded(tokens);
    if (!refreshedTokens) {
      throw new Error('Invalid or expired tokens');
    }
    
    const calendar = createCalendarClient(refreshedTokens);
    
    // Delete event
    await calendar.events.delete({
      calendarId: doctorCalendarId,
      eventId: eventId,
      sendUpdates: 'all', // Send updates to all attendees
    });
    
    return true;
  } catch (error) {
    console.error('Error cancelling appointment in Google Calendar:', error);
    throw error;
  }
};