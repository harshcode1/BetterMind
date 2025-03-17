// app/api/user/profile/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import clientPromise from "../../../lib/db";
import { verifyAuth } from "../../../lib/auth";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

// Get user profile
export async function GET(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(auth.user.id) });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      dateOfBirth: user.dateOfBirth || null,
      gender: user.gender || null,
      phone: user.phone || null,
      address: user.address || null,
      emergencyContact: user.emergencyContact || null,
      medicalHistory: user.medicalHistory || [],
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PUT(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { name, dateOfBirth, gender, phone, address, emergencyContact } =
      await request.json();

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(auth.user.id) },
      {
        $set: {
          ...(name && { name }),
          ...(dateOfBirth && { dateOfBirth }),
          ...(gender && { gender }),
          ...(phone && { phone }),
          ...(address && { address }),
          ...(emergencyContact && { emergencyContact }),
          updatedAt: new Date(),
        },
      }
    );

    // app/api/user/profile/route.js (continued)
    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
