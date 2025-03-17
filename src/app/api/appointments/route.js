// app/api/appointments/route.js
import { NextResponse } from "next/server";
import { verifyAuth } from "../../lib/auth";
import clientPromise from "../../lib/db";
import { ObjectId } from "mongodb";

// Create appointment
export async function POST(request) {
  try {
    const { doctorId, date, time, reason } = await request.json();
    const auth = await verifyAuth(request);

    if (!auth.authenticated) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!doctorId || !date || !time) {
      return NextResponse.json(
        { error: "Doctor ID, date, and time are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Validate that the doctor exists
    const doctor = await db
      .collection("doctors")
      .findOne({ _id: new ObjectId(doctorId) });
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Check if slot is available
    const existingAppointment = await db.collection("appointments").findOne({
      doctorId: new ObjectId(doctorId),
      date,
      time,
      status: { $ne: "cancelled" },
    });

    if (existingAppointment) {
      return NextResponse.json(
        { error: "This time slot is already booked" },
        { status: 400 }
      );
    }

    // app/api/appointments/route.js - Add validation
    if (new Date(appointmentData.date) < new Date()) {
      return NextResponse.json(
        { error: "Cannot book appointments in the past" },
        { status: 400 }
      );
    }

    // Create the appointment
    const result = await db.collection("appointments").insertOne({
      userId: new ObjectId(auth.user.id),
      doctorId: new ObjectId(doctorId),
      date,
      time,
      reason,
      status: "scheduled",
      createdAt: new Date(),
    });

    return NextResponse.json({
      id: result.insertedId,
      message: "Appointment scheduled successfully",
    });
  } catch (error) {
    console.error("Create appointment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get user appointments
export async function GET(request) {
  try {
    const auth = await verifyAuth(request);

    if (!auth.authenticated) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Get user's appointments with doctor details
    const appointments = await db
      .collection("appointments")
      .aggregate([
        {
          $match: {
            userId: new ObjectId(auth.user.id),
          },
        },
        {
          $lookup: {
            from: "doctors",
            localField: "doctorId",
            foreignField: "_id",
            as: "doctor",
          },
        },
        {
          $unwind: "$doctor",
        },
        {
          $sort: { date: 1, time: 1 },
        },
      ])
      .toArray();

    return NextResponse.json({
      appointments: appointments.map((apt) => ({
        id: apt._id.toString(),
        doctor: {
          id: apt.doctor._id.toString(),
          name: apt.doctor.name,
          specialty: apt.doctor.specialty,
        },
        date: apt.date,
        time: apt.time,
        reason: apt.reason,
        status: apt.status,
        createdAt: apt.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get appointments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
