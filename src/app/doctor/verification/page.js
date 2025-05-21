'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function DoctorVerificationPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect all doctors to dashboard, regardless of verification status
  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (user.role === 'doctor') {
      // Redirect all doctors to dashboard, regardless of verification status
      router.push('/doctor/dashboard');
    } else {
      router.push('/');
    }
  }, [user, router]);

  // Show nothing during redirect
  return null;
}