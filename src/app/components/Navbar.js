'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout, loading, isDoctor, isAdmin, isPatient } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = async (e) => {
    e.preventDefault();
    await logout();
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    setProfileMenuOpen(false);
  };

  const toggleProfileMenu = () => {
    setProfileMenuOpen(!profileMenuOpen);
    setMobileMenuOpen(false);
  };

  // Common links for all authenticated users
  const commonLinks = [
    { href: '/', label: 'Home' },
    { href: '/resources', label: 'Resources' },
  ];

  // Patient-specific links
  const patientLinks = [
    { href: '/mood', label: 'Mood Tracker' },
    { href: '/assessment', label: 'Assessments' },
    { href: '/chat', label: 'Chat Support' },
    { href: '/doctors', label: 'Find Doctors' },
    { href: '/appointments', label: 'Appointments' },
    { href: '/dashboard', label: 'Dashboard' },
  ];

  // Doctor-specific links
  const doctorLinks = [
    { href: '/doctor/dashboard', label: 'Doctor Dashboard' },
  ];

  // Admin-specific links
  const adminLinks = [
    { href: '/admin/dashboard', label: 'Admin Dashboard' },
    { href: '/admin/doctors', label: 'Manage Doctors' },
    { href: '/admin/users', label: 'Manage Users' },
  ];

  // Determine which links to show based on user role
  const getNavLinks = () => {
    if (!user) return commonLinks;
    
    let links = [...commonLinks];
    
    if (isAdmin()) {
      links = [...links, ...adminLinks];
    } else if (isDoctor()) {
      // All doctors see the same links, regardless of verification status
      links = [...links, ...doctorLinks];
    } else if (isPatient()) {
      links = [...links, ...patientLinks];
    }
    
    return links;
  };

  const navLinks = getNavLinks();

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/">
              <Image src="/images/logo.png" alt="Logo" width={40} height={40} />
            </Link>
            <span className="ml-2 text-xl font-semibold text-gray-800">BetterMind</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                {link.label}
              </Link>
            ))}
            
            {!loading && (
              <>
                {user ? (
                  <div className="relative ml-4">
                    <button
                      onClick={toggleProfileMenu}
                      className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
                    >
                      <span className="mr-2">{user.name}</span>
                      <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                        {user.name.charAt(0)}
                      </div>
                      <svg className="ml-1 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Profile Dropdown */}
                    {profileMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex ml-4">
                    <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 mr-2 transition-all">
                      Login
                    </Link>
                    <div className="relative group">
                      <Link href="/signup" className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 transition-all">
                        Sign Up
                      </Link>
                      <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                        <Link 
                          href="/signup" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Patient Sign Up
                        </Link>
                        <Link 
                          href="/signup/doctor" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Healthcare Provider Sign Up
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              <svg 
                className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`} 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg 
                className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`} 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
        
        {user && (
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-5">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                {user.name.charAt(0)}
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user.name}</div>
                <div className="text-sm font-medium text-gray-500">{user.email}</div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
        )}
        
        {!user && !loading && (
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex flex-col space-y-2 px-5">
              <Link 
                href="/login" 
                className="w-full text-center bg-blue-600 text-white px-4 py-2 rounded-md text-base font-medium hover:bg-blue-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
              <Link 
                href="/signup" 
                className="w-full text-center bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-base font-medium hover:bg-gray-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                Patient Sign Up
              </Link>
              <Link 
                href="/signup/doctor" 
                className="w-full text-center bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-base font-medium hover:bg-gray-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                Healthcare Provider Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;