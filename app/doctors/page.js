'use client';
import { useState } from 'react';

const doctorsData = [
  {
    id: 1,
    name: "Dr. Narendra",
    specialty: "Psychiatrist",
    location: "New Delhi",
    price: "2000 per session",
    availability: "Mon, Wed, Fri",
    bio: "Dr. Narendra specializes in anxiety and depression treatment with 10 years of experience."
  },
  {
    id: 2,
    name: "Dr. John",
    specialty: "Clinical Psychologist",
    location: "Mumbai",
    price: "1500 per session",
    availability: "Tue, Thu, Sat",
    bio: "Dr. John focuses on cognitive behavioral therapy and has been practicing for 15 years."
  },
];

export default function DoctorsPage() {
  const [expandedDoctor, setExpandedDoctor] = useState(null);

  const toggleExpand = (id) => {
    setExpandedDoctor(expandedDoctor === id ? null : id);
  };

  return (
    <div className="max-w-7xl mx-auto text-black px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-center mb-8">Our Mental Health Professionals</h1>
      
      <div className="space-y-6">
        {doctorsData.map((doctor) => (
          <div key={doctor.id} className="bg-white shadow-md rounded-lg overflow-hidden">
            <div 
              className="p-6 cursor-pointer"
              onClick={() => toggleExpand(doctor.id)}
            >
              <h2 className="text-xl font-semibold">{doctor.name}</h2>
              <p className="text-gray-600">{doctor.specialty}</p>
            </div>
            {expandedDoctor === doctor.id && (
              <div className="px-6 pb-6">
                <p><strong>Location:</strong> {doctor.location}</p>
                <p><strong>Price:</strong> {doctor.price}</p>
                <p><strong>Availability:</strong> {doctor.availability}</p>
                <p className="mt-2">{doctor.bio}</p>
                <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                  Book Appointment
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}