// app/api/chat/route.js
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { verifyAuth } from "../../lib/authServer";
import clientPromise from "../../lib/db";
import { chatLimiter } from "../../lib/rateLimit";
import { getOpenAIClient } from "../../lib/openaiClient";

const SYSTEM_PROMPT = `You are BetterMind, a compassionate mental health support assistant. Your role is to:
- Listen with empathy and validate feelings
- Provide evidence-based coping strategies and psychoeducation
- Recommend appropriate mental health specialists when needed
- Encourage professional help for serious concerns
- Never diagnose conditions or prescribe medication
- Always remind users that you supplement, not replace, professional care

If a user expresses suicidal ideation or self-harm, immediately provide crisis resources:
National Suicide Prevention Lifeline: 988 (call or text)
Crisis Text Line: Text HOME to 741741

Keep responses concise, warm, and actionable. If recommending a specialist, specify which type (Psychiatrist, Psychologist, Therapist, etc.) and why.`;

// Keyword fallback for when OpenAI is not configured
const symptomSpecialistMap = {
  "anxiety": { specialist: "Psychiatrist", resources: ["Anxiety Management Guide", "Meditation Resources"] },
  "depression": { specialist: "Psychiatrist", resources: ["Depression Support Guide", "Mood Tracking Tools"] },
  "stress": { specialist: "Psychologist", resources: ["Stress Management Techniques", "Work-Life Balance Guide"] },
  "insomnia": { specialist: "Sleep Specialist", resources: ["Sleep Hygiene Guide", "Relaxation Techniques"] },
  "mood swings": { specialist: "Psychiatrist", resources: ["Mood Disorder Information", "Emotional Regulation Techniques"] },
  "panic": { specialist: "Psychiatrist", resources: ["Panic Attack Management", "Breathing Exercises"] },
  "headache": { specialist: "Neurologist", resources: ["Headache Triggers Guide", "Pain Management Techniques"] },
  "fatigue": { specialist: "General Physician", resources: ["Energy Management Guide", "Nutrition for Energy"] },
  "pain": { specialist: "Pain Management Specialist", resources: ["Chronic Pain Resources", "Physical Therapy Information"] },
  "dizziness": { specialist: "ENT Specialist", resources: ["Balance Exercises", "Vertigo Information"] },
  "default": { specialist: "General Physician", resources: ["General Health Guidelines", "When to Seek Medical Help"] }
};

async function getAIResponse(message, recentMoods, latestAssessment) {
  const openai = getOpenAIClient();
  if (!openai) return null;

  const contextParts = [];
  if (recentMoods.length > 0) {
    const avgMood = (recentMoods.reduce((s, m) => s + m.mood, 0) / recentMoods.length).toFixed(1);
    contextParts.push(`User's average mood over the last 7 days: ${avgMood}/10`);
  }
  if (latestAssessment) {
    contextParts.push(
      `Latest assessment: PHQ-9 (depression) score ${latestAssessment.phq9Score}/27 (${latestAssessment.depressionSeverity}), ` +
      `GAD-7 (anxiety) score ${latestAssessment.gad7Score}/21 (${latestAssessment.anxietySeverity})`
    );
  }

  const systemWithContext = contextParts.length > 0
    ? `${SYSTEM_PROMPT}\n\nUser context:\n${contextParts.join('\n')}`
    : SYSTEM_PROMPT;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemWithContext },
      { role: 'user', content: message },
    ],
    max_tokens: 500,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content || null;
}

function keywordFallback(message) {
  const lower = message.toLowerCase();
  for (const [symptom, rec] of Object.entries(symptomSpecialistMap)) {
    if (symptom !== 'default' && lower.includes(symptom)) {
      return {
        text: `Based on your mention of ${symptom}, I recommend consulting with a ${rec.specialist}. They specialize in treating conditions related to this symptom.`,
        recommendation: { specialist: rec.specialist, resources: rec.resources },
      };
    }
  }
  const def = symptomSpecialistMap.default;
  return {
    text: "Based on the symptoms you've described, I recommend consulting with a General Physician. They can provide a proper diagnosis and treatment plan.",
    recommendation: { specialist: def.specialist, resources: def.resources },
  };
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const limit = chatLimiter(ip);
    if (limit.limited) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
      );
    }

    const { message } = await request.json();
    const token = request.cookies.get('token')?.value;
    const auth = await verifyAuth(token);

    if (!auth.authenticated) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Store user message
    await db.collection("chatMessages").insertOne({
      userId: auth.user.id,
      content: message,
      sender: "user",
      timestamp: new Date(),
    });

    // Fetch user context for AI
    const [recentMoods, latestAssessment] = await Promise.all([
      db.collection("moods")
        .find({ userId: auth.user.id })
        .sort({ createdAt: -1 })
        .limit(7)
        .toArray(),
      db.collection("assessments")
        .findOne({ userId: auth.user.id }, { sort: { date: -1 } }),
    ]);

    let responseText;
    let recommendation = null;

    const aiText = await getAIResponse(message, recentMoods, latestAssessment).catch(() => null);

    if (aiText) {
      responseText = aiText;
    } else {
      const fallback = keywordFallback(message);
      responseText = fallback.text;
      recommendation = fallback.recommendation;
    }

    // Store bot response
    await db.collection("chatMessages").insertOne({
      userId: auth.user.id,
      content: responseText,
      sender: "bot",
      timestamp: new Date(),
      ...(recommendation && { recommendation }),
    });

    return NextResponse.json({ message: responseText, recommendation });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Get chat history
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
