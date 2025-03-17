import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/db';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../../lib/auth';

export async function POST(request) {
  try {
    console.log("Received register request");

    const { name, email, password } = await request.json();
    console.log("Parsed request data:", { name, email });

    if (!name || !email || !password) {
      console.log("Missing required fields");
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    if (!client) {
      console.log("MongoDB connection failed");
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const db = client.db();
    const existingUser = await db.collection('users').findOne({ email });

    if (existingUser) {
      console.log("User already exists");
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.collection('users').insertOne({
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const newUser = await db.collection('users').findOne({ _id: result.insertedId });
    if (!newUser) {
      console.log("User creation failed");
      return NextResponse.json(
        { error: 'User registration failed' },
        { status: 500 }
      );
    }

    console.log("User registered:", newUser);

    const token = generateToken(newUser);
    if (!token) {
      console.log("Token generation failed");
      return NextResponse.json(
        { error: 'Failed to generate token' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      },
      message: 'Registration successful'
    });

    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
