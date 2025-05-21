'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

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

export default function AssessmentPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [phq9Answers, setPhq9Answers] = useState(Array(phq9Questions.length).fill(null));
  const [gad7Answers, setGad7Answers] = useState(Array(gad7Questions.length).fill(null));
  const [phq9Score, setPhq9Score] = useState(null);
  const [gad7Score, setGad7Score] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/assessment');
    }
  }, [user, authLoading, router]);

  const handleAnswerChange = (index, value) => {
    if (currentStep === 0) {
      // PHQ-9
      const newAnswers = [...phq9Answers];
      newAnswers[index] = value;
      setPhq9Answers(newAnswers);
    } else if (currentStep === 1) {
      // GAD-7
      const newAnswers = [...gad7Answers];
      newAnswers[index] = value;
      setGad7Answers(newAnswers);
    }
  };

  const handleNext = () => {
    if (currentStep === 0) {
      // Check if all PHQ-9 questions are answered
      if (phq9Answers.includes(null)) {
        setError('Please answer all questions before proceeding');
        return;
      }
      setError('');
      setCurrentStep(1);
    } else if (currentStep === 1) {
      // Check if all GAD-7 questions are answered
      if (gad7Answers.includes(null)) {
        setError('Please answer all questions before proceeding');
        return;
      }
      setError('');
      calculateScores();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  const calculateScores = () => {
    // Calculate PHQ-9 score (sum of all answers)
    const phq9Total = phq9Answers.reduce((sum, value) => sum + value, 0);
    setPhq9Score(phq9Total);
    
    // Calculate GAD-7 score (sum of all answers)
    const gad7Total = gad7Answers.reduce((sum, value) => sum + value, 0);
    setGad7Score(gad7Total);
    
    // Determine depression severity
    let depressionSeverity;
    if (phq9Total >= 0 && phq9Total <= 4) {
      depressionSeverity = "Minimal or none";
    } else if (phq9Total >= 5 && phq9Total <= 9) {
      depressionSeverity = "Mild";
    } else if (phq9Total >= 10 && phq9Total <= 14) {
      depressionSeverity = "Moderate";
    } else if (phq9Total >= 15 && phq9Total <= 19) {
      depressionSeverity = "Moderately severe";
    } else {
      depressionSeverity = "Severe";
    }
    
    // Determine anxiety severity
    let anxietySeverity;
    if (gad7Total >= 0 && gad7Total <= 4) {
      anxietySeverity = "Minimal or none";
    } else if (gad7Total >= 5 && gad7Total <= 9) {
      anxietySeverity = "Mild";
    } else if (gad7Total >= 10 && gad7Total <= 14) {
      anxietySeverity = "Moderate";
    } else {
      anxietySeverity = "Severe";
    }
    
    // Generate recommendations based on scores
    const recommendations = [];
    
    // Depression recommendations
    if (phq9Total >= 10) {
      recommendations.push("Consider consulting with a mental health professional about your depression symptoms");
    }
    if (phq9Total >= 5) {
      recommendations.push("Practice self-care activities like regular exercise and maintaining a healthy sleep schedule");
      recommendations.push("Try mindfulness meditation to help manage depressive thoughts");
    }
    
    // Anxiety recommendations
    if (gad7Total >= 10) {
      recommendations.push("Consider consulting with a mental health professional about your anxiety symptoms");
    }
    if (gad7Total >= 5) {
      recommendations.push("Practice deep breathing exercises when feeling anxious");
      recommendations.push("Limit caffeine and alcohol which can worsen anxiety");
    }
    
    // General recommendations
    recommendations.push("Track your mood daily to identify patterns and triggers");
    recommendations.push("Maintain social connections and don't hesitate to reach out for support");
    
    // Suicide risk check (PHQ-9 question 9)
    const suicideRiskScore = phq9Answers[8];
    let suicideRisk = false;
    let urgentMessage = null;
    
    if (suicideRiskScore >= 1) {
      suicideRisk = true;
      urgentMessage = "Your responses indicate you may be having thoughts of harming yourself. Please reach out to a mental health professional immediately or contact a crisis helpline.";
    }
    
    // Set results
    setResults({
      phq9Score: phq9Total,
      gad7Score: gad7Total,
      depressionSeverity,
      anxietySeverity,
      recommendations,
      suicideRisk,
      urgentMessage,
      date: new Date().toISOString()
    });
    
    // Move to results step
    setCurrentStep(2);
    
    // Save assessment results
    saveAssessmentResults({
      phq9Score: phq9Total,
      gad7Score: gad7Total,
      depressionSeverity,
      anxietySeverity,
      phq9Answers,
      gad7Answers,
      date: new Date().toISOString()
    });
  };

  const saveAssessmentResults = async (assessmentData) => {
    setLoading(true);
    try {
      const res = await fetch('/api/assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(assessmentData)
      });
      
      if (!res.ok) {
        console.error('Failed to save assessment results');
      }
    } catch (error) {
      console.error('Error saving assessment results:', error);
    } finally {
      setLoading(false);
    }
  };

  const restartAssessment = () => {
    setPhq9Answers(Array(phq9Questions.length).fill(null));
    setGad7Answers(Array(gad7Questions.length).fill(null));
    setPhq9Score(null);
    setGad7Score(null);
    setResults(null);
    setCurrentStep(0);
    setError('');
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
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-black mb-2">Mental Health Assessment</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Complete these standardized questionnaires to assess your depression and anxiety levels and receive personalized recommendations
        </p>
      </div>
      
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center justify-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentStep >= 0 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
          </div>
          <div className={`flex-1 h-1 mx-2 ${currentStep >= 1 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
          <div className="flex items-center justify-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
          </div>
          <div className={`flex-1 h-1 mx-2 ${currentStep >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
          <div className="flex items-center justify-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              currentStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
          </div>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <div className="w-24 text-center">Depression<br/>(PHQ-9)</div>
          <div className="w-24 text-center">Anxiety<br/>(GAD-7)</div>
          <div className="w-24 text-center">Results &<br/>Recommendations</div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          {error && (
            <div className="bg-red-50 p-4 rounded-md mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          
          {currentStep === 0 && (
            <>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Depression Assessment (PHQ-9)</h2>
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-gray-700">
                  The PHQ-9 is a standardized questionnaire used to screen for depression severity. Your responses will help assess your current mental health status.
                </p>
              </div>
              <p className="mb-6 text-gray-700 font-medium">
                Over the last 2 weeks, how often have you been bothered by any of the following problems?
              </p>
              
              <div className="space-y-6">
                {phq9Questions.map((question, index) => (
                  <div key={index} className="border-b pb-4">
                    <div className="flex items-start mb-3">
                      <span className="bg-blue-100 text-blue-800 font-medium rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">
                        {index + 1}
                      </span>
                      <p className="font-medium text-gray-800">{question}</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {frequencyOptions.map((option) => (
                        <label 
                          key={option.value} 
                          className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                            phq9Answers[index] === option.value 
                              ? 'bg-blue-50 border-blue-500 text-blue-700' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`phq9-${index}`}
                            value={option.value}
                            checked={phq9Answers[index] === option.value}
                            onChange={() => handleAnswerChange(index, option.value)}
                            className="mr-2"
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          
          {currentStep === 1 && (
            <>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Anxiety Assessment (GAD-7)</h2>
              <div className="bg-purple-50 p-4 rounded-lg mb-6">
                <p className="text-gray-700">
                  The GAD-7 is a standardized questionnaire used to screen for anxiety severity. Your responses will help assess your current mental health status.
                </p>
              </div>
              <p className="mb-6 text-gray-700 font-medium">
                Over the last 2 weeks, how often have you been bothered by any of the following problems?
              </p>
              
              <div className="space-y-6">
                {gad7Questions.map((question, index) => (
                  <div key={index} className="border-b pb-4">
                    <div className="flex items-start mb-3">
                      <span className="bg-purple-100 text-purple-800 font-medium rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">
                        {index + 1}
                      </span>
                      <p className="font-medium text-gray-800">{question}</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {frequencyOptions.map((option) => (
                        <label 
                          key={option.value} 
                          className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                            gad7Answers[index] === option.value 
                              ? 'bg-purple-50 border-purple-500 text-purple-700' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`gad7-${index}`}
                            value={option.value}
                            checked={gad7Answers[index] === option.value}
                            onChange={() => handleAnswerChange(index, option.value)}
                            className="mr-2"
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          
          {currentStep === 2 && results && (
            <>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Assessment Results</h2>
              <p className="text-gray-600 mb-6">Based on your responses, we've generated the following assessment of your mental health status.</p>
              
              {results.urgentMessage && (
                <div className="bg-red-50 p-4 rounded-md mb-6 border-l-4 border-red-500 flex items-start">
                  <svg className="w-6 h-6 text-red-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                  <div>
                    <p className="text-red-700 font-medium">{results.urgentMessage}</p>
                    <p className="text-red-600 mt-2 font-bold">
                      National Suicide Prevention Lifeline: 988 or 1-800-273-8255
                    </p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 shadow-sm">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Depression (PHQ-9)</h3>
                  </div>
                  
                  <div className="flex items-center mb-3">
                    <span className="text-4xl font-bold text-blue-600">{results.phq9Score}</span>
                    <span className="text-gray-600 ml-2 text-lg">/ 27</span>
                  </div>
                  
                  <div className="mb-3 bg-white p-2 rounded border border-blue-100">
                    <p className="text-gray-800">
                      Severity: <span className="font-medium text-blue-700">{results.depressionSeverity}</span>
                    </p>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    {results.phq9Score <= 4 ? 'Your depression symptoms appear to be minimal.' : 
                     results.phq9Score <= 9 ? 'You are showing mild symptoms of depression.' :
                     results.phq9Score <= 14 ? 'You are showing moderate symptoms of depression.' :
                     results.phq9Score <= 19 ? 'You are showing moderately severe symptoms of depression.' :
                     'You are showing severe symptoms of depression.'}
                  </p>
                </div>
                
                <div className="bg-purple-50 p-6 rounded-lg border border-purple-100 shadow-sm">
                  <div className="flex items-center mb-4">
                    <div className="bg-purple-100 p-2 rounded-full mr-3">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Anxiety (GAD-7)</h3>
                  </div>
                  
                  <div className="flex items-center mb-3">
                    <span className="text-4xl font-bold text-purple-600">{results.gad7Score}</span>
                    <span className="text-gray-600 ml-2 text-lg">/ 21</span>
                  </div>
                  
                  <div className="mb-3 bg-white p-2 rounded border border-purple-100">
                    <p className="text-gray-800">
                      Severity: <span className="font-medium text-purple-700">{results.anxietySeverity}</span>
                    </p>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    {results.gad7Score <= 4 ? 'Your anxiety symptoms appear to be minimal.' : 
                     results.gad7Score <= 9 ? 'You are showing mild symptoms of anxiety.' :
                     results.gad7Score <= 14 ? 'You are showing moderate symptoms of anxiety.' :
                     'You are showing severe symptoms of anxiety.'}
                  </p>
                </div>
              </div>
              
              <div className="mb-8 bg-green-50 p-6 rounded-lg border border-green-100 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 p-2 rounded-full mr-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Personalized Recommendations</h3>
                </div>
                
                <ul className="space-y-3 mb-4">
                  {results.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start bg-white p-3 rounded border border-green-100">
                      <span className="bg-green-100 text-green-600 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">✓</span>
                      <span className="text-gray-800">{recommendation}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="flex items-center mt-4">
                  <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <p className="text-sm text-gray-600">
                    Track your progress by taking this assessment regularly and discussing results with a healthcare provider.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <p className="text-gray-700 text-sm">
                    <strong>Disclaimer:</strong> This assessment is not a diagnostic tool and does not replace professional medical advice. 
                    If you're experiencing severe symptoms or having thoughts of harming yourself, please seek immediate professional help.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                <button
                  onClick={restartAssessment}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-all flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  Take Assessment Again
                </button>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => router.push('/mood')}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-all flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Track Your Mood
                  </button>
                  
                  <button
                    onClick={() => router.push('/resources')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                    View Resources
                  </button>
                </div>
              </div>
            </>
          )}
          
          {currentStep < 2 && (
            <div className="flex justify-between mt-8">
              <button
                onClick={handleBack}
                className={`px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-all ${
                  currentStep === 0 ? 'invisible' : ''
                }`}
              >
                Back
              </button>
              
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all"
              >
                {currentStep === 1 ? 'Submit' : 'Next'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}