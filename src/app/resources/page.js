'use client';
import { useState } from 'react';
import Link from 'next/link';

const initialResources = [
  { id: 1, title: "Understanding Anxiety", category: "Article", link: "#" },
  { id: 2, title: "Meditation for Beginners", category: "Video", link: "#" },
  { id: 3, title: "Stress Management Techniques", category: "Article", link: "#" },
  { id: 4, title: "Sleep Hygiene Tips", category: "Infographic", link: "#" },
  { id: 5, title: "Cognitive Behavioral Therapy Explained", category: "Video", link: "#" },
  { id: 6, title: "Mood Tracker App", category: "Tool", link: "#" },
];

export default function ResourcesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [resources, setResources] = useState(initialResources);

  const handleSearch = (event) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);
    
    const filteredResources = initialResources.filter(resource => 
      resource.title.toLowerCase().includes(term) || 
      resource.category.toLowerCase().includes(term)
    );
    
    setResources(filteredResources);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-black text-center mb-8">Mental Health Resources</h1>
      
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search resources..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full px-4 text-black py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {resources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <div key={resource.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <p className="text-sm font-medium text-blue-600 mb-1">{resource.category}</p>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{resource.title}</h3>
                <Link href={resource.link} className="text-blue-500 hover:underline">
                  Learn more
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600">No resources found matching your search.</p>
      )}
    </div>
  );
}