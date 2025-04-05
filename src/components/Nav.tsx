"use client";
import Link from "next/link";

export default function Nav() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold">
                Vetify
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/sign-in"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-md text-sm font-medium"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 