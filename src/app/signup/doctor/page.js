'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

export default function DoctorSignupPage() {
  // Basic user information
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Doctor-specific information
  const [specialty, setSpecialty] = useState('');
  const [credentials, setCredentials] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [bio, setBio] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  
  // Form state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Basic info, 2: Professional info
  
  const router = useRouter();
  const { registerDoctor, user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  // List of medical specialties
  const specialties = [
    'Psychiatrist',
    'Psychologist',
    'Therapist',
    'Counselor',
    'Clinical Social Worker',
    'Mental Health Nurse',
    'Addiction Specialist',
    'Child Psychiatrist',
    'Geriatric Psychiatrist',
    'Neuropsychiatrist'
  ];

  const validateStep1 = () => {
    if (!name.trim()) {
      setError('Name is required');
      return false;
    }
    
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const validateStep2 = () => {
    if (!specialty) {
      setError('Specialty is required');
      return false;
    }
    
    if (!credentials.trim()) {
      setError('Credentials are required');
      return false;
    }
    
    if (!licenseNumber.trim()) {
      setError('License number is required');
      return false;
    }
    
    if (!phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    
    return true;
  };

  const handleNextStep = () => {
    setError('');
    
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setError('');
    setStep(1);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateStep2()) {
      return;
    }
    
    setLoading(true);

    try {
      await registerDoctor({
        name,
        email,
        password,
        specialty,
        credentials,
        licenseNumber,
        bio,
        address,
        phone
      });
      
      router.push('/doctor/verification'); // Redirect to verification page
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  // If already logged in, show nothing during redirect
  if (user) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 py-8">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-center mb-6">Doctor Registration</h2>
        
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex flex-col items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="mt-2">Account Information</span>
            </div>
            <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex flex-col items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="mt-2">Professional Details</span>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 p-4 rounded-md mb-4">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSignup}>
          {step === 1 ? (
            // Step 1: Basic Information
            <div>
              <div className="mb-4">
                <label className="block text-gray-700">Full Name</label>
                <input 
                  type="text"
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  required
                  placeholder="Dr. John Doe"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Email</label>
                <input 
                  type="email"
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  placeholder="doctor@example.com"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Password</label>
                <input 
                  type="password"
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700">Confirm Password</label>
                <input 
                  type="password"
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                  placeholder="Re-enter your password"
                />
              </div>
              <button 
                type="button"
                onClick={handleNextStep}
                disabled={loading}
                className={`w-full py-2 rounded-lg transition-all ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}>
                Next: Professional Details
              </button>
            </div>
          ) : (
            // Step 2: Professional Information
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700">Specialty</label>
                  <select
                    className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    disabled={loading}
                    required
                  >
                    <option value="">Select your specialty</option>
                    {specialties.map((spec) => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700">Credentials</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={credentials}
                    onChange={(e) => setCredentials(e.target.value)}
                    disabled={loading}
                    required
                    placeholder="MD, PhD, etc."
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700">License Number</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    disabled={loading}
                    required
                    placeholder="Your medical license number"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700">Phone Number</label>
                  <input 
                    type="tel"
                    className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                    required
                    placeholder="(123) 456-7890"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Practice Address</label>
                <input 
                  type="text"
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={loading}
                  placeholder="123 Medical Center Dr, City, State, ZIP"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700">Professional Bio</label>
                <textarea 
                  className="w-full px-4 py-2 mt-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={loading}
                  rows="4"
                  placeholder="Tell patients about your experience, approach, and specializations..."
                ></textarea>
              </div>
              <div className="flex space-x-4">
                <button 
                  type="button"
                  onClick={handlePrevStep}
                  disabled={loading}
                  className="w-1/3 py-2 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 transition-all">
                  Back
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className={`w-2/3 py-2 rounded-lg transition-all ${
                    loading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}>
                  {loading ? 'Submitting...' : 'Complete Registration'}
                </button>
              </div>
            </div>
          )}
        </form>
        
        <div className="mt-6 border-t pt-4">
          <p className="text-center text-sm text-gray-600">
            Already have an account? <Link href="/login" className="text-blue-600 hover:underline">Login</Link>
          </p>
          <p className="text-center text-sm text-gray-600 mt-2">
            Registering as a patient? <Link href="/signup" className="text-blue-600 hover:underline">Patient Signup</Link>
          </p>
        </div>
        
        <div className="mt-6 bg-blue-50 p-4 rounded-md">
          <h3 className="text-sm font-semibold text-blue-800">Important Information</h3>
          <p className="text-xs text-blue-700 mt-1">
            After registration, your account will need to be verified by our team before you can start accepting appointments. 
            This typically takes 1-3 business days. You'll receive an email notification once your account is approved.
          </p>
        </div>
      </div>
    </div>
  );
}