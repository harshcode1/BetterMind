// app/api/doctor/profile/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import clientPromise from "../../../lib/db";
import { verifyAuth } from "../../../lib/authServer";
import { ObjectId } from "mongodb";

// Get doctor profile
export async function GET(request) {
  try {
    const { authenticated, user, error } = await verifyAuth();
    if (!authenticated) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is a doctor
    if (user.role !== 'doctor') {
      return NextResponse.json({ error: "Unauthorized. Doctor access required." }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Get the doctor record
    const doctor = await db
      .collection("doctors")
      .findOne({ userId: new ObjectId(user.id) });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
    }

    // Get the user record for basic info
    const userRecord = await db
      .collection("users")
      .findOne({ _id: new ObjectId(user.id) });

    return NextResponse.json({
      id: doctor._id.toString(),
      userId: user.id,
      name: userRecord.name,
      email: userRecord.email,
      specialization: doctor.specialization || "",
      licenseNumber: doctor.licenseNumber || "",
      education: doctor.education || [],
      experience: doctor.experience || [],
      bio: doctor.bio || "",
      verified: userRecord.verified || false,
      verifiedAt: doctor.verifiedAt || null,
      createdAt: doctor.createdAt || null,
      updatedAt: doctor.updatedAt || null
    });
  } catch (error) {
    console.error("Get doctor profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update doctor profile
export async function PUT(request) {
  try {
    const { authenticated, user, error } = await verifyAuth();
    if (!authenticated) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is a doctor
    if (user.role !== 'doctor') {
      return NextResponse.json({ error: "Unauthorized. Doctor access required." }, { status: 403 });
    }

    const { 
      name, 
      specialization, 
      bio, 
      education, 
      experience 
    } = await request.json();

    const client = await clientPromise;
    const db = client.db();

    // Update the doctor record
    const doctorResult = await db.collection("doctors").updateOne(
      { userId: new ObjectId(user.id) },
      {
        $set: {
          ...(specialization && { specialization }),
          ...(bio && { bio }),
          ...(education && { education }),
          ...(experience && { experience }),
          updatedAt: new Date(),
        },
      }
    );

    // Update the user name if provided
    if (name) {
      await db.collection("users").updateOne(
        { _id: new ObjectId(user.id) },
        {
          $set: {
            name,
            updatedAt: new Date(),
          },
        }
      );
    }

    if (doctorResult.modifiedCount === 0 && !name) {
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update doctor profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}