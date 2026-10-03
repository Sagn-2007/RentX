"use client";
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MenuIcon, XIcon } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <nav className="bg-background/80 backdrop-blur-md border-b border-text-secondary/10 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex justify-between h-20">
          <div className="flex items-center gap-12">
            <Link href="/" className="text-2xl font-serif font-medium tracking-tight text-text-primary">
              Rent<span className="text-brand-600 italic">X</span>
            </Link>
            <div className="hidden md:flex gap-8">
              <Link href="/items" className={`text-sm font-medium transition-colors ${pathname === '/items' ? 'text-brand-600' : 'text-text-secondary hover:text-text-primary'}`}>
                Browse
              </Link>
              {isAuthenticated && (
                <Link href="/dashboard" className={`text-sm font-medium transition-colors ${pathname === '/dashboard' ? 'text-brand-600' : 'text-text-secondary hover:text-text-primary'}`}>
                  Dashboard
                </Link>
              )}
              {isAdmin && (
                <Link href="/admin" className={`text-sm font-medium transition-colors ${pathname === '/admin' ? 'text-brand-600' : 'text-text-secondary hover:text-text-primary'}`}>
                  Admin
                </Link>
              )}
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="/items/new" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              List an Item
            </Link>
            {isAuthenticated ? (
              <button onClick={handleLogout} className="text-sm font-medium text-text-secondary hover:text-brand-600 transition-colors">
                Log out
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/login" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                  Log in
                </Link>
                <Link href="/signup" className="text-sm font-medium bg-text-primary text-surface px-5 py-2.5 rounded-full hover:bg-brand-900 transition-colors shadow-sm">
                  Sign up
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-text-primary">
              {mobileMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface border-b border-text-secondary/10 px-6 py-4 flex flex-col gap-4 shadow-lg absolute w-full">
          <Link href="/items" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-text-primary">Browse</Link>
          {isAuthenticated && <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-text-primary">Dashboard</Link>}
          {isAdmin && <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-text-primary">Admin</Link>}
          <div className="h-px bg-text-secondary/10 my-2" />
          <Link href="/items/new" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-text-primary">List an Item</Link>
          {isAuthenticated ? (
            <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="text-base font-medium text-brand-600 text-left">Log out</button>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-text-primary">Log in</Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-brand-600">Sign up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
