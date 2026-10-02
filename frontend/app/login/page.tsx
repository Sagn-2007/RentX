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
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h1>
        <p className="text-slate-500 mt-2">Log in to manage your rentals and listings.</p>
      </div>

      <div className="max-w-md w-full bg-white p-8 sm:p-10 border border-slate-200 rounded-2xl shadow-sm">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700">Email Address</label>
            <input 
              type="email" 
              placeholder="you@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="w-full border border-slate-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="w-full border border-slate-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-600 text-white font-bold py-3.5 rounded-xl mt-2 hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600 font-medium">
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
