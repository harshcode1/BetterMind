'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

// Predefined symptom categories and options
const symptomCategories = [
  {
    name: "Mental Health",
    symptoms: [
      "anxiety",
      "depression",
      "stress",
      "insomnia",
      "mood swings",
      "panic"
    ]
  },
  {
    name: "Physical Health",
    symptoms: [
      "headache",
      "fatigue",
      "pain",
      "dizziness"
    ]
  },
  {
    name: "Other",
    symptoms: [
      "I'm not sure / Other symptoms"
    ]
  }
];

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showSymptoms, setShowSymptoms] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/chat');
    }
  }, [user, authLoading, router]);
  
  useEffect(() => {
    // Only fetch messages if user is authenticated
    if (user) {
      const fetchMessages = async () => {
        try {
          const res = await fetch('/api/chat');
          const data = await res.json();
          if (data.messages) setMessages(data.messages);
        } catch (error) {
          console.error('Error fetching chat messages:', error);
        }
      };
      fetchMessages();
    }
  }, [user]);

  const handleCategorySelect = (categoryIndex) => {
    setSelectedCategory(categoryIndex);
    setShowSymptoms(true);
  };

  const handleSymptomSelect = async (symptom) => {
    if (!user) return;
    setLoading(true);
    setShowSymptoms(false);
    setSelectedCategory(null);

    const userMessage = { text: `I'm experiencing ${symptom}`, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: symptom }),
      });
      
      const data = await res.json();
      setMessages((prev) => [
        ...prev, 
        { 
          text: data.message, 
          sender: 'bot',
          recommendation: data.recommendation 
        }
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Optionally show an error to the user
    } finally {
      setLoading(false);
    }
  };

  const resetSelection = () => {
    setSelectedCategory(null);
    setShowSymptoms(false);
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Don't render chat if user is not authenticated (they will be redirected)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Symptom Diagnosis</h1>
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6">
        <div className="mb-4 p-4 bg-gray-50 rounded-md">
          <p className="text-gray-700 mb-4">
            Select your symptoms below, and I'll recommend which specialist you should see and provide helpful resources.
          </p>
        </div>
        
        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-md">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 my-2 rounded-lg ${msg.sender === 'user' ? 'bg-blue-500 text-white ml-auto max-w-xs' : 'bg-gray-200 text-gray-900 max-w-md'}`}
            >
              {msg.text}
              
              {msg.recommendation && (
                <div className="mt-2 pt-2 border-t border-gray-300">
                  <p className="font-semibold">Recommended Specialist:</p>
                  <p>{msg.recommendation.specialist}</p>
                  
                  {msg.recommendation.resources && msg.recommendation.resources.length > 0 && (
                    <>
                      <p className="font-semibold mt-1">Helpful Resources:</p>
                      <ul className="list-disc pl-5">
                        {msg.recommendation.resources.map((resource, i) => (
                          <li key={i}>{resource}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Symptom Selection Interface */}
        <div className="p-4 bg-gray-50 rounded-md">
          {!showSymptoms ? (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-3">What type of symptoms are you experiencing?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {symptomCategories.map((category, index) => (
                  <button
                    key={index}
                    onClick={() => handleCategorySelect(index)}
                    className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    disabled={loading}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-900">Select your specific symptom:</h3>
                <button 
                  onClick={resetSelection}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ← Back to categories
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {symptomCategories[selectedCategory].symptoms.map((symptom, index) => (
                  <button
                    key={index}
                    onClick={() => handleSymptomSelect(symptom)}
                    className="p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-left"
                    disabled={loading}
                  >
                    {symptom.charAt(0).toUpperCase() + symptom.slice(1)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}