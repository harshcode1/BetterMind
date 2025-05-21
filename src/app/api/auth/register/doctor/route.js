import { NextResponse } from 'next/server';
import clientPromise from '../../../../lib/db';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../../../lib/auth';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    const { 
      name, 
      email, 
      password, 
      specialty,
      credentials,
      licenseNumber,
      bio,
      address,
      phone,
      role
    } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate doctor-specific required fields
    if (!specialty || !credentials || !licenseNumber || !phone) {
      return NextResponse.json(
        { error: 'Specialty, credentials, license number, and phone are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password validation - at least 8 characters
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    try {
      const client = await clientPromise;
      const db = client.db();
      
      // Check if user already exists
      const existingUser = await db.collection('users').findOne({ email });
      if (existingUser) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        );
      }

      // Check if doctor with same license number exists
      const existingDoctor = await db.collection('doctors').findOne({ licenseNumber });
      if (existingDoctor) {
        return NextResponse.json(
          { error: 'Doctor with this license number already exists' },
          { status: 400 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user with doctor role
      const userResult = await db.collection('users').insertOne({
        name,
        email,
        password: hashedPassword,
        role: 'doctor',
        verified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Create doctor profile
      const doctorResult = await db.collection('doctors').insertOne({
        userId: userResult.insertedId,
        name,
        email,
        specialty,
        credentials,
        licenseNumber,
        bio: bio || '',
        address: address || '',
        phone,
        workingHours: {
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '17:00' }
        },
        reviews: [],
        averageRating: 0,
        verified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Get the created user
      const newUser = await db.collection('users').findOne({ _id: userResult.insertedId });
      if (!newUser) {
        return NextResponse.json(
          { error: 'Doctor registration failed' },
          { status: 500 }
        );
      }

      // TODO: Send verification email to admin
      // This would be implemented with an email service like SendGrid or Nodemailer
      console.log(`New doctor registration: ${name} (${email}). Verification pending.`);

      // Generate token
      const token = generateToken(newUser);

      // Create response
      const response = NextResponse.json({
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          verified: newUser.verified
        },
        message: 'Doctor registration successful. Verification pending.'
      });

      // Set cookie
      response.cookies.set({
        name: 'token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/'
      });

      return response;
    } catch (dbError) {
      console.error('Database error during doctor registration:', dbError);
      return NextResponse.json(
        { error: 'Service unavailable. Please try again later.' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Doctor registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}