// app/api/chat/route.js
import { NextResponse } from "next/server";
import { verifyAuth } from "../../lib/authServer";
import clientPromise from "../../lib/db";

// Simple symptom-to-specialist mapping
const symptomSpecialistMap = {
  // Mental health symptoms
  "anxiety": { specialist: "Psychiatrist", resources: ["Anxiety Management Guide", "Meditation Resources"] },
  "depression": { specialist: "Psychiatrist", resources: ["Depression Support Guide", "Mood Tracking Tools"] },
  "stress": { specialist: "Psychologist", resources: ["Stress Management Techniques", "Work-Life Balance Guide"] },
  "insomnia": { specialist: "Sleep Specialist", resources: ["Sleep Hygiene Guide", "Relaxation Techniques"] },
  "mood swings": { specialist: "Psychiatrist", resources: ["Mood Disorder Information", "Emotional Regulation Techniques"] },
  "panic": { specialist: "Psychiatrist", resources: ["Panic Attack Management", "Breathing Exercises"] },
  
  // Physical symptoms
  "headache": { specialist: "Neurologist", resources: ["Headache Triggers Guide", "Pain Management Techniques"] },
  "fatigue": { specialist: "General Physician", resources: ["Energy Management Guide", "Nutrition for Energy"] },
  "pain": { specialist: "Pain Management Specialist", resources: ["Chronic Pain Resources", "Physical Therapy Information"] },
  "dizziness": { specialist: "ENT Specialist", resources: ["Balance Exercises", "Vertigo Information"] },
  
  // Default response for unrecognized symptoms
  "default": { specialist: "General Physician", resources: ["General Health Guidelines", "When to Seek Medical Help"] }
};

export async function POST(request) {
  try {
    const { message } = await request.json();
    const token = request.cookies.get('token')?.value;
    const auth = await verifyAuth(token);

    if (!auth.authenticated) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Store the user message in the database
    const client = await clientPromise;
    const db = client.db();

    await db.collection("chatMessages").insertOne({
      userId: auth.user.id,
      content: message,
      sender: "user",
      timestamp: new Date(),
    });

    // Process the user's symptoms
    const userMessage = message.toLowerCase();
    let response = {
      specialist: symptomSpecialistMap.default.specialist,
      resources: symptomSpecialistMap.default.resources,
      message: "Based on the symptoms you've described, I recommend consulting with a General Physician. They can provide a proper diagnosis and treatment plan."
    };

    // Check for known symptoms in the user's message
    for (const [symptom, recommendation] of Object.entries(symptomSpecialistMap)) {
      if (symptom !== "default" && userMessage.includes(symptom)) {
        response = {
          specialist: recommendation.specialist,
          resources: recommendation.resources,
          message: `Based on your mention of ${symptom}, I recommend consulting with a ${recommendation.specialist}. They specialize in treating conditions related to this symptom.`
        };
        break;
      }
    }

    // Store the system response in the database
    await db.collection("chatMessages").insertOne({
      userId: auth.user.id,
      content: response.message,
      sender: "bot",
      timestamp: new Date(),
      recommendation: {
        specialist: response.specialist,
        resources: response.resources
      }
    });

    return NextResponse.json({
      message: response.message,
      recommendation: {
        specialist: response.specialist,
        resources: response.resources
      }
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// API route to get chat history
export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    const auth = await verifyAuth(token);

    if (!auth.authenticated) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    const messages = await db
      .collection("chatMessages")
      .find({ userId: auth.user.id })
      .sort({ timestamp: 1 })
      .toArray();

    return NextResponse.json({
      messages: messages.map((msg) => ({
        id: msg._id.toString(),
        text: msg.content,
        sender: msg.sender,
        timestamp: msg.timestamp,
        recommendation: msg.recommendation || null,
      })),
    });
  } catch (error) {
    console.error("Get chat history error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
