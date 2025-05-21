'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';

export default function Appointments() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);

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

  // Fetch appointments
  useEffect(() => {
    if (user) {
      setLoading(true);
      fetch('/api/appointments')
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setError(data.error);
          } else {
            setAppointments(data);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch appointments:', err);
          setError('Failed to fetch appointments. Please try again.');
          setLoading(false);
        });
    }
  }, [user]);

  // Handle appointment cancellation
  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      setCancellingId(id);
      
      try {
        const response = await fetch(`/api/appointments/${id}`, {
          method: 'DELETE',
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to cancel appointment');
        }
        
        // Update the appointment status in the local state
        setAppointments(appointments.map(appointment => 
          appointment._id === id 
            ? { ...appointment, status: 'cancelled' } 
            : appointment
        ));
      } catch (err) {
        console.error('Failed to cancel appointment:', err);
        setError(err.message || 'Failed to cancel appointment. Please try again.');
      } finally {
        setCancellingId(null);
      }
    }
  };

  // Handle Google Calendar sync
  const handleSync = async () => {
    if (!googleConnected) {
      router.push('/api/auth/google?redirect=/appointments');
      return;
    }
    
    setSyncing(true);
    
    try {
      const response = await fetch('/api/appointments/sync', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync appointments');
      }
      
      // Refresh appointments
      const appointmentsResponse = await fetch('/api/appointments');
      const appointmentsData = await appointmentsResponse.json();
      
      if (appointmentsResponse.ok) {
        setAppointments(appointmentsData);
      }
      
      alert('Appointments synced successfully!');
    } catch (err) {
      console.error('Failed to sync appointments:', err);
      setError(err.message || 'Failed to sync appointments. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  // Format date for display
  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Format time for display
  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || (loading && appointments.length === 0)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">My Appointments</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Appointments</h1>
        <div className="flex space-x-4">
          <button
            onClick={handleSync}
            className={`flex items-center px-4 py-2 rounded ${
              googleConnected 
                ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
            disabled={syncing}
          >
            {syncing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Syncing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                {googleConnected ? 'Sync with Google Calendar' : 'Connect Google Calendar'}
              </>
            )}
          </button>
          
          <Link 
            href="/doctors" 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Book New Appointment
          </Link>
        </div>
      </div>
      
      {!googleConnected && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Google Calendar Not Connected</p>
          <p>Connect your Google Calendar to sync appointments and get real-time availability.</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {appointments.length > 0 ? (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.map((appointment) => (
                <tr key={appointment._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{appointment.doctorName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{appointment.specialty}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(appointment.dateTime)}</div>
                    <div className="text-sm text-gray-500">{formatTime(appointment.dateTime)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      {appointment.googleEventId && (
                        <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {appointment.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCancel(appointment._id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={cancellingId === appointment._id}
                      >
                        {cancellingId === appointment._id ? (
                          <span className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-600 mr-1"></div>
                            Cancelling...
                          </span>
                        ) : (
                          'Cancel'
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <p className="text-gray-500 mb-4">You don't have any appointments scheduled.</p>
          <Link 
            href="/doctors" 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Book Your First Appointment
          </Link>
        </div>
      )}
    </div>
  );
}