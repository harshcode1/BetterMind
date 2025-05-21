'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';

// Chart components will be created separately
import MoodTrendsChart from './MoodTrendsChart';
import AssessmentTrendsChart from './AssessmentTrendsChart';
import CorrelationChart from './CorrelationChart';
import ActivityImpactChart from './ActivityImpactChart';
import MilestoneTracker from './MilestoneTracker';

export default function DashboardPage() {
  const [moodData, setMoodData] = useState([]);
  const [assessmentData, setAssessmentData] = useState([]);
  const [timeframe, setTimeframe] = useState('30'); // Default to 30 days
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  const { user, loading: authLoading, isDoctor, isAdmin, isVerifiedDoctor } = useAuth();
  const router = useRouter();
  
  // Redirect based on user role
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login?redirect=/dashboard');
      } else if (isAdmin()) {
        router.push('/admin/dashboard');
      } else if (isVerifiedDoctor()) {
        router.push('/doctor/dashboard');
      } else if (isDoctor() && !user.verified) {
        router.push('/doctor/verification');
      }
    }
  }, [user, authLoading, router, isAdmin, isDoctor, isVerifiedDoctor]);

  // Fetch data when component mounts or timeframe changes
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, timeframe]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Fetch mood data
      const moodRes = await fetch(`/api/mood?days=${timeframe}`);
      if (!moodRes.ok) throw new Error('Failed to load mood data');
      const moodJson = await moodRes.json();
      
      // Fetch assessment data
      const assessmentRes = await fetch(`/api/assessment?limit=50`);
      if (!assessmentRes.ok) throw new Error('Failed to load assessment data');
      const assessmentJson = await assessmentRes.json();
      
      // Filter assessment data by timeframe
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeframe));
      
      const filteredAssessments = assessmentJson.assessments.filter(assessment => {
        const assessmentDate = new Date(assessment.date);
        return assessmentDate >= startDate;
      });
      
      setMoodData(moodJson.moods || []);
      setAssessmentData(filteredAssessments || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('An error occurred while fetching your data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics and insights
  const calculateStatistics = () => {
    if (!moodData.length || !assessmentData.length) {
      return {
        avgMood: 0,
        moodChange: 0,
        avgPhq9: 0,
        avgGad7: 0,
        phq9Change: 0,
        gad7Change: 0,
        topActivities: [],
        insights: []
      };
    }
    
    // Calculate average mood
    const avgMood = moodData.reduce((sum, entry) => sum + entry.mood, 0) / moodData.length;
    
    // Calculate mood change (current week vs previous week)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const currentWeekMoods = moodData.filter(entry => new Date(entry.createdAt) >= oneWeekAgo);
    const previousWeekMoods = moodData.filter(entry => {
      const date = new Date(entry.createdAt);
      return date >= twoWeeksAgo && date < oneWeekAgo;
    });
    
    const currentWeekAvg = currentWeekMoods.length 
      ? currentWeekMoods.reduce((sum, entry) => sum + entry.mood, 0) / currentWeekMoods.length 
      : 0;
    const previousWeekAvg = previousWeekMoods.length 
      ? previousWeekMoods.reduce((sum, entry) => sum + entry.mood, 0) / previousWeekMoods.length 
      : 0;
    
    const moodChange = previousWeekAvg ? ((currentWeekAvg - previousWeekAvg) / previousWeekAvg) * 100 : 0;
    
    // Calculate average PHQ-9 and GAD-7 scores
    const avgPhq9 = assessmentData.reduce((sum, entry) => sum + entry.phq9Score, 0) / assessmentData.length;
    const avgGad7 = assessmentData.reduce((sum, entry) => sum + entry.gad7Score, 0) / assessmentData.length;
    
    // Calculate PHQ-9 and GAD-7 changes
    const latestAssessment = assessmentData[assessmentData.length - 1];
    const previousAssessment = assessmentData.length > 1 ? assessmentData[assessmentData.length - 2] : null;
    
    const phq9Change = previousAssessment 
      ? ((latestAssessment.phq9Score - previousAssessment.phq9Score) / previousAssessment.phq9Score) * 100 
      : 0;
    const gad7Change = previousAssessment 
      ? ((latestAssessment.gad7Score - previousAssessment.gad7Score) / previousAssessment.gad7Score) * 100 
      : 0;
    
    // Find top activities
    const activityCounts = {};
    moodData.forEach(entry => {
      if (entry.activities && entry.activities.length) {
        entry.activities.forEach(activity => {
          activityCounts[activity] = (activityCounts[activity] || 0) + 1;
        });
      }
    });
    
    const topActivities = Object.entries(activityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([activity, count]) => ({ activity, count }));
    
    // Generate insights
    const insights = [];
    
    // Mood trends
    if (moodChange > 10) {
      insights.push('Your mood has improved significantly in the past week.');
    } else if (moodChange < -10) {
      insights.push('Your mood has declined in the past week. Consider reviewing your self-care routine.');
    }
    
    // Assessment trends
    if (phq9Change < -10) {
      insights.push('Your depression symptoms have improved since your last assessment.');
    } else if (phq9Change > 10) {
      insights.push('Your depression symptoms have increased since your last assessment.');
    }
    
    if (gad7Change < -10) {
      insights.push('Your anxiety symptoms have improved since your last assessment.');
    } else if (gad7Change > 10) {
      insights.push('Your anxiety symptoms have increased since your last assessment.');
    }
    
    // Activity correlations
    const highMoodActivities = [];
    const lowMoodActivities = [];
    
    Object.keys(activityCounts).forEach(activity => {
      const entriesWithActivity = moodData.filter(entry => 
        entry.activities && entry.activities.includes(activity)
      );
      
      if (entriesWithActivity.length >= 3) {
        const avgMoodWithActivity = entriesWithActivity.reduce((sum, entry) => sum + entry.mood, 0) / entriesWithActivity.length;
        
        if (avgMoodWithActivity > avgMood + 1) {
          highMoodActivities.push(activity);
        } else if (avgMoodWithActivity < avgMood - 1) {
          lowMoodActivities.push(activity);
        }
      }
    });
    
    if (highMoodActivities.length) {
      insights.push(`Activities associated with higher mood: ${highMoodActivities.join(', ')}`);
    }
    
    if (lowMoodActivities.length) {
      insights.push(`Activities associated with lower mood: ${lowMoodActivities.join(', ')}`);
    }
    
    return {
      avgMood: avgMood.toFixed(1),
      moodChange: moodChange.toFixed(1),
      avgPhq9: avgPhq9.toFixed(1),
      avgGad7: avgGad7.toFixed(1),
      phq9Change: phq9Change.toFixed(1),
      gad7Change: gad7Change.toFixed(1),
      topActivities,
      insights
    };
  };

  const stats = calculateStatistics();

  // No export functionality

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold text-black mb-4 md:mb-0">Mental Health Dashboard</h1>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>
      
      {/* Navigation Tabs - Simplified */}
      <div className="flex flex-wrap border-b mb-8">
        <button
          className={`px-4 py-2 ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'mood' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('mood')}
        >
          Mood Analysis
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'milestones' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('milestones')}
        >
          Milestones
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 p-4 rounded-md mb-8">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* No data message */}
          {!moodData.length && !assessmentData.length ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">No data available</h2>
              <p className="text-gray-600 mb-6">
                Start tracking your mood and complete assessments to see visualizations and insights here.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/mood" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all">
                  Record Mood
                </Link>
                <Link href="/assessment" className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-all">
                  Take Assessment
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Average Mood</h3>
                      <div className="flex items-end">
                        <p className="text-3xl font-bold text-blue-600">{stats.avgMood}</p>
                        <p className="text-gray-600 ml-2">/ 10</p>
                      </div>
                      <div className={`flex items-center mt-2 ${parseFloat(stats.moodChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <span>{parseFloat(stats.moodChange) >= 0 ? '↑' : '↓'}</span>
                        <span className="ml-1">{Math.abs(parseFloat(stats.moodChange))}% from last week</span>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Depression Score (PHQ-9)</h3>
                      <div className="flex items-end">
                        <p className="text-3xl font-bold text-purple-600">{stats.avgPhq9}</p>
                        <p className="text-gray-600 ml-2">/ 27</p>
                      </div>
                      <div className={`flex items-center mt-2 ${parseFloat(stats.phq9Change) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <span>{parseFloat(stats.phq9Change) <= 0 ? '↓' : '↑'}</span>
                        <span className="ml-1">{Math.abs(parseFloat(stats.phq9Change))}% from last assessment</span>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Anxiety Score (GAD-7)</h3>
                      <div className="flex items-end">
                        <p className="text-3xl font-bold text-indigo-600">{stats.avgGad7}</p>
                        <p className="text-gray-600 ml-2">/ 21</p>
                      </div>
                      <div className={`flex items-center mt-2 ${parseFloat(stats.gad7Change) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <span>{parseFloat(stats.gad7Change) <= 0 ? '↓' : '↑'}</span>
                        <span className="ml-1">{Math.abs(parseFloat(stats.gad7Change))}% from last assessment</span>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Entries Recorded</h3>
                      <div className="flex items-end">
                        <p className="text-3xl font-bold text-green-600">{moodData.length}</p>
                        <p className="text-gray-600 ml-2">moods</p>
                      </div>
                      <div className="flex items-center mt-2 text-gray-600">
                        <span>{assessmentData.length} assessments completed</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mood Trends</h3>
                        <div className="h-64">
                          {moodData.length > 0 ? (
                            <MoodTrendsChart moodData={moodData} />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                              No mood data available
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Assessment Trends</h3>
                        <div className="h-64">
                          {assessmentData.length > 0 ? (
                            <AssessmentTrendsChart assessmentData={assessmentData} />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                              No assessment data available
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Insights and Activities */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights</h3>
                        {stats.insights.length > 0 ? (
                          <ul className="space-y-2">
                            {stats.insights.map((insight, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                <span>{insight}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500">
                            Record more data to receive personalized insights.
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Activities</h3>
                        {stats.topActivities.length > 0 ? (
                          <div className="space-y-3">
                            {stats.topActivities.map((item, index) => (
                              <div key={index} className="flex items-center">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div 
                                    className="bg-blue-600 h-2.5 rounded-full" 
                                    style={{ width: `${(item.count / stats.topActivities[0].count) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="ml-4 min-w-[100px]">{item.activity}</span>
                                <span className="ml-2 text-gray-500 text-sm">{item.count} times</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500">
                            No activities recorded yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Mood Analysis Tab */}
              {activeTab === 'mood' && (
                <div className="space-y-8">
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Mood Analysis</h3>
                      <div className="h-96">
                        {moodData.length > 0 ? (
                          <MoodTrendsChart moodData={moodData} detailed={true} />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            No mood data available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Impact on Mood</h3>
                      <div className="h-96">
                        {moodData.length > 0 ? (
                          <ActivityImpactChart moodData={moodData} />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            No mood data available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Removed Assessment Trends Tab */}
              
              {/* Removed Correlations Tab */}
              
              {/* Milestones Tab */}
              {activeTab === 'milestones' && (
                <div className="space-y-8">
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress and Milestones</h3>
                      <div className="h-96">
                        <MilestoneTracker moodData={moodData} assessmentData={assessmentData} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}