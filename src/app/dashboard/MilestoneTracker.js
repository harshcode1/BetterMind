'use client';

import { useEffect, useState } from 'react';

const MilestoneTracker = ({ moodData, assessmentData }) => {
  const [milestones, setMilestones] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  useEffect(() => {
    if ((!moodData || moodData.length === 0) && (!assessmentData || assessmentData.length === 0)) return;

    // Generate milestones and achievements
    const generatedMilestones = generateMilestones(moodData, assessmentData);
    const generatedAchievements = generateAchievements(moodData, assessmentData);
    
    setMilestones(generatedMilestones);
    setAchievements(generatedAchievements);
  }, [moodData, assessmentData]);

  // Generate milestones based on mood and assessment data
  const generateMilestones = (moods, assessments) => {
    const milestones = [];
    
    // First entry milestones
    if (moods && moods.length > 0) {
      const firstMood = moods.reduce((earliest, mood) => 
        new Date(mood.createdAt) < new Date(earliest.createdAt) ? mood : earliest, moods[0]);
      
      milestones.push({
        id: 'first-mood',
        type: 'mood',
        title: 'First Mood Entry',
        description: 'You started tracking your mood',
        date: firstMood.createdAt,
        icon: '📝',
        color: 'blue'
      });
    }
    
    if (assessments && assessments.length > 0) {
      const firstAssessment = assessments.reduce((earliest, assessment) => 
        new Date(assessment.date) < new Date(earliest.date) ? assessment : earliest, assessments[0]);
      
      milestones.push({
        id: 'first-assessment',
        type: 'assessment',
        title: 'First Assessment',
        description: 'You completed your first mental health assessment',
        date: firstAssessment.date,
        icon: '📋',
        color: 'purple'
      });
    }
    
    // Consistency milestones
    if (moods && moods.length >= 7) {
      // Check for 7 consecutive days of mood tracking
      const sortedMoods = [...moods].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      let consecutiveDays = checkConsecutiveDays(sortedMoods);
      
      if (consecutiveDays >= 7) {
        milestones.push({
          id: 'week-streak',
          type: 'streak',
          title: 'One Week Streak',
          description: 'You tracked your mood for 7 consecutive days',
          date: sortedMoods[6].createdAt,
          icon: '🔥',
          color: 'orange'
        });
      }
      
      if (moods.length >= 30) {
        milestones.push({
          id: 'thirty-entries',
          type: 'count',
          title: '30 Mood Entries',
          description: 'You\'ve recorded 30 mood entries',
          date: sortedMoods[29].createdAt,
          icon: '🎯',
          color: 'green'
        });
      }
    }
    
    // Improvement milestones
    if (assessments && assessments.length >= 2) {
      const sortedAssessments = [...assessments].sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Check for significant improvement in PHQ-9 (depression)
      for (let i = 1; i < sortedAssessments.length; i++) {
        const current = sortedAssessments[i];
        const previous = sortedAssessments[i-1];
        
        // Significant improvement is defined as a decrease of 5 points or more
        if (previous.phq9Score - current.phq9Score >= 5) {
          milestones.push({
            id: `phq9-improvement-${i}`,
            type: 'improvement',
            title: 'Depression Score Improvement',
            description: `Your PHQ-9 score improved from ${previous.phq9Score} to ${current.phq9Score}`,
            date: current.date,
            icon: '📈',
            color: 'green',
            data: {
              previous: previous.phq9Score,
              current: current.phq9Score,
              difference: previous.phq9Score - current.phq9Score
            }
          });
          break; // Only include the first significant improvement
        }
      }
      
      // Check for significant improvement in GAD-7 (anxiety)
      for (let i = 1; i < sortedAssessments.length; i++) {
        const current = sortedAssessments[i];
        const previous = sortedAssessments[i-1];
        
        // Significant improvement is defined as a decrease of 4 points or more
        if (previous.gad7Score - current.gad7Score >= 4) {
          milestones.push({
            id: `gad7-improvement-${i}`,
            type: 'improvement',
            title: 'Anxiety Score Improvement',
            description: `Your GAD-7 score improved from ${previous.gad7Score} to ${current.gad7Score}`,
            date: current.date,
            icon: '📉',
            color: 'blue',
            data: {
              previous: previous.gad7Score,
              current: current.gad7Score,
              difference: previous.gad7Score - current.gad7Score
            }
          });
          break; // Only include the first significant improvement
        }
      }
      
      // Check for severity level improvement
      for (let i = 1; i < sortedAssessments.length; i++) {
        const current = sortedAssessments[i];
        const previous = sortedAssessments[i-1];
        
        // Check if depression severity improved by at least one level
        if (getSeverityLevel(previous.phq9Score, 'phq9') > getSeverityLevel(current.phq9Score, 'phq9')) {
          milestones.push({
            id: `phq9-severity-improvement-${i}`,
            type: 'severity',
            title: 'Depression Severity Improvement',
            description: `Your depression severity improved from ${getSeverityText(previous.phq9Score, 'phq9')} to ${getSeverityText(current.phq9Score, 'phq9')}`,
            date: current.date,
            icon: '⬇️',
            color: 'green'
          });
          break; // Only include the first severity improvement
        }
      }
      
      for (let i = 1; i < sortedAssessments.length; i++) {
        const current = sortedAssessments[i];
        const previous = sortedAssessments[i-1];
        
        // Check if anxiety severity improved by at least one level
        if (getSeverityLevel(previous.gad7Score, 'gad7') > getSeverityLevel(current.gad7Score, 'gad7')) {
          milestones.push({
            id: `gad7-severity-improvement-${i}`,
            type: 'severity',
            title: 'Anxiety Severity Improvement',
            description: `Your anxiety severity improved from ${getSeverityText(previous.gad7Score, 'gad7')} to ${getSeverityText(current.gad7Score, 'gad7')}`,
            date: current.date,
            icon: '⬇️',
            color: 'blue'
          });
          break; // Only include the first severity improvement
        }
      }
    }
    
    // Mood improvement milestones
    if (moods && moods.length >= 14) {
      const sortedMoods = [...moods].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      // Calculate average mood for first and second week
      const firstWeekMoods = sortedMoods.slice(0, 7);
      const secondWeekMoods = sortedMoods.slice(7, 14);
      
      const firstWeekAvg = firstWeekMoods.reduce((sum, mood) => sum + mood.mood, 0) / firstWeekMoods.length;
      const secondWeekAvg = secondWeekMoods.reduce((sum, mood) => sum + mood.mood, 0) / secondWeekMoods.length;
      
      // If second week average is significantly better (1.5+ points)
      if (secondWeekAvg - firstWeekAvg >= 1.5) {
        milestones.push({
          id: 'mood-improvement',
          type: 'improvement',
          title: 'Mood Improvement',
          description: `Your average mood improved from ${firstWeekAvg.toFixed(1)} to ${secondWeekAvg.toFixed(1)}`,
          date: secondWeekMoods[secondWeekMoods.length - 1].createdAt,
          icon: '😊',
          color: 'yellow',
          data: {
            previous: firstWeekAvg,
            current: secondWeekAvg,
            difference: secondWeekAvg - firstWeekAvg
          }
        });
      }
    }
    
    // Sort milestones by date
    return milestones.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Generate achievements based on mood and assessment data
  const generateAchievements = (moods, assessments) => {
    const achievements = [];
    
    // Entry count achievements
    if (moods) {
      const moodCount = moods.length;
      
      if (moodCount >= 5) achievements.push({
        id: 'mood-5',
        title: '5 Mood Entries',
        description: 'You\'ve recorded 5 mood entries',
        icon: '🌱',
        unlocked: true
      });
      
      if (moodCount >= 20) achievements.push({
        id: 'mood-20',
        title: '20 Mood Entries',
        description: 'You\'ve recorded 20 mood entries',
        icon: '🌿',
        unlocked: true
      });
      
      if (moodCount >= 50) achievements.push({
        id: 'mood-50',
        title: '50 Mood Entries',
        description: 'You\'ve recorded 50 mood entries',
        icon: '🌳',
        unlocked: true
      });
      
      if (moodCount >= 100) achievements.push({
        id: 'mood-100',
        title: '100 Mood Entries',
        description: 'You\'ve recorded 100 mood entries',
        icon: '🏆',
        unlocked: true
      });
    }
    
    // Assessment achievements
    if (assessments) {
      const assessmentCount = assessments.length;
      
      if (assessmentCount >= 1) achievements.push({
        id: 'assessment-1',
        title: 'First Assessment',
        description: 'You completed your first mental health assessment',
        icon: '🔍',
        unlocked: true
      });
      
      if (assessmentCount >= 3) achievements.push({
        id: 'assessment-3',
        title: 'Regular Check-ins',
        description: 'You\'ve completed 3 mental health assessments',
        icon: '📊',
        unlocked: true
      });
      
      if (assessmentCount >= 10) achievements.push({
        id: 'assessment-10',
        title: 'Consistent Monitoring',
        description: 'You\'ve completed 10 mental health assessments',
        icon: '📈',
        unlocked: true
      });
    }
    
    // Streak achievements
    if (moods && moods.length >= 3) {
      const sortedMoods = [...moods].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      let consecutiveDays = checkConsecutiveDays(sortedMoods);
      
      if (consecutiveDays >= 3) achievements.push({
        id: 'streak-3',
        title: '3-Day Streak',
        description: 'You tracked your mood for 3 consecutive days',
        icon: '🔥',
        unlocked: true
      });
      
      if (consecutiveDays >= 7) achievements.push({
        id: 'streak-7',
        title: '7-Day Streak',
        description: 'You tracked your mood for a full week',
        icon: '🔥🔥',
        unlocked: true
      });
      
      if (consecutiveDays >= 14) achievements.push({
        id: 'streak-14',
        title: '2-Week Streak',
        description: 'You tracked your mood for 2 consecutive weeks',
        icon: '🔥🔥🔥',
        unlocked: true
      });
      
      if (consecutiveDays >= 30) achievements.push({
        id: 'streak-30',
        title: 'Monthly Dedication',
        description: 'You tracked your mood every day for a month',
        icon: '🏅',
        unlocked: true
      });
    }
    
    // Improvement achievements
    if (assessments && assessments.length >= 2) {
      const sortedAssessments = [...assessments].sort((a, b) => new Date(a.date) - new Date(b.date));
      const firstAssessment = sortedAssessments[0];
      const latestAssessment = sortedAssessments[sortedAssessments.length - 1];
      
      // PHQ-9 improvement
      if (firstAssessment.phq9Score - latestAssessment.phq9Score >= 3) {
        achievements.push({
          id: 'phq9-improvement',
          title: 'Depression Score Improvement',
          description: 'Your depression score has improved since your first assessment',
          icon: '🌈',
          unlocked: true
        });
      }
      
      // GAD-7 improvement
      if (firstAssessment.gad7Score - latestAssessment.gad7Score >= 3) {
        achievements.push({
          id: 'gad7-improvement',
          title: 'Anxiety Score Improvement',
          description: 'Your anxiety score has improved since your first assessment',
          icon: '☀️',
          unlocked: true
        });
      }
      
      // Severity level improvement
      if (getSeverityLevel(firstAssessment.phq9Score, 'phq9') > getSeverityLevel(latestAssessment.phq9Score, 'phq9')) {
        achievements.push({
          id: 'phq9-severity-improvement',
          title: 'Depression Severity Improvement',
          description: 'Your depression severity level has improved',
          icon: '⬇️',
          unlocked: true
        });
      }
      
      if (getSeverityLevel(firstAssessment.gad7Score, 'gad7') > getSeverityLevel(latestAssessment.gad7Score, 'gad7')) {
        achievements.push({
          id: 'gad7-severity-improvement',
          title: 'Anxiety Severity Improvement',
          description: 'Your anxiety severity level has improved',
          icon: '⬇️',
          unlocked: true
        });
      }
    }
    
    // Add locked achievements that user hasn't earned yet
    if (!achievements.find(a => a.id === 'mood-5')) {
      achievements.push({
        id: 'mood-5',
        title: '5 Mood Entries',
        description: 'Record 5 mood entries',
        icon: '🔒',
        unlocked: false
      });
    }
    
    if (!achievements.find(a => a.id === 'streak-3')) {
      achievements.push({
        id: 'streak-3',
        title: '3-Day Streak',
        description: 'Track your mood for 3 consecutive days',
        icon: '🔒',
        unlocked: false
      });
    }
    
    if (!achievements.find(a => a.id === 'assessment-1')) {
      achievements.push({
        id: 'assessment-1',
        title: 'First Assessment',
        description: 'Complete your first mental health assessment',
        icon: '🔒',
        unlocked: false
      });
    }
    
    return achievements;
  };

  // Helper function to check consecutive days in mood data
  const checkConsecutiveDays = (sortedMoods) => {
    let maxConsecutive = 1;
    let currentConsecutive = 1;
    
    for (let i = 1; i < sortedMoods.length; i++) {
      const prevDate = new Date(sortedMoods[i-1].createdAt);
      const currDate = new Date(sortedMoods[i].createdAt);
      
      // Check if dates are consecutive (within 36 hours to account for time differences)
      const hoursDiff = (currDate - prevDate) / (1000 * 60 * 60);
      
      if (hoursDiff <= 36) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 1;
      }
    }
    
    return maxConsecutive;
  };

  // Helper function to get severity level (0-3)
  const getSeverityLevel = (score, type) => {
    if (type === 'phq9') {
      if (score >= 0 && score <= 4) return 0; // Minimal
      if (score >= 5 && score <= 9) return 1; // Mild
      if (score >= 10 && score <= 14) return 2; // Moderate
      if (score >= 15 && score <= 19) return 3; // Moderately Severe
      return 4; // Severe
    } else { // GAD-7
      if (score >= 0 && score <= 4) return 0; // Minimal
      if (score >= 5 && score <= 9) return 1; // Mild
      if (score >= 10 && score <= 14) return 2; // Moderate
      return 3; // Severe
    }
  };

  // Helper function to get severity text
  const getSeverityText = (score, type) => {
    if (type === 'phq9') {
      if (score >= 0 && score <= 4) return "Minimal";
      if (score >= 5 && score <= 9) return "Mild";
      if (score >= 10 && score <= 14) return "Moderate";
      if (score >= 15 && score <= 19) return "Moderately Severe";
      return "Severe";
    } else { // GAD-7
      if (score >= 0 && score <= 4) return "Minimal";
      if (score >= 5 && score <= 9) return "Mild";
      if (score >= 10 && score <= 14) return "Moderate";
      return "Severe";
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="w-full h-full overflow-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Milestones Timeline */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Mental Health Journey</h3>
          
          {milestones.length > 0 ? (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              {/* Milestone items */}
              <div className="space-y-6">
                {milestones.map((milestone, index) => (
                  <div 
                    key={milestone.id} 
                    className={`relative pl-10 ${
                      selectedMilestone === milestone.id ? 'bg-gray-50 -mx-4 px-4 py-2 rounded-lg' : ''
                    }`}
                    onClick={() => setSelectedMilestone(selectedMilestone === milestone.id ? null : milestone.id)}
                  >
                    {/* Timeline dot */}
                    <div 
                      className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center text-white bg-${milestone.color}-500`}
                      style={{ backgroundColor: getColorByName(milestone.color) }}
                    >
                      <span>{milestone.icon}</span>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">{formatDate(milestone.date)}</p>
                      <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                      <p className="text-gray-700">{milestone.description}</p>
                      
                      {/* Additional details when selected */}
                      {selectedMilestone === milestone.id && milestone.data && (
                        <div className="mt-2 p-3 bg-gray-100 rounded-md">
                          {milestone.type === 'improvement' && (
                            <div className="flex items-center justify-between">
                              <div className="text-center">
                                <p className="text-sm text-gray-500">Before</p>
                                <p className="text-lg font-medium">{milestone.data.previous}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-gray-500">Improvement</p>
                                <p className="text-lg font-medium text-green-600">
                                  {milestone.data.difference > 0 ? '+' : ''}{milestone.data.difference.toFixed(1)}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-gray-500">After</p>
                                <p className="text-lg font-medium">{milestone.data.current}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                Your journey milestones will appear here as you continue to track your mental health.
              </p>
              <p className="text-gray-500 mt-2">
                Start by recording your mood and completing assessments.
              </p>
            </div>
          )}
        </div>
        
        {/* Achievements */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h3>
          
          {achievements.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {achievements.map(achievement => (
                <div 
                  key={achievement.id} 
                  className={`border rounded-lg p-4 ${
                    achievement.unlocked 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-gray-50 opacity-70'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="text-2xl mr-3">{achievement.icon}</div>
                    <div>
                      <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                      <p className="text-sm text-gray-700">{achievement.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                Achievements will unlock as you continue to use the platform.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Encouragement message */}
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 text-center">
        <p className="text-blue-800">
          {milestones.length > 0 
            ? "Great progress! Keep tracking your mental health to see more milestones and unlock achievements."
            : "Start your mental health journey by recording your mood and completing assessments."}
        </p>
      </div>
    </div>
  );
};

// Helper function to get color by name
const getColorByName = (colorName) => {
  const colorMap = {
    blue: '#3b82f6',
    green: '#10b981',
    red: '#ef4444',
    yellow: '#f59e0b',
    purple: '#8b5cf6',
    orange: '#f97316',
    gray: '#6b7280'
  };
  
  return colorMap[colorName] || colorMap.gray;
};

export default MilestoneTracker;