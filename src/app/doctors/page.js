'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/doctors');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // Only fetch doctors if user is authenticated
    if (user) {
      const fetchDoctors = async () => {
        try {
          setLoading(true);
          // Add specialty filter to API call if selected
          const url = selectedSpecialty 
            ? `/api/doctors?specialty=${encodeURIComponent(selectedSpecialty)}` 
            : '/api/doctors';
          
          const res = await fetch(url);
          const data = await res.json();
          
          if (res.ok && data.doctors) {
            setDoctors(data.doctors);
            
            // Extract unique specialties for the filter
            if (!selectedSpecialty) {
              const uniqueSpecialties = [...new Set(data.doctors.map(doctor => doctor.specialty))];
              setSpecialties(uniqueSpecialties);
            }
          }
        } catch (error) {
          console.error('Error fetching doctors:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchDoctors();
    }
  }, [user, selectedSpecialty]);

  // Handle specialty filter change
  const handleSpecialtyChange = (specialty) => {
    setSelectedSpecialty(specialty);
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Don't render if user is not authenticated (they will be redirected)
  if (!user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-black text-center mb-8">Mental Health Professionals</h1>
      
      {/* Specialty Filter */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-700 mb-3">Filter by Specialty</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSpecialtyChange('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedSpecialty === '' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Specialties
          </button>
          
          {specialties.map((specialty) => (
            <button
              key={specialty}
              onClick={() => handleSpecialtyChange(specialty)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedSpecialty === specialty 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {specialty}
            </button>
          ))}
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : doctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <div key={doctor.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{doctor.name}</h3>
                <p className="text-sm font-medium text-blue-600 mb-1">{doctor.specialty}</p>
                <p className="text-gray-500 mb-4">{doctor.description}</p>
                <button 
                  onClick={() => router.push(`/appointments/new?doctorId=${doctor.id}`)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-all"
                >
                  Book Appointment
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600">
            {selectedSpecialty 
              ? `No doctors found with specialty: ${selectedSpecialty}` 
              : 'No doctors are currently available.'}
          </p>
        </div>
      )}
    </div>
  );
}