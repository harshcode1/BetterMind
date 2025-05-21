'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import MoodChart from './MoodChart';

export default function MoodPage() {
  const [mood, setMood] = useState(5);
  const [notes, setNotes] = useState('');
  const [activities, setActivities] = useState([]);
  const [activityInput, setActivityInput] = useState('');
  const [moodHistory, setMoodHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [timeframe, setTimeframe] = useState('30'); // Default to 30 days
  
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Predefined activity options
  const activityOptions = [
    'Exercise', 'Work', 'Study', 'Family Time', 'Social Event', 
    'Relaxation', 'Meditation', 'Reading', 'Outdoor Activity', 'Travel',
    'Creative Activity', 'Entertainment', 'Chores', 'Sleep Issues', 'Illness',
    'Therapy', 'Self-care', 'Cooking', 'Music', 'Gaming'
  ];

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/mood');
    }
  }, [user, authLoading, router]);

  // Fetch mood history when component mounts or timeframe changes
  useEffect(() => {
    if (user) {
      fetchMoodHistory();
    }
  }, [user, timeframe]);

  const fetchMoodHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mood?days=${timeframe}`);
      if (res.ok) {
        const data = await res.json();
        setMoodHistory(data.moods || []);
      } else {
        setError('Failed to load mood history');
      }
    } catch (error) {
      console.error('Error fetching mood history:', error);
      setError('An error occurred while fetching your mood history');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSubmitting(true);

    try {
      const res = await fetch('/api/mood', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mood: parseInt(mood),
          notes,
          activities
        })
      });

      if (res.ok) {
        setSuccess(true);
        setMood(5);
        setNotes('');
        setActivities([]);
        fetchMoodHistory(); // Refresh the mood history
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to record mood');
      }
    } catch (error) {
      console.error('Error recording mood:', error);
      setError('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const addActivity = () => {
    if (activityInput.trim() && !activities.includes(activityInput.trim())) {
      setActivities([...activities, activityInput.trim()]);
      setActivityInput('');
    }
  };

  const removeActivity = (activity) => {
    setActivities(activities.filter(a => a !== activity));
  };

  const selectPredefinedActivity = (activity) => {
    if (!activities.includes(activity)) {
      setActivities([...activities, activity]);
    } else {
      removeActivity(activity);
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

  // Get emoji based on mood level
  const getMoodEmoji = (level) => {
    const emojis = ['😭', '😢', '😟', '😐', '🙂', '😊', '😄', '😁', '🥳', '😍'];
    return emojis[level - 1] || '😐';
  };

  // Get mood description based on level
  const getMoodDescription = (level) => {
    const descriptions = [
      'Very Sad', 'Sad', 'Down', 'Neutral', 'Okay', 
      'Good', 'Happy', 'Very Happy', 'Excellent', 'Ecstatic'
    ];
    return descriptions[level - 1] || 'Neutral';
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
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-black mb-2">Mood Tracker</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Track your daily mood and activities to identify patterns and gain insights into your mental health journey
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mood Entry Form */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">How are you feeling today?</h2>
            
            {error && (
              <div className="bg-red-50 p-4 rounded-md mb-6">
                <p className="text-red-600">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 p-4 rounded-md mb-6">
                <p className="text-green-600">Your mood has been recorded successfully!</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Mood Level</label>
                <div className="text-center mb-3">
                  <span className="text-4xl">{getMoodEmoji(mood)}</span>
                  <p className="text-gray-700 mt-1 font-medium">{getMoodDescription(mood)}</p>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500">1</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="w-full h-2 mx-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">10</span>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Activities (What have you been doing?)</label>
                
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-2">Select from common activities:</p>
                  <div className="flex flex-wrap gap-2">
                    {activityOptions.map((activity, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selectPredefinedActivity(activity)}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          activities.includes(activity) 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                      >
                        {activity}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex mb-3">
                  <input
                    type="text"
                    value={activityInput}
                    onChange={(e) => setActivityInput(e.target.value)}
                    placeholder="Add a custom activity..."
                    className="flex-1 px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addActivity();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addActivity}
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                
                {activities.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Selected activities:</p>
                    <div className="flex flex-wrap gap-2">
                      {activities.map((activity, index) => (
                        <span 
                          key={index} 
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center"
                        >
                          {activity}
                          <button 
                            type="button"
                            onClick={() => removeActivity(activity)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How are you feeling? What's on your mind? Any factors that might be affecting your mood today?"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                ></textarea>
              </div>
              
              <button
                type="submit"
                disabled={submitting}
                className={`w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all ${
                  submitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {submitting ? 'Recording...' : 'Record Mood'}
              </button>
            </form>
          </div>
        </div>
        
        {/* Mood Visualization */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Mood History</h2>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 3 months</option>
              </select>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : moodHistory.length > 0 ? (
              <>
                <div className="h-64 mb-6">
                  <MoodChart moodData={moodHistory} />
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Recent Entries</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {moodHistory.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">{getMoodEmoji(entry.mood)}</span>
                          <div>
                            <span className="font-medium text-gray-900">{getMoodDescription(entry.mood)}</span>
                            <span className="text-gray-500 text-sm ml-2">Level {entry.mood}</span>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">{formatDate(entry.createdAt)}</span>
                      </div>
                      
                      {entry.activities && entry.activities.length > 0 && (
                        <div className="mb-2">
                          <div className="flex flex-wrap gap-1 mt-2">
                            {entry.activities.map((activity, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                                {activity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {entry.notes && (
                        <p className="text-gray-700 text-sm mt-2 bg-gray-50 p-2 rounded">{entry.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-600 mb-2">You haven't recorded any moods yet.</p>
                <p className="text-gray-500">Start tracking your mood to see patterns over time.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Tips Section */}
      <div className="mt-10 bg-blue-50 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Tips for Effective Mood Tracking</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <ul className="space-y-2">
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Track your mood at the same time each day for consistency</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Note activities that seem to affect your mood positively or negatively</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Use the notes section to provide context about your feelings</span>
              </li>
            </ul>
          </div>
          <div>
            <ul className="space-y-2">
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Look for patterns in your mood over time</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Be honest with yourself - there are no "right" or "wrong" moods</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Share your mood patterns with your healthcare provider if relevant</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}