// app/api/recommendations/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { verifyAuth } from '../../lib/authServer';
import clientPromise from '../../lib/db';
import { ObjectId } from 'mongodb';

// GET endpoint to fetch personalized recommendations (resources and doctors)
export async function GET(request) {
  try {
    // Verify authentication (required for personalized recommendations)
    const { authenticated, user, error } = await verifyAuth();
    
    if (!authenticated) {
      return NextResponse.json({ error: error || 'Authentication required for personalized recommendations' }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'resources', 'doctors', or 'all'
    const limit = parseInt(searchParams.get('limit') || '6', 10);
    
    // Connect to database
    const client = await clientPromise;
    const db = client.db();
    
    // Get user's assessment data (if available)
    const latestAssessment = await db.collection('assessments')
      .find({ userId: new ObjectId(user.id) })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
    
    // Get user's mood data (if available)
    const latestMoods = await db.collection('moods')
      .find({ userId: new ObjectId(user.id) })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    // Get user's resource view history
    const resourceViews = await db.collection('userResourceViews')
      .findOne({ userId: new ObjectId(user.id) });
    
    // Initialize recommendations object
    const recommendations = {
      resources: [],
      doctors: [],
      basedOn: []
    };
    
    // Determine user's mental health needs based on assessments and moods
    const mentalHealthNeeds = [];
    let severity = 'mild';
    
    // Extract needs from assessment
    if (latestAssessment && latestAssessment.length > 0) {
      const assessment = latestAssessment[0];
      
      // Add assessment as a basis for recommendations
      recommendations.basedOn.push('recent assessment');
      
      // Check PHQ-9 (depression) score
      if (assessment.phq9Score) {
        if (assessment.phq9Score >= 15) {
          mentalHealthNeeds.push('depression');
          severity = 'severe';
        } else if (assessment.phq9Score >= 10) {
          mentalHealthNeeds.push('depression');
          severity = 'moderate';
        } else if (assessment.phq9Score >= 5) {
          mentalHealthNeeds.push('depression');
          severity = 'mild';
        }
      }
      
      // Check GAD-7 (anxiety) score
      if (assessment.gad7Score) {
        if (assessment.gad7Score >= 15) {
          mentalHealthNeeds.push('anxiety');
          severity = 'severe';
        } else if (assessment.gad7Score >= 10) {
          mentalHealthNeeds.push('anxiety');
          severity = 'moderate';
        } else if (assessment.gad7Score >= 5) {
          mentalHealthNeeds.push('anxiety');
          severity = 'mild';
        }
      }
      
      // Check for suicide risk (PHQ-9 question 9)
      if (assessment.phq9Responses && assessment.phq9Responses[8] >= 1) {
        mentalHealthNeeds.push('suicide risk');
        severity = 'severe';
      }
    }
    
    // Extract needs from mood data
    if (latestMoods && latestMoods.length > 0) {
      // Add mood data as a basis for recommendations
      recommendations.basedOn.push('recent mood entries');
      
      // Calculate average mood
      const avgMood = latestMoods.reduce((sum, mood) => sum + mood.level, 0) / latestMoods.length;
      
      // Check for low mood patterns
      if (avgMood <= 3) {
        mentalHealthNeeds.push('low mood');
        if (severity !== 'severe') severity = 'moderate';
      } else if (avgMood <= 5) {
        mentalHealthNeeds.push('mood management');
      }
      
      // Check for mood volatility
      const moodValues = latestMoods.map(mood => mood.level);
      const moodVariance = calculateVariance(moodValues);
      
      if (moodVariance > 5) {
        mentalHealthNeeds.push('mood stability');
        if (severity !== 'severe') severity = 'moderate';
      }
      
      // Extract common activities associated with low moods
      const lowMoods = latestMoods.filter(mood => mood.level <= 4);
      const lowMoodActivities = new Set();
      
      lowMoods.forEach(mood => {
        if (mood.activities && mood.activities.length > 0) {
          mood.activities.forEach(activity => lowMoodActivities.add(activity));
        }
      });
      
      // Add specific needs based on activities
      if (lowMoodActivities.has('work')) mentalHealthNeeds.push('work stress');
      if (lowMoodActivities.has('sleep')) mentalHealthNeeds.push('sleep issues');
      if (lowMoodActivities.has('social')) mentalHealthNeeds.push('social anxiety');
    }
    
    // If no specific needs identified, add general wellness
    if (mentalHealthNeeds.length === 0) {
      mentalHealthNeeds.push('general wellness');
      mentalHealthNeeds.push('mental health');
      severity = 'mild';
      recommendations.basedOn.push('general wellness');
    }
    
    // Fetch recommended resources based on needs
    if (type === 'resources' || type === 'all') {
      // Build query for resources
      const resourceQuery = {
        $or: [
          { tags: { $in: mentalHealthNeeds } },
          { conditions: { $in: mentalHealthNeeds } }
        ]
      };
      
      // Add severity filter
      if (severity === 'mild') {
        resourceQuery.$or.push({ severity: { $in: ['mild', 'all'] } });
      } else if (severity === 'moderate') {
        resourceQuery.$or.push({ severity: { $in: ['moderate', 'all'] } });
      } else {
        // For severe cases, include all resources
      }
      
      // Fetch resources from database
      let recommendedResources = [];
      
      try {
        recommendedResources = await db.collection('resources')
          .find(resourceQuery)
          .limit(limit)
          .toArray();
      } catch (err) {
        console.error('Error fetching resources from database:', err);
        // Fallback to initial resources if database query fails
        const initialResources = await getInitialResources();
        recommendedResources = initialResources
          .filter(resource => {
            const title = resource.title.toLowerCase();
            return mentalHealthNeeds.some(need => title.includes(need.toLowerCase()));
          })
          .slice(0, limit);
      }
      
      recommendations.resources = recommendedResources;
    }
    
    // Fetch recommended doctors based on needs
    if (type === 'doctors' || type === 'all') {
      // Build query for doctors
      const doctorQuery = {
        verified: true,
        $or: [
          { specialty: { $in: getSpecialtiesForNeeds(mentalHealthNeeds) } }
        ]
      };
      
      // Fetch doctors from database
      try {
        const recommendedDoctors = await db.collection('doctors')
          .find(doctorQuery)
          .limit(limit)
          .toArray();
        
        // Fetch user information for each doctor
        const doctorIds = recommendedDoctors.map(doctor => doctor.userId);
        const doctorUsers = await db.collection('users')
          .find({ _id: { $in: doctorIds } })
          .toArray();
        
        // Combine doctor and user information
        const doctorsWithInfo = recommendedDoctors.map(doctor => {
          const doctorUser = doctorUsers.find(user => user._id.equals(doctor.userId));
          return {
            _id: doctor._id,
            name: doctorUser ? doctorUser.name : 'Unknown',
            email: doctorUser ? doctorUser.email : 'Unknown',
            specialty: doctor.specialty,
            credentials: doctor.credentials,
            bio: doctor.bio,
            address: doctor.address,
            phone: doctor.phone
          };
        });
        
        recommendations.doctors = doctorsWithInfo;
      } catch (err) {
        console.error('Error fetching doctors:', err);
        recommendations.doctors = [];
      }
    }
    
    // Track this recommendation request
    await db.collection('userRecommendations').insertOne({
      userId: new ObjectId(user.id),
      mentalHealthNeeds,
      severity,
      timestamp: new Date()
    });
    
    return NextResponse.json({
      recommendations,
      mentalHealthNeeds,
      severity
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}

// Helper function to calculate variance (for mood volatility)
function calculateVariance(values) {
  if (!values || values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squareDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return variance;
}

// Helper function to map mental health needs to doctor specialties
function getSpecialtiesForNeeds(needs) {
  const specialtyMap = {
    'depression': ['Psychiatrist', 'Psychologist', 'Therapist'],
    'anxiety': ['Psychiatrist', 'Psychologist', 'Therapist'],
    'stress': ['Therapist', 'Counselor'],
    'mood management': ['Psychiatrist', 'Psychologist'],
    'mood stability': ['Psychiatrist', 'Psychologist'],
    'low mood': ['Psychiatrist', 'Psychologist', 'Therapist'],
    'suicide risk': ['Psychiatrist', 'Crisis Counselor'],
    'work stress': ['Therapist', 'Counselor'],
    'sleep issues': ['Sleep Specialist', 'Psychiatrist'],
    'social anxiety': ['Psychologist', 'Therapist'],
    'general wellness': ['Therapist', 'Counselor', 'Life Coach'],
    'mental health': ['Psychiatrist', 'Psychologist', 'Therapist']
  };
  
  // Collect all specialties for the given needs
  const specialties = new Set();
  
  needs.forEach(need => {
    const mappedSpecialties = specialtyMap[need] || [];
    mappedSpecialties.forEach(specialty => specialties.add(specialty));
  });
  
  return Array.from(specialties);
}

// Helper function to get initial resources (fallback)
async function getInitialResources() {
  return [
    { id: 1, title: "Understanding Anxiety: A Comprehensive Guide", category: "Article", link: "https://www.nimh.nih.gov/health/topics/anxiety-disorders" },
    { id: 2, title: "Meditation for Beginners", category: "Video", link: "https://www.youtube.com/watch?v=inpok4MKVLM" },
    { id: 3, title: "Stress Management Techniques: Tips and Tools", category: "Article", link: "https://www.helpguide.org/articles/stress/stress-management.htm" },
    { id: 4, title: "Sleep Hygiene Tips", category: "Article", link: "https://www.sleepfoundation.org/sleep-hygiene" },
    { id: 5, title: "Cognitive Behavioral Therapy Explained", category: "Article", link: "https://www.apa.org/ptsd-guideline/patients-and-families/cognitive-behavioral" },
    // Add more resources as needed (truncated for brevity)
  ];
}