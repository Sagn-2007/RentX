"use client";
import { useState } from 'react';
import { fetchApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Welcome back</h1>
        <p className="text-text-muted mt-2">Log in to manage your rentals and listings.</p>
      </div>

      <div className="max-w-md w-full bg-surface p-8 sm:p-10 border border-text-secondary/20 rounded-lg shadow-sm">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-text-secondary">Email Address</label>
            <input 
              type="email" 
              placeholder="you@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="w-full border border-text-secondary/20 px-4 py-3 rounded-lg focus:ring-1 focus:ring-text-primary focus:border-text-primary outline-none transition-all shadow-sm"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-text-secondary">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="w-full border border-text-secondary/20 px-4 py-3 rounded-lg focus:ring-1 focus:ring-text-primary focus:border-text-primary outline-none transition-all shadow-sm"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-text-primary text-surface font-bold py-3.5 rounded-lg mt-2 hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-text-secondary font-medium">
            Don't have an account?{' '}
            <Link href="/signup" className="text-brand-600 hover:text-brand-700 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
