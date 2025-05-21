'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

export default function AssessmentHistoryPage() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/assessment/history');
    }
  }, [user, authLoading, router]);

  // Fetch assessment history
  useEffect(() => {
    if (user) {
      fetchAssessmentHistory();
    }
  }, [user]);

  const fetchAssessmentHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/assessment');
      if (res.ok) {
        const data = await res.json();
        setAssessments(data.assessments || []);
      } else {
        setError('Failed to load assessment history');
      }
    } catch (error) {
      console.error('Error fetching assessment history:', error);
      setError('An error occurred while fetching your assessment history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Minimal or none':
        return 'bg-green-100 text-green-800';
      case 'Mild':
        return 'bg-yellow-100 text-yellow-800';
      case 'Moderate':
        return 'bg-orange-100 text-orange-800';
      case 'Moderately severe':
        return 'bg-red-100 text-red-800';
      case 'Severe':
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-black">Assessment History</h1>
        <button 
          onClick={() => router.push('/assessment')}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-all"
        >
          Take New Assessment
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      ) : assessments.length > 0 ? (
        <>
          {/* Assessment Trend Visualization */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Mental Health Trends</h2>
              <div className="h-64">
                <AssessmentChart assessments={assessments} />
              </div>
            </div>
          </div>
          
          {/* Assessment History List */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">Past Assessments</h3>
              <p className="mt-1 text-sm text-gray-500">View your assessment history and track your progress over time.</p>
            </div>
            <ul className="divide-y divide-gray-200">
              {assessments.map((assessment) => (
                <li key={assessment.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatDate(assessment.date)}</p>
                      <div className="mt-2 flex space-x-4">
                        <div>
                          <p className="text-xs text-gray-500">Depression (PHQ-9)</p>
                          <div className="flex items-center">
                            <span className="text-lg font-semibold text-blue-600">{assessment.phq9Score}</span>
                            <span className="ml-2 text-xs px-2 py-1 rounded-full whitespace-nowrap ${getSeverityColor(assessment.depressionSeverity)}">
                              {assessment.depressionSeverity}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Anxiety (GAD-7)</p>
                          <div className="flex items-center">
                            <span className="text-lg font-semibold text-purple-600">{assessment.gad7Score}</span>
                            <span className="ml-2 text-xs px-2 py-1 rounded-full whitespace-nowrap ${getSeverityColor(assessment.anxietySeverity)}">
                              {assessment.anxietySeverity}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/assessment/details/${assessment.id}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">You haven't taken any assessments yet.</p>
          <button 
            onClick={() => router.push('/assessment')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-all"
          >
            Take Your First Assessment
          </button>
        </div>
      )}
    </div>
  );
}

// Assessment Chart Component
const AssessmentChart = ({ assessments }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!assessments || assessments.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Sort data by date
    const sortedData = [...assessments].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate x and y scales
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    const xScale = chartWidth / (sortedData.length > 1 ? sortedData.length - 1 : 1);
    const yScale = chartHeight / 27; // PHQ-9 max score is 27
    
    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = '#e5e7eb'; // Light gray
    ctx.lineWidth = 1;
    
    // Y-axis
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    
    // X-axis
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    
    // Y-axis ticks and labels
    for (let i = 0; i <= 27; i += 9) {
      const y = height - padding - i * yScale;
      ctx.moveTo(padding - 5, y);
      ctx.lineTo(padding, y);
      
      ctx.font = '10px Arial';
      ctx.fillStyle = '#6b7280'; // Gray
      ctx.textAlign = 'right';
      ctx.fillText(i, padding - 10, y + 3);
    }
    
    ctx.stroke();

    // Draw PHQ-9 data points and line
    if (sortedData.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6'; // Blue
      ctx.lineWidth = 2;
      
      // Move to first point
      const firstX = padding;
      const firstY = height - padding - sortedData[0].phq9Score * yScale;
      ctx.moveTo(firstX, firstY);
      
      // Draw lines to each point
      sortedData.forEach((data, index) => {
        if (index === 0) return; // Skip first point as we've already moved to it
        
        const x = padding + index * xScale;
        const y = height - padding - data.phq9Score * yScale;
        ctx.lineTo(x, y);
      });
      
      ctx.stroke();
      
      // Draw points
      sortedData.forEach((data, index) => {
        const x = padding + index * xScale;
        const y = height - padding - data.phq9Score * yScale;
        
        ctx.beginPath();
        ctx.fillStyle = '#3b82f6'; // Blue
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Draw GAD-7 data points and line
    if (sortedData.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#8b5cf6'; // Purple
      ctx.lineWidth = 2;
      
      // Move to first point
      const firstX = padding;
      const firstY = height - padding - sortedData[0].gad7Score * yScale;
      ctx.moveTo(firstX, firstY);
      
      // Draw lines to each point
      sortedData.forEach((data, index) => {
        if (index === 0) return; // Skip first point as we've already moved to it
        
        const x = padding + index * xScale;
        const y = height - padding - data.gad7Score * yScale;
        ctx.lineTo(x, y);
      });
      
      ctx.stroke();
      
      // Draw points
      sortedData.forEach((data, index) => {
        const x = padding + index * xScale;
        const y = height - padding - data.gad7Score * yScale;
        
        ctx.beginPath();
        ctx.fillStyle = '#8b5cf6'; // Purple
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Add legend
    ctx.font = '12px Arial';
    
    // PHQ-9 legend
    ctx.fillStyle = '#3b82f6'; // Blue
    ctx.fillRect(width - padding - 100, padding, 12, 12);
    ctx.fillStyle = '#111827'; // Dark gray
    ctx.textAlign = 'left';
    ctx.fillText('Depression (PHQ-9)', width - padding - 80, padding + 10);
    
    // GAD-7 legend
    ctx.fillStyle = '#8b5cf6'; // Purple
    ctx.fillRect(width - padding - 100, padding + 20, 12, 12);
    ctx.fillStyle = '#111827'; // Dark gray
    ctx.textAlign = 'left';
    ctx.fillText('Anxiety (GAD-7)', width - padding - 80, padding + 30);

  }, [assessments]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      {assessments && assessments.length > 0 ? (
        <canvas 
          ref={canvasRef} 
          width={600} 
          height={300}
          className="w-full h-full"
        />
      ) : (
        <div className="text-gray-500">No assessment data available</div>
      )}
    </div>
  );
};