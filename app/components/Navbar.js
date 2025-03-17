import Link from 'next/link';
import Image from 'next/image';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/">
              <Image src="/images/logo.png" alt="Logo" width={40} height={40} />
            </Link>
            <span className="ml-2 text-xl font-semibold text-gray-800">Mental Health Assistant</span>
          </div>
          <div className="flex items-center">
            <Link href="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Home</Link>
            <Link href="/chat" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Chat</Link>
            <Link href="/resources" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Resources</Link>
            <Link href="/doctors" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Doctors</Link>
            <Link href="/appointments" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Appointments</Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;