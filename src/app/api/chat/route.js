// app/api/chat/route.js
import { NextResponse } from "next/server";
import { verifyAuth } from "../../lib/auth";
import clientPromise from "../../lib/db";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { message } = await request.json();
    const auth = await verifyAuth(request);

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

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful mental health assistant. Provide supportive, empathetic responses. Never provide medical diagnoses or treatment recommendations. Always suggest seeking professional help for serious mental health concerns.",
        },
        { role: "user", content: message },
      ],
      max_tokens: 500,
    });

    // app/chat/page.js - Add AI integration
    const handleSend = async () => {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setMessages([...messages, { text: data.message, sender: "bot" }]);
    };

    const aiResponse = completion.choices[0].message.content;

    // Store the AI response in the database
    await db.collection("chatMessages").insertOne({
      userId: auth.user.id,
      content: aiResponse,
      sender: "bot",
      timestamp: new Date(),
    });

    return NextResponse.json({
      message: aiResponse,
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
    const auth = await verifyAuth(request);

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
