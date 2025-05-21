'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';

// PHQ-9 Depression questionnaire
const phq9Questions = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself - or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television",
  "Moving or speaking so slowly that other people could have noticed. Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead, or of hurting yourself in some way"
];

// GAD-7 Anxiety questionnaire
const gad7Questions = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it's hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid, as if something awful might happen"
];

// Frequency options for both questionnaires
const frequencyOptions = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "Several days" },
  { value: 2, label: "More than half the days" },
  { value: 3, label: "Nearly every day" }
];

export default function AssessmentDetailsPage({ params }) {
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = params;

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/assessment/details/' + id);
    }
  }, [user, authLoading, router, id]);

  // Fetch assessment details
  useEffect(() => {
    if (user && id) {
      fetchAssessmentDetails();
    }
  }, [user, id]);

  const fetchAssessmentDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/assessment/${id}`);
      if (res.ok) {
        const data = await res.json();
        setAssessment(data.assessment);
      } else {
        setError('Failed to load assessment details');
      }
    } catch (error) {
      console.error('Error fetching assessment details:', error);
      setError('An error occurred while fetching assessment details');
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

  const getFrequencyLabel = (value) => {
    const option = frequencyOptions.find(opt => opt.value === value);
    return option ? option.label : 'Unknown';
  };

  // Generate recommendations based on scores
  const generateRecommendations = () => {
    if (!assessment) return [];
    
    const recommendations = [];
    const { phq9Score, gad7Score, phq9Answers } = assessment;
    
    // Depression recommendations
    if (phq9Score >= 10) {
      recommendations.push("Consider consulting with a mental health professional about your depression symptoms");
    }
    if (phq9Score >= 5) {
      recommendations.push("Practice self-care activities like regular exercise and maintaining a healthy sleep schedule");
      recommendations.push("Try mindfulness meditation to help manage depressive thoughts");
    }
    
    // Anxiety recommendations
    if (gad7Score >= 10) {
      recommendations.push("Consider consulting with a mental health professional about your anxiety symptoms");
    }
    if (gad7Score >= 5) {
      recommendations.push("Practice deep breathing exercises when feeling anxious");
      recommendations.push("Limit caffeine and alcohol which can worsen anxiety");
    }
    
    // General recommendations
    recommendations.push("Track your mood daily to identify patterns and triggers");
    recommendations.push("Maintain social connections and don't hesitate to reach out for support");
    
    // Suicide risk check (PHQ-9 question 9)
    const suicideRiskScore = phq9Answers ? phq9Answers[8] : 0;
    if (suicideRiskScore >= 1) {
      recommendations.unshift("Your responses indicate you may be having thoughts of harming yourself. Please reach out to a mental health professional immediately or contact a crisis helpline.");
    }
    
    return recommendations;
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center mb-8">
        <button 
          onClick={() => router.push('/assessment/history')}
          className="mr-4 text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to History
        </button>
        <h1 className="text-3xl font-bold text-black">Assessment Details</h1>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      ) : assessment ? (
        <div className="space-y-8">
          {/* Assessment Summary */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Assessment Summary</h2>
                <p className="text-sm text-gray-500">{formatDate(assessment.date)}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Depression (PHQ-9)</h3>
                  <div className="flex items-center mb-2">
                    <span className="text-3xl font-bold text-blue-600">{assessment.phq9Score}</span>
                    <span className="text-gray-600 ml-2">/ 27</span>
                  </div>
                  <p className="text-gray-800">
                    Severity: <span className={`font-medium px-2 py-1 rounded-full ${getSeverityColor(assessment.depressionSeverity)}`}>{assessment.depressionSeverity}</span>
                  </p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Anxiety (GAD-7)</h3>
                  <div className="flex items-center mb-2">
                    <span className="text-3xl font-bold text-purple-600">{assessment.gad7Score}</span>
                    <span className="text-gray-600 ml-2">/ 21</span>
                  </div>
                  <p className="text-gray-800">
                    Severity: <span className={`font-medium px-2 py-1 rounded-full ${getSeverityColor(assessment.anxietySeverity)}`}>{assessment.anxietySeverity}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recommendations */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommendations</h2>
              
              <ul className="space-y-2">
                {generateRecommendations().map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className={index === 0 && recommendation.includes("harming yourself") ? "text-red-600 font-medium" : ""}>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* PHQ-9 Responses */}
          {assessment.phq9Answers && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Depression Assessment (PHQ-9) Responses</h2>
                
                <div className="space-y-4">
                  {phq9Questions.map((question, index) => (
                    <div key={index} className="border-b pb-4">
                      <p className="mb-2 font-medium text-gray-800">{question}</p>
                      <div className="flex items-center">
                        <div className={`px-3 py-1 rounded-full text-sm ${
                          assessment.phq9Answers[index] === 0 ? 'bg-green-100 text-green-800' :
                          assessment.phq9Answers[index] === 1 ? 'bg-yellow-100 text-yellow-800' :
                          assessment.phq9Answers[index] === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {getFrequencyLabel(assessment.phq9Answers[index])}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* GAD-7 Responses */}
          {assessment.gad7Answers && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Anxiety Assessment (GAD-7) Responses</h2>
                
                <div className="space-y-4">
                  {gad7Questions.map((question, index) => (
                    <div key={index} className="border-b pb-4">
                      <p className="mb-2 font-medium text-gray-800">{question}</p>
                      <div className="flex items-center">
                        <div className={`px-3 py-1 rounded-full text-sm ${
                          assessment.gad7Answers[index] === 0 ? 'bg-green-100 text-green-800' :
                          assessment.gad7Answers[index] === 1 ? 'bg-yellow-100 text-yellow-800' :
                          assessment.gad7Answers[index] === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {getFrequencyLabel(assessment.gad7Answers[index])}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Disclaimer */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 text-sm">
              <strong>Disclaimer:</strong> This assessment is not a diagnostic tool and does not replace professional medical advice. 
              If you're experiencing severe symptoms or having thoughts of harming yourself, please seek immediate professional help.
            </p>
          </div>
          
          <div className="flex justify-between">
            <button
              onClick={() => router.push('/assessment/history')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-all"
            >
              Back to History
            </button>
            
            <button
              onClick={() => router.push('/assessment')}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all"
            >
              Take New Assessment
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">Assessment not found.</p>
          <button 
            onClick={() => router.push('/assessment/history')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-all"
          >
            Back to History
          </button>
        </div>
      )}
    </div>
  );
}