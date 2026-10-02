"use client";
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem('token'));
    setIsAdmin(localStorage.getItem('role') === 'ADMIN');
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setIsAuthenticated(false);
    setIsAdmin(false);
    router.push('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
              Rent<span className="text-blue-600">X</span>
            </Link>
            <div className="hidden md:flex gap-6">
              <Link href="/items" className={`text-sm font-medium transition-colors ${pathname === '/items' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
                Browse
              </Link>
              {isAuthenticated && (
                <Link href="/dashboard" className={`text-sm font-medium transition-colors ${pathname === '/dashboard' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
                  Dashboard
                </Link>
              )}
              {isAdmin && (
                <Link href="/admin" className={`text-sm font-medium transition-colors ${pathname === '/admin' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
                  Admin
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/items/new" className="text-sm font-medium text-gray-700 hover:text-gray-900 hidden md:block">
              List an Item
            </Link>
            {isAuthenticated ? (
              <button onClick={handleLogout} className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors">
                Log out
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                  Log in
                </Link>
                <Link href="/signup" className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
