// app/api/resources/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { verifyAuth } from '../../lib/authServer';
import clientPromise from '../../lib/db';
import { ObjectId } from 'mongodb';

// GET endpoint to fetch personalized resources
export async function GET(request) {
  try {
    // Verify authentication (optional - we'll still return resources for non-authenticated users)
    const { authenticated, user } = await verifyAuth();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const skip = (page - 1) * limit;
    
    // Connect to database
    const client = await clientPromise;
    const db = client.db();
    
    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      query.category = category;
    }
    
    // Fetch resources from database or use initial data if collection is empty
    let resources = [];
    const resourcesCollection = db.collection('resources');
    
    // Check if resources collection exists and has data
    const collectionExists = await resourcesCollection.countDocuments() > 0;
    
    if (collectionExists) {
      // Fetch from database with pagination
      resources = await resourcesCollection
        .find(query)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      
      // Get total count for pagination
      const total = await resourcesCollection.countDocuments(query);
      
      // If authenticated, track user's resource views
      if (authenticated && user) {
        await db.collection('userResourceViews').updateOne(
          { userId: new ObjectId(user.id) },
          { 
            $inc: { viewCount: 1 },
            $set: { lastViewed: new Date() }
          },
          { upsert: true }
        );
      }
      
      return NextResponse.json({ 
        resources,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } else {
      // Use initial data (for development/testing)
      const initialResources = await getInitialResources();
      
      // Filter based on search and category
      let filteredResources = initialResources;
      
      if (search) {
        const searchLower = search.toLowerCase();
        filteredResources = filteredResources.filter(resource => 
          resource.title.toLowerCase().includes(searchLower) || 
          resource.category.toLowerCase().includes(searchLower)
        );
      }
      
      if (category) {
        filteredResources = filteredResources.filter(resource => 
          resource.category === category
        );
      }
      
      // Apply pagination
      const paginatedResources = filteredResources.slice(skip, skip + limit);
      const total = filteredResources.length;
      
      return NextResponse.json({ 
        resources: paginatedResources,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    }
  } catch (error) {
    console.error('Error fetching resources:', error);
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}

// POST endpoint to seed initial resources (admin only)
export async function POST(request) {
  try {
    // Verify authentication and admin role
    const { authenticated, user, error } = await verifyAuth();
    
    if (!authenticated) {
      return NextResponse.json({ error: error || 'Not authenticated' }, { status: 401 });
    }
    
    // Check if user is an admin
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }
    
    // Connect to database
    const client = await clientPromise;
    const db = client.db();
    
    // Get initial resources
    const initialResources = await getInitialResources();
    
    // Add tags and conditions to resources
    const enhancedResources = initialResources.map(resource => {
      // Extract tags from title
      const titleWords = resource.title.toLowerCase().split(' ');
      const tags = [];
      
      // Common mental health conditions to tag
      const conditions = [
        'anxiety', 'depression', 'stress', 'ptsd', 'ocd', 'bipolar', 
        'schizophrenia', 'eating disorder', 'adhd', 'addiction', 'trauma',
        'grief', 'panic', 'phobia', 'insomnia', 'burnout'
      ];
      
      // Common therapeutic approaches to tag
      const approaches = [
        'cbt', 'cognitive behavioral', 'mindfulness', 'meditation', 
        'therapy', 'self-care', 'exercise', 'nutrition', 'sleep',
        'yoga', 'art therapy', 'journaling', 'support group'
      ];
      
      // Check for conditions in title
      conditions.forEach(condition => {
        if (resource.title.toLowerCase().includes(condition)) {
          tags.push(condition);
        }
      });
      
      // Check for approaches in title
      approaches.forEach(approach => {
        if (resource.title.toLowerCase().includes(approach)) {
          tags.push(approach);
        }
      });
      
      // Add category as a tag
      tags.push(resource.category.toLowerCase());
      
      // Add severity level (for demonstration - in a real app this would be more sophisticated)
      let severity = 'all';
      if (resource.title.toLowerCase().includes('managing') || 
          resource.title.toLowerCase().includes('coping')) {
        severity = 'moderate';
      } else if (resource.title.toLowerCase().includes('understanding') || 
                resource.title.toLowerCase().includes('introduction')) {
        severity = 'mild';
      }
      
      return {
        ...resource,
        tags: [...new Set(tags)], // Remove duplicates
        conditions: tags.filter(tag => conditions.includes(tag)),
        approaches: tags.filter(tag => approaches.includes(tag)),
        severity,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });
    
    // Insert resources into database
    const result = await db.collection('resources').insertMany(enhancedResources);
    
    return NextResponse.json({ 
      success: true, 
      message: `${result.insertedCount} resources seeded successfully` 
    });
  } catch (error) {
    console.error('Error seeding resources:', error);
    return NextResponse.json({ error: 'Failed to seed resources' }, { status: 500 });
  }
}

// Helper function to get initial resources
async function getInitialResources() {
  return [
    { id: 1, title: "Understanding Anxiety: A Comprehensive Guide", category: "Article", link: "https://www.nimh.nih.gov/health/topics/anxiety-disorders" },
    { id: 2, title: "Meditation for Beginners", category: "Video", link: "https://www.youtube.com/watch?v=inpok4MKVLM" },
    { id: 3, title: "Stress Management Techniques: Tips and Tools", category: "Article", link: "https://www.helpguide.org/articles/stress/stress-management.htm" },
    { id: 4, title: "Sleep Hygiene Tips", category: "Article", link: "https://www.sleepfoundation.org/sleep-hygiene" },
    { id: 5, title: "Cognitive Behavioral Therapy Explained", category: "Article", link: "https://www.apa.org/ptsd-guideline/patients-and-families/cognitive-behavioral" },
    { id: 6, title: "Mood Tracker App Review", category: "Tool", link: "https://www.verywellmind.com/best-mood-tracking-apps-4177953" },
    { id: 7, title: "Mindfulness Meditation", category: "Video", link: "https://www.youtube.com/watch?v=6p_yaNFSYao" },
    { id: 8, title: "Mental Health America Resources", category: "Article", link: "https://www.mhanational.org" },
    { id: 9, title: "Anxiety and Depression Association of America", category: "Article", link: "https://adaa.org" },
    { id: 10, title: "Mental Health First Aid", category: "Tool", link: "https://www.mentalhealthfirstaid.org" },
    
    { id: 11, title: "Self-care Practices for Mental Health", category: "Article", link: "https://psychcentral.com/health/self-care" },
    { id: 12, title: "7 Tips for Better Mental Health", category: "Article", link: "https://www.verywellmind.com/tips-for-better-mental-health-3144881" },
    { id: 13, title: "Yoga for Mental Health", category: "Video", link: "https://www.youtube.com/watch?v=v7AYKMP6rOE" },
    { id: 14, title: "Art Therapy Explained", category: "Article", link: "https://www.healthline.com/health/art-therapy" },
    { id: 15, title: "Understanding Depression", category: "Article", link: "https://www.webmd.com/depression/guide/what-is-depression" },
    { id: 16, title: "Stress Relief Techniques", category: "Video", link: "https://www.youtube.com/watch?v=HJG2tTIxEfk" }, // Fixed dead link
    { id: 17, title: "Mental Health Toolkit", category: "Tool", link: "https://www.samhsa.gov" },
    { id: 18, title: "Mindfulness and Meditation", category: "Article", link: "https://www.mindful.org" },
    { id: 19, title: "Coping with Grief", category: "Article", link: "https://www.helpguide.org/articles/grief/coping-with-grief-and-loss.htm" }, // Fixed dead link
    { id: 20, title: "Managing Panic Attacks", category: "Article", link: "https://www.health.harvard.edu/mind-and-mood/what-to-do-when-youre-in-the-grip-of-a-panic-attack" },
    
    { id: 21, title: "Trauma Recovery Resources", category: "Article", link: "https://www.nctsn.org" },
    { id: 22, title: "Building Resilience", category: "Article", link: "https://www.apa.org/topics/resilience" },
    { id: 23, title: "Understanding PTSD", category: "Article", link: "https://www.ptsd.va.gov" },
    { id: 24, title: "Self-help Techniques for Anxiety", category: "Article", link: "https://www.verywellmind.com/self-help-strategies-for-anxiety-disorders-2584268" }, // Fixed dead link
    { id: 25, title: "Understanding Bipolar Disorder", category: "Article", link: "https://www.nimh.nih.gov/health/topics/bipolar-disorder" }, // Fixed dead link
    { id: 26, title: "Managing OCD", category: "Article", link: "https://iocdf.org" },
    { id: 27, title: "Understanding Schizophrenia", category: "Article", link: "https://www.nami.org/About-Mental-Illness/Mental-Health-Conditions/Schizophrenia" },
    { id: 28, title: "Mindfulness for Kids", category: "Article", link: "https://www.mindful.org/mindfulness-for-kids" }, // Fixed dead link
    { id: 29, title: "Coping with Burnout", category: "Article", link: "https://hbr.org/2016/11/beating-burnout" }, // Fixed dead link
    { id: 30, title: "Online Therapy Platforms", category: "Tool", link: "https://www.betterhelp.com" },
    
    { id: 31, title: "Managing Social Anxiety", category: "Article", link: "https://adaa.org/understanding-anxiety/social-anxiety-disorder" },
    { id: 32, title: "Virtual Reality Therapy", category: "Article", link: "https://www.medicalnewstoday.com/articles/virtual-reality-therapy" },
    { id: 33, title: "Understanding Eating Disorders", category: "Article", link: "https://www.nationaleatingdisorders.org" },
    { id: 34, title: "Meditation for Sleep", category: "Video", link: "https://www.youtube.com/watch?v=aEqlQvczMJQ" }, // Fixed duplicate link
    { id: 35, title: "Yoga and Mental Wellness", category: "Article", link: "https://www.yogajournal.com/lifestyle/health/yoga-for-mental-health" }, // Fixed dead link
    { id: 36, title: "Stress Reduction Techniques", category: "Video", link: "https://www.youtube.com/watch?v=O-6f5wQXSu8" },
    { id: 37, title: "Mindfulness Meditation for Anxiety", category: "Article", link: "https://www.mindful.org/mindfulness-meditation-anxiety" }, // Fixed dead link
    { id: 38, title: "Mental Health Podcasts", category: "Tool", link: "https://www.healthline.com/health/mental-health/mental-health-podcasts" }, // Fixed dead link
    { id: 39, title: "Therapy Apps Comparison", category: "Tool", link: "https://www.techradar.com/best/best-therapy-apps" }, // Fixed dead link
    { id: 40, title: "Understanding Self-harm", category: "Article", link: "https://www.mind.org.uk/information-support/types-of-mental-health-problems/self-harm" }, // Fixed dead link
    
    { id: 41, title: "Teen Mental Health Resources", category: "Article", link: "https://www.teenmentalhealth.org" },
    { id: 42, title: "Mental Health in the Workplace", category: "Article", link: "https://www.mindtools.com/pages/article/mental-health-workplace.htm" }, // Fixed dead link
    { id: 43, title: "Coping with Anxiety in the Digital Age", category: "Article", link: "https://www.apa.org/topics/anxiety/digital-age" }, // Fixed dead link
    { id: 44, title: "Integrative Approaches to Mental Health", category: "Article", link: "https://www.medicalnewstoday.com/articles/integrative-medicine-mental-health" }, // Fixed dead link
    { id: 45, title: "The Science of Happiness", category: "Article", link: "https://www.happify.com/hd/the-science-of-happiness" }, // Fixed dead link
    { id: 46, title: "Psychology Today: Mental Health", category: "Article", link: "https://www.psychologytoday.com/us/basics/mental-health" }, // Fixed dead link
    { id: 47, title: "Benefits of Journaling", category: "Article", link: "https://www.healthline.com/health/benefits-of-journaling" },
    { id: 48, title: "Mental Health Documentaries", category: "Video", link: "https://www.pbs.org/show/mysteries-mental-illness" }, // Fixed dead link
    { id: 49, title: "Understanding Therapy Modalities", category: "Article", link: "https://www.goodtherapy.org/learn-about-therapy" }, // Fixed dead link
    { id: 50, title: "Cognitive Behavioral Therapy Videos", category: "Video", link: "https://www.youtube.com/watch?v=2d--YgFA8xw" },
    
    { id: 51, title: "The Power of Positive Thinking", category: "Article", link: "https://www.success.com/the-power-of-positive-thinking" },
    { id: 52, title: "Online Support Groups for Mental Health", category: "Tool", link: "https://www.healthline.com/health/mental-health/online-support-groups" }, // Fixed dead link
    { id: 53, title: "Mental Health and Nutrition", category: "Article", link: "https://www.medicalnewstoday.com/articles/mental-health-diet" },
    { id: 54, title: "Relaxation Techniques for Stress Relief", category: "Video", link: "https://www.youtube.com/watch?v=MIr3RsUWrdo" },
    { id: 55, title: "Understanding Mental Illness Stigma", category: "Article", link: "https://www.nami.org/About-NAMI/NAMI-News/2021/NAMI-s-Statement-On-Recent-Racist-Incidents-and-Mental-Health-Resources-for-African-Americans" }, // Fixed dead link
    { id: 56, title: "Self-help Books for Mental Health", category: "Article", link: "https://www.goodreads.com/shelf/show/mental-health-self-help" }, // Fixed dead link
    { id: 57, title: "Virtual Mental Health Clinics", category: "Tool", link: "https://www.teladoc.com/therapy" }, // Fixed dead link
    { id: 58, title: "Online Cognitive Behavioral Therapy", category: "Tool", link: "https://www.nhs.uk/mental-health/talking-therapies-medicine-treatments/talking-therapies-and-counselling/cognitive-behavioural-therapy-cbt/overview" }, // Fixed dead link
    { id: 59, title: "Digital Detox Tips", category: "Article", link: "https://www.healthline.com/nutrition/digital-detox" },
    { id: 60, title: "How to Practice Mindfulness Daily", category: "Article", link: "https://www.mindful.org/how-to-practice-mindfulness" }, // Fixed dead link
    
    { id: 61, title: "The Role of Exercise in Mental Health", category: "Article", link: "https://www.verywellfit.com/exercise-and-mental-health-4157062" },
    { id: 62, title: "The Benefits of Nature for Mental Health", category: "Article", link: "https://www.apa.org/monitor/2020/04/nurtured-nature" }, // Fixed dead link
    { id: 63, title: "Managing Stress with Art Therapy", category: "Article", link: "https://www.goodtherapy.org/learn-about-therapy/types/art-therapy" }, // Fixed dead link
    { id: 64, title: "Mental Health Benefits of Pets", category: "Article", link: "https://www.apa.org/news/press/releases/2011/07/pets-stress" }, // Fixed dead link
    { id: 65, title: "Understanding Self-compassion", category: "Article", link: "https://self-compassion.org" },
    { id: 66, title: "Mindfulness-Based Stress Reduction", category: "Article", link: "https://www.umassmed.edu/cfm/mindfulness-based-programs/mbsr-courses" }, // Fixed dead link
    { id: 67, title: "Coping with Loneliness", category: "Article", link: "https://www.health.harvard.edu/mind-and-mood/how-to-overcome-loneliness" }, // Fixed dead link
    { id: 68, title: "Managing Work Stress", category: "Article", link: "https://www.apa.org/topics/healthy-workplaces/work-stress" }, // Fixed dead link
    { id: 69, title: "Depression and Mental Health", category: "Article", link: "https://www.who.int/news-room/fact-sheets/detail/depression" },
    { id: 70, title: "Understanding Seasonal Affective Disorder", category: "Article", link: "https://www.mayoclinic.org/diseases-conditions/seasonal-affective-disorder/symptoms-causes/syc-20364651" },
    
    { id: 71, title: "Effective Stress Management Strategies", category: "Article", link: "https://www.mentalhealth.org.uk/explore-mental-health/a-z-topics/stress" }, // Fixed dead link
    { id: 72, title: "Understanding Mental Health in Minorities", category: "Article", link: "https://www.nami.org/Your-Journey/Identity-and-Cultural-Dimensions/Black-African-American" }, // Fixed dead link
    { id: 73, title: "Adolescent Mental Health Resources", category: "Article", link: "https://www.childmind.org/topics/teenagers" }, // Fixed dead link
    { id: 74, title: "The Impact of Social Media on Mental Health", category: "Article", link: "https://www.apa.org/topics/social-media-internet/technology-use-health" }, // Fixed dead link
    { id: 75, title: "Mindful Eating for Mental Health", category: "Article", link: "https://www.eatright.org/health/wellness/mindful-eating" }, // Fixed dead link
    { id: 76, title: "Meditation Techniques for Stress Relief", category: "Video", link: "https://www.youtube.com/watch?v=krBvzDlL0mM" }, // Fixed duplicate link
    { id: 77, title: "Understanding Mental Health Disorders", category: "Article", link: "https://www.nimh.nih.gov/health/statistics/mental-illness" },
    { id: 78, title: "Holistic Approaches to Mental Wellness", category: "Article", link: "https://www.medicalnewstoday.com/articles/holistic-health" },
    { id: 79, title: "Digital Mental Health Tools", category: "Tool", link: "https://www.psychiatry.org/patients-families/digital-mental-health-tools" }, // Fixed dead link
    { id: 80, title: "Online CBT Resources", category: "Tool", link: "https://www.verywellmind.com/best-online-cbt-therapy-4691256" }, // Fixed dead link
    
    { id: 81, title: "Mental Health Policy and Advocacy", category: "Article", link: "https://www.mentalhealth.gov" },
    { id: 82, title: "Virtual Support for Anxiety and Depression", category: "Tool", link: "https://www.7cups.com" },
    { id: 83, title: "Effective Techniques for Mindfulness Meditation", category: "Article", link: "https://www.mindful.org/meditation/mindfulness-getting-started" }, // Fixed dead link
    { id: 84, title: "Mental Health Webinars and Workshops", category: "Tool", link: "https://www.eventbrite.com/d/online/mental-health" }, // Fixed dead link
    { id: 85, title: "Understanding Emotional Wellness", category: "Article", link: "https://www.psychcentral.com/health/emotional-wellness" }, // Fixed dead link
    { id: 86, title: "Managing Anxiety: Tips from Experts", category: "Article", link: "https://www.medicalnewstoday.com/articles/323454" }, // Fixed dead link
    { id: 87, title: "Mental Health Online Communities", category: "Tool", link: "https://www.reddit.com/r/mentalhealth" }, // Fixed dead link
    { id: 88, title: "Self-Care Strategies for Busy Professionals", category: "Article", link: "https://www.forbes.com/health/mind/self-care-tips-busy-professionals" }, // Fixed dead link
    { id: 89, title: "Art and Mental Health", category: "Article", link: "https://www.tate.org.uk/art/art-terms/a/art-therapy" }, // Fixed dead link
    { id: 90, title: "The Role of Genetics in Mental Health", category: "Article", link: "https://www.genome.gov/health/Genomics-and-Medicine/Mental-Health" }, // Fixed dead link
    
    { id: 91, title: "Digital Tools for Stress Management", category: "Tool", link: "https://www.headspace.com" },
    { id: 92, title: "Mental Health Research and Innovations", category: "Article", link: "https://www.nimh.nih.gov/research" },
    { id: 93, title: "Virtual Reality in Mental Health Treatment", category: "Article", link: "https://www.technologyreview.com/2021/12/06/1041345/mental-health-care-metaverse" }, // Fixed dead link
    { id: 94, title: "Mental Health Resources for Veterans", category: "Article", link: "https://www.ptsd.va.gov" },
    { id: 95, title: "Understanding Anxiety Disorders", category: "Article", link: "https://www.adaa.org/understanding-anxiety" },
    { id: 96, title: "Mindfulness and Mental Health", category: "Article", link: "https://www.mindful.org/mindfulness-mental-health" }, // Fixed dead link
    { id: 97, title: "Stress Reduction through Breathing Exercises", category: "Video", link: "https://www.youtube.com/watch?v=MIr3RsUWrdo" },
    { id: 98, title: "Comprehensive Guide to Mental Health Apps", category: "Tool", link: "https://www.healthline.com/health/mental-health/mental-health-apps" }, // Fixed dead link
    { id: 99, title: "Online Mental Health Courses", category: "Tool", link: "https://www.coursera.org/collections/mental-health-wellness" }, // Fixed dead link
    { id: 100, title: "Mental Health Statistics and Reports", category: "Article", link: "https://www.who.int/health-topics/mental-health" }, // Fixed dead link
    { id: 101, title: "Resources for Building Emotional Resilience", category: "Article", link: "https://www.psychologytoday.com/us/basics/resilience" },
    { id: 102, title: "Mindfulness for Stress Management", category: "Article", link: "https://www.mindful.org/mindfulness-for-stress-relief" } // Fixed dead link
  ];
}