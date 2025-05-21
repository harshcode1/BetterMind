'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('pending');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Redirect if not authenticated or not an admin
  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (!isAdmin()) {
      router.push('/');
    }
  }, [user, isAdmin, router]);
  
  // Fetch doctors based on active tab
  useEffect(() => {
    if (!user || !isAdmin()) return;
    
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/doctors?status=${activeTab}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch doctors');
        }
        
        const data = await response.json();
        setDoctors(data.doctors || []);
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setError('Failed to load doctors. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDoctors();
  }, [activeTab, user, isAdmin]);
  
  const handleViewDetails = (doctor) => {
    setSelectedDoctor(doctor);
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDoctor(null);
    setRejectionReason('');
  };
  
  const handleApprove = async (doctorId) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/doctors/${doctorId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verified: true }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve doctor');
      }
      
      // Update the local state to remove the approved doctor from the list
      setDoctors(doctors.filter(doctor => doctor._id !== doctorId));
      handleCloseModal();
    } catch (err) {
      console.error('Error approving doctor:', err);
      setError('Failed to approve doctor. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleReject = async (doctorId) => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/doctors/${doctorId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          verified: false, 
          rejected: true,
          rejectionReason 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject doctor');
      }
      
      // Update the local state to remove the rejected doctor from the list
      setDoctors(doctors.filter(doctor => doctor._id !== doctorId));
      handleCloseModal();
    } catch (err) {
      console.error('Error rejecting doctor:', err);
      setError('Failed to reject doctor. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };
  
  if (!user || !isAdmin()) {
    return null; // Don't render anything while redirecting
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 ${activeTab === 'pending' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Verification
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'verified' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('verified')}
        >
          Verified Doctors
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'rejected' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('rejected')}
        >
          Rejected Applications
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button 
            className="float-right"
            onClick={() => setError(null)}
          >
            &times;
          </button>
        </div>
      )}
      
      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Doctors list */}
          {doctors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {activeTab === 'pending' 
                  ? 'No pending doctor verifications' 
                  : activeTab === 'verified' 
                    ? 'No verified doctors' 
                    : 'No rejected applications'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-3 px-4 text-left">Name</th>
                    <th className="py-3 px-4 text-left">Email</th>
                    <th className="py-3 px-4 text-left">Specialty</th>
                    <th className="py-3 px-4 text-left">License</th>
                    <th className="py-3 px-4 text-left">Submitted</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doctor) => (
                    <tr key={doctor._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{doctor.name}</td>
                      <td className="py-3 px-4">{doctor.email}</td>
                      <td className="py-3 px-4">{doctor.specialty}</td>
                      <td className="py-3 px-4">{doctor.licenseNumber}</td>
                      <td className="py-3 px-4">
                        {new Date(doctor.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded mr-2"
                          onClick={() => handleViewDetails(doctor)}
                        >
                          View Details
                        </button>
                        
                        {activeTab === 'pending' && (
                          <button
                            className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded"
                            onClick={() => handleApprove(doctor._id)}
                          >
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      
      {/* Doctor details modal */}
      {showModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Doctor Details</h2>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={handleCloseModal}
                >
                  &times;
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-700">Personal Information</h3>
                  <p><span className="font-medium">Name:</span> {selectedDoctor.name}</p>
                  <p><span className="font-medium">Email:</span> {selectedDoctor.email}</p>
                  <p><span className="font-medium">Phone:</span> {selectedDoctor.phone || 'Not provided'}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700">Professional Information</h3>
                  <p><span className="font-medium">Specialty:</span> {selectedDoctor.specialty}</p>
                  <p><span className="font-medium">License Number:</span> {selectedDoctor.licenseNumber}</p>
                  <p><span className="font-medium">Credentials:</span> {selectedDoctor.credentials || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700">Practice Address</h3>
                <p>{selectedDoctor.address || 'Not provided'}</p>
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700">Professional Bio</h3>
                <p className="whitespace-pre-line">{selectedDoctor.bio || 'Not provided'}</p>
              </div>
              
              {activeTab === 'pending' && (
                <div className="border-t pt-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-gray-700 mb-2">
                        Rejection Reason (required if rejecting):
                      </label>
                      <textarea
                        className="w-full border rounded p-2"
                        rows="3"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Provide a reason for rejection..."
                      ></textarea>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
                      onClick={handleCloseModal}
                      disabled={actionLoading}
                    >
                      Cancel
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
                      onClick={() => handleReject(selectedDoctor._id)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing...' : 'Reject'}
                    </button>
                    <button
                      className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
                      onClick={() => handleApprove(selectedDoctor._id)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing...' : 'Approve'}
                    </button>
                  </div>
                </div>
              )}
              
              {activeTab === 'rejected' && selectedDoctor.rejectionReason && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-700">Rejection Reason</h3>
                  <p className="whitespace-pre-line">{selectedDoctor.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}