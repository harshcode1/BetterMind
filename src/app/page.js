import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <section className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
          Your Mental Health Companion
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-900 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Get support, resources, and connect with professionals to improve your mental well-being.
        </p>
        <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
          <div className="rounded-md shadow">
            <Link href="/chat" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10">
              Start Chatting
            </Link>
          </div>
          <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
            <Link href="/resources" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10">
              Explore Resources
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-8">Our Services</h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <ServiceCard
            title="AI Chat Support"
            description="Get instant support and guidance from our AI chatbot, available 24/7."
            link="/chat"
          />
          <ServiceCard
            title="Resource Library"
            description="Access a wealth of articles, best practices, and mental health information."
            link="/resources"
          />
          <ServiceCard
            title="Professional Help"
            description="Connect with licensed therapists for personalized care and support."
            link="/doctors"
          />
        </div>
      </section>
    </div>
  );
}

function ServiceCard({ title, description, link }) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
        <div className="mt-4">
          <Link href={link} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Learn more <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
