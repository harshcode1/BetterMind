// app/api/dashboard/export/route.js
import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/db';
import { verifyAuth } from '../../../lib/authServer';
import { ObjectId } from 'mongodb';

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    const auth = await verifyAuth(token);
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';
    const days = parseInt(url.searchParams.get('days') || '30');
    
    // Calculate start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const client = await clientPromise;
    const db = client.db();
    
    // Fetch mood data
    const moods = await db.collection('moods')
      .find({
        userId: new ObjectId(auth.user.id),
        createdAt: { $gte: startDate }
      })
      .sort({ createdAt: 1 })
      .toArray();
    
    // Fetch assessment data
    const assessments = await db.collection('assessments')
      .find({
        userId: new ObjectId(auth.user.id),
        createdAt: { $gte: startDate }
      })
      .sort({ createdAt: 1 })
      .toArray();
    
    // Format data based on requested format
    if (format === 'json') {
      return formatJsonResponse(moods, assessments, auth.user);
    } else if (format === 'csv') {
      return formatCsvResponse(moods, assessments, auth.user);
    } else {
      return NextResponse.json(
        { error: 'Unsupported format' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Export data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Format data as JSON
function formatJsonResponse(moods, assessments, user) {
  const data = {
    exportDate: new Date().toISOString(),
    user: {
      id: user.id,
      name: user.name || 'User',
      email: user.email
    },
    summary: {
      moodEntries: moods.length,
      assessmentEntries: assessments.length,
      averageMood: moods.length > 0 
        ? (moods.reduce((sum, mood) => sum + mood.mood, 0) / moods.length).toFixed(2) 
        : null,
      latestPhq9Score: assessments.length > 0 ? assessments[assessments.length - 1].phq9Score : null,
      latestGad7Score: assessments.length > 0 ? assessments[assessments.length - 1].gad7Score : null
    },
    moods: moods.map(mood => ({
      date: mood.createdAt,
      value: mood.mood,
      activities: mood.activities || [],
      notes: mood.notes || ''
    })),
    assessments: assessments.map(assessment => ({
      date: assessment.createdAt || assessment.date,
      phq9Score: assessment.phq9Score,
      phq9Severity: assessment.depressionSeverity,
      gad7Score: assessment.gad7Score,
      gad7Severity: assessment.anxietySeverity
    }))
  };
  
  // Calculate activity statistics if mood data exists
  if (moods.length > 0) {
    const activityStats = {};
    let totalMoodWithActivities = 0;
    
    moods.forEach(mood => {
      if (mood.activities && mood.activities.length > 0) {
        mood.activities.forEach(activity => {
          if (!activityStats[activity]) {
            activityStats[activity] = {
              count: 0,
              moodSum: 0
            };
          }
          
          activityStats[activity].count++;
          activityStats[activity].moodSum += mood.mood;
        });
        totalMoodWithActivities++;
      }
    });
    
    // Convert to array and calculate averages
    data.activityImpact = Object.entries(activityStats)
      .map(([activity, stats]) => ({
        activity,
        frequency: stats.count,
        averageMood: (stats.moodSum / stats.count).toFixed(2)
      }))
      .sort((a, b) => b.averageMood - a.averageMood);
  }
  
  return NextResponse.json(data);
}

// Format data as CSV
function formatCsvResponse(moods, assessments, user) {
  // Generate CSV content
  let csvContent = '';
  
  // Add metadata
  csvContent += 'BetterMind Mental Health Report\n';
  csvContent += `Export Date,${new Date().toISOString()}\n`;
  csvContent += `User,${user.name || 'User'}\n`;
  csvContent += `Email,${user.email}\n\n`;
  
  // Add summary
  csvContent += 'SUMMARY\n';
  csvContent += `Mood Entries,${moods.length}\n`;
  csvContent += `Assessment Entries,${assessments.length}\n`;
  
  if (moods.length > 0) {
    const avgMood = (moods.reduce((sum, mood) => sum + mood.mood, 0) / moods.length).toFixed(2);
    csvContent += `Average Mood,${avgMood}\n`;
  }
  
  if (assessments.length > 0) {
    const latestAssessment = assessments[assessments.length - 1];
    csvContent += `Latest PHQ-9 Score,${latestAssessment.phq9Score}\n`;
    csvContent += `Latest PHQ-9 Severity,${latestAssessment.depressionSeverity}\n`;
    csvContent += `Latest GAD-7 Score,${latestAssessment.gad7Score}\n`;
    csvContent += `Latest GAD-7 Severity,${latestAssessment.anxietySeverity}\n`;
  }
  
  csvContent += '\n';
  
  // Add mood data
  if (moods.length > 0) {
    csvContent += 'MOOD ENTRIES\n';
    csvContent += 'Date,Mood Value,Activities,Notes\n';
    
    moods.forEach(mood => {
      const date = new Date(mood.createdAt).toISOString();
      const activities = mood.activities ? mood.activities.join('; ') : '';
      const notes = mood.notes ? mood.notes.replace(/,/g, ';').replace(/\n/g, ' ') : '';
      
      csvContent += `${date},${mood.mood},"${activities}","${notes}"\n`;
    });
    
    csvContent += '\n';
  }
  
  // Add assessment data
  if (assessments.length > 0) {
    csvContent += 'ASSESSMENT ENTRIES\n';
    csvContent += 'Date,PHQ-9 Score,Depression Severity,GAD-7 Score,Anxiety Severity\n';
    
    assessments.forEach(assessment => {
      const date = new Date(assessment.createdAt || assessment.date).toISOString();
      
      csvContent += `${date},${assessment.phq9Score},${assessment.depressionSeverity},${assessment.gad7Score},${assessment.anxietySeverity}\n`;
    });
    
    csvContent += '\n';
  }
  
  // Add activity impact data
  if (moods.length > 0) {
    const activityStats = {};
    
    moods.forEach(mood => {
      if (mood.activities && mood.activities.length > 0) {
        mood.activities.forEach(activity => {
          if (!activityStats[activity]) {
            activityStats[activity] = {
              count: 0,
              moodSum: 0
            };
          }
          
          activityStats[activity].count++;
          activityStats[activity].moodSum += mood.mood;
        });
      }
    });
    
    if (Object.keys(activityStats).length > 0) {
      csvContent += 'ACTIVITY IMPACT\n';
      csvContent += 'Activity,Frequency,Average Mood\n';
      
      Object.entries(activityStats)
        .map(([activity, stats]) => ({
          activity,
          frequency: stats.count,
          averageMood: (stats.moodSum / stats.count).toFixed(2)
        }))
        .sort((a, b) => b.averageMood - a.averageMood)
        .forEach(item => {
          csvContent += `${item.activity},${item.frequency},${item.averageMood}\n`;
        });
    }
  }
  
  // Return CSV response
  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="bettermind_report_${new Date().toISOString().split('T')[0]}.csv"`
    }
  });
}