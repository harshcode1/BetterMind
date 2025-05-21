'use client';

import Link from 'next/link';
import { useAuth } from './contexts/AuthContext';

export default function Home() {
  const { user, isDoctor, isAdmin, isVerifiedDoctor } = useAuth();
  
  // Determine the appropriate dashboard link based on user role
  const getDashboardLink = () => {
    if (!user) return '/signup';
    
    if (isAdmin()) return '/admin/dashboard';
    if (isDoctor()) return '/doctor/dashboard'; // All doctors go to doctor dashboard
    return '/dashboard'; // Default for patients
  };
  
  const dashboardLink = getDashboardLink();
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
          Your Mental Health Companion
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-900 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Get support, resources, and connect with professionals to improve your mental well-being.
        </p>
        <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
          {!user ? (
            <div className="rounded-md shadow">
              <Link href="/signup" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10">
                Get Started
              </Link>
            </div>
          ) : (
            <div className="rounded-md shadow">
              <Link href={dashboardLink} className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10">
                {isDoctor() ? 'Go to Doctor Dashboard' : isAdmin() ? 'Go to Admin Dashboard' : 'Go to Dashboard'}
              </Link>
            </div>
          )}
          <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
            <Link href="/resources" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10">
              Explore Resources
            </Link>
          </div>
        </div>
      </section>

      {/* Key Features Section - Only show for non-doctors */}
      {(!user || (user && !isDoctor())) && (
        <section className="mt-16">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">Key Features</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              title="Mood Tracking"
              description="Record your daily mood and activities to identify patterns and triggers."
              link="/mood"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <FeatureCard
              title="Mental Health Assessments"
              description="Take standardized assessments for depression and anxiety to monitor your mental health."
              link="/assessment"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
            <FeatureCard
              title="Chat Support"
              description="Get immediate responses to your mental health questions through our guided chat system."
              link="/chat"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              }
            />
            <FeatureCard
              title="Professional Help"
              description="Connect with licensed therapists and counselors for personalized support."
              link="/appointments/new"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />
          </div>
        </section>
      )}
      
      {/* Doctor Features Section - Show for all doctors */}
      {user && isDoctor() && (
        <section className="mt-16">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">Doctor Dashboard</h2>
          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow p-6">
            <div className="flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 text-center">Welcome, {user.name}</h3>
            <p className="mt-2 text-gray-600 text-center">
              Access your doctor dashboard to manage appointments, view patient information, and update your profile.
            </p>
            <div className="mt-6 text-center">
              <Link 
                href="/doctor/dashboard" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Go to Doctor Dashboard
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Dashboard Preview Section (for logged-in patients) */}
      {user && !isDoctor() && !isAdmin() && (
        <section className="mt-16 bg-gray-50 rounded-lg p-8">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">Your Mental Health Dashboard</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-xl font-semibold mb-4">Track Your Progress</h3>
              <p className="text-gray-600 mb-6">
                View your mood trends, assessment results, and identify patterns in your mental health journey.
              </p>
              <Link 
                href={dashboardLink}
                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Go to Dashboard
              </Link>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="h-48 bg-gray-100 rounded flex items-center justify-center">
                <p className="text-gray-500">Dashboard Preview</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Services Section */}
      <section className="mt-16">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">Our Services</h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <ServiceCard
            title="Resource Library"
            description="Access a curated collection of articles, videos, and tools to support your mental wellbeing."
            link="/resources"
          />
          <ServiceCard
            title="Find a Doctor"
            description="Browse our network of licensed therapists, counselors, and psychiatrists."
            link="/doctors"
          />
          <ServiceCard
            title="Crisis Support"
            description="If you're in crisis, please reach out to these emergency resources immediately."
            link="/resources#crisis"
            isEmergency={true}
          />
        </div>
      </section>
    </div>
  );
}

function ServiceCard({ title, description, link, isEmergency }) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
        <div className="mt-4">
          <Link 
            href={link} 
            className={`text-sm font-medium ${isEmergency ? 'text-red-600 hover:text-red-500' : 'text-blue-600 hover:text-blue-500'} flex items-center`}
          >
            {isEmergency ? 'Get help now' : 'Learn more'} 
            <span aria-hidden="true" className="ml-1">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description, link, icon }) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
      <div className="px-4 py-5 sm:p-6">
        <div className="text-blue-500 mb-3">
          {icon}
        </div>
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
        <div className="mt-4">
          <Link 
            href={link} 
            className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center"
          >
            Get started
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}