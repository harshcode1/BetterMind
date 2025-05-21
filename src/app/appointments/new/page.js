'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';

export default function NewAppointment() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const doctorId = searchParams.get('doctorId');

  const [doctor, setDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [useGoogleCalendar, setUseGoogleCalendar] = useState(true);

  // Check if user is authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Check if Google Calendar is connected
  useEffect(() => {
    if (user) {
      fetch('/api/auth/google/status')
        .then(res => res.json())
        .then(data => {
          setGoogleConnected(data.connected);
        })
        .catch(err => {
          console.error('Failed to check Google Calendar connection:', err);
          setGoogleConnected(false);
        });
    }
  }, [user]);

  // Fetch doctor information
  useEffect(() => {
    if (doctorId && user) {
      setLoading(true);
      fetch(`/api/doctors/${doctorId}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setError(data.error);
          } else {
            setDoctor(data);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch doctor:', err);
          setError('Failed to fetch doctor information. Please try again.');
          setLoading(false);
        });
    }
  }, [doctorId, user]);

  // Fetch available time slots when date changes
  useEffect(() => {
    if (doctorId && selectedDate && user) {
      setLoading(true);
      fetch(`/api/doctors/${doctorId}?date=${selectedDate}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setError(data.error);
            setAvailableSlots([]);
          } else {
            setAvailableSlots(data.availableSlots || []);
            if (data.availabilityError) {
              setError(data.availabilityError);
            } else {
              setError('');
            }
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch available slots:', err);
          setError('Failed to fetch available time slots. Please try again.');
          setAvailableSlots([]);
          setLoading(false);
        });
    }
  }, [doctorId, selectedDate, user]);

  // Handle date change
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedTime(''); // Reset time when date changes
  };

  // Handle time change
  const handleTimeChange = (e) => {
    setSelectedTime(e.target.value);
  };

  // Handle notes change
  const handleNotesChange = (e) => {
    setNotes(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      setError('Please select both date and time.');
      return;
    }
    
    setError('');
    setSubmitting(true);
    
    // Combine date and time
    const dateTime = new Date(`${selectedDate}T${selectedTime}`);
    
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorId,
          dateTime: dateTime.toISOString(),
          notes,
          useGoogleCalendar: googleConnected && useGoogleCalendar
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to book appointment');
      }
      
      setSuccess(true);
      
      // Redirect to appointments page after a short delay
      setTimeout(() => {
        router.push('/appointments');
      }, 2000);
    } catch (err) {
      console.error('Failed to book appointment:', err);
      setError(err.message || 'Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Format time for display
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get tomorrow's date for min date attribute
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (authLoading || (loading && !doctor)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Book an Appointment</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error && !doctor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Book an Appointment</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
        <Link href="/doctors" className="text-blue-500 hover:underline">
          &larr; Back to Doctors
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Appointment Booked</h1>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p>Your appointment has been successfully booked!</p>
        </div>
        <p>Redirecting to appointments page...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Book an Appointment</h1>
      
      {!googleConnected && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Google Calendar Not Connected</p>
          <p>Connect your Google Calendar to sync appointments and get real-time availability.</p>
          <a 
            href={`/api/auth/google?redirect=/appointments/new?doctorId=${doctorId}`}
            className="mt-2 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Connect Google Calendar
          </a>
        </div>
      )}
      
      {googleConnected && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Google Calendar Connected</p>
          <p className="mb-2">Choose how you would like to book your appointment:</p>
          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="bookingMethod"
                checked={useGoogleCalendar}
                onChange={() => setUseGoogleCalendar(true)}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2">Book with Google Calendar</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="bookingMethod"
                checked={!useGoogleCalendar}
                onChange={() => setUseGoogleCalendar(false)}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2">Book directly</span>
            </label>
          </div>
        </div>
      )}
      
      {doctor && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">{doctor.name}</h2>
          <p className="text-gray-600 mb-2">Specialty: {doctor.specialty}</p>
          <p className="mb-4">{doctor.description}</p>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="date">
                Select Date
              </label>
              <input
                type="date"
                id="date"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                min={getTomorrowDate()}
                value={selectedDate}
                onChange={handleDateChange}
                required
              />
            </div>
            
            {selectedDate && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="time">
                  Select Time
                </label>
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                    <span>Loading available times...</span>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot) => (
                      <label
                        key={slot}
                        className={`
                          border rounded p-2 text-center cursor-pointer
                          ${selectedTime === new Date(slot).toTimeString().slice(0, 5) 
                            ? 'bg-blue-500 text-white' 
                            : 'hover:bg-gray-100'}
                        `}
                      >
                        <input
                          type="radio"
                          name="time"
                          value={new Date(slot).toTimeString().slice(0, 5)}
                          checked={selectedTime === new Date(slot).toTimeString().slice(0, 5)}
                          onChange={handleTimeChange}
                          className="sr-only"
                        />
                        {formatTime(slot)}
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-red-500">No available time slots for this date.</p>
                )}
              </div>
            )}
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="notes">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                rows="3"
                placeholder="Any specific concerns or information for the doctor..."
                value={notes}
                onChange={handleNotesChange}
              ></textarea>
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p>{error}</p>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                  submitting || !selectedDate || !selectedTime ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={submitting || !selectedDate || !selectedTime}
              >
                {submitting ? 'Booking...' : googleConnected && useGoogleCalendar ? 'Book with Google Calendar' : 'Book Appointment'}
              </button>
              <Link href="/doctors" className="text-blue-500 hover:underline">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}