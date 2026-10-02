"use client";
import { useState } from 'react';
import { fetchApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeftIcon } from 'lucide-react';

export default function NewItem() {
  const [formData, setFormData] = useState({
    title: '', description: '', category: '', price_per_day: '', deposit_amount: '', city: '', area: '', serial_number: ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...formData,
        price_per_day: parseFloat(formData.price_per_day),
        deposit_amount: parseFloat(formData.deposit_amount),
      };
      // Only include serial number if provided
      if (!payload.serial_number) delete (payload as any).serial_number;
      
      const res = await fetchApi('/items', { method: 'POST', body: JSON.stringify(payload) });
      router.push(`/items/${res.id}`);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Link href={`/dashboard`} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors">
          <ChevronLeftIcon className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
        
        <div className="bg-white p-8 sm:p-10 border border-slate-200 rounded-2xl shadow-sm">
          <div className="mb-8 border-b border-slate-100 pb-6">
            <h1 className="text-3xl font-extrabold text-slate-900">List an Item</h1>
            <p className="text-slate-500 mt-2">Rent out your unused items securely to people in your area.</p>
          </div>
          
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700">Item Title</label>
              <input 
                name="title" 
                placeholder="e.g. Sony A7III Camera" 
                required 
                className="w-full border border-slate-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm" 
                onChange={handleChange} 
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700">Description</label>
              <textarea 
                name="description" 
                placeholder="Describe the item, what's included, and any rules for renters..." 
                required 
                className="w-full border border-slate-300 px-4 py-3 rounded-xl h-32 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm resize-y" 
                onChange={handleChange} 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700">Category</label>
                <input 
                  name="category" 
                  placeholder="e.g. Tools, Photography, Camping" 
                  required 
                  className="w-full border border-slate-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm" 
                  onChange={handleChange} 
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700">Serial Number <span className="font-normal text-slate-400">(Optional)</span></label>
                <input 
                  name="serial_number" 
                  placeholder="e.g. SN-998822" 
                  className="w-full border border-slate-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm" 
                  onChange={handleChange} 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700">Price per day ($)</label>
                <input 
                  name="price_per_day" 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  required 
                  className="w-full border border-slate-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm" 
                  onChange={handleChange} 
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700">Deposit amount ($)</label>
                <input 
                  name="deposit_amount" 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  required 
                  className="w-full border border-slate-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm" 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700">City</label>
                <input 
                  name="city" 
                  placeholder="e.g. San Francisco" 
                  required 
                  className="w-full border border-slate-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm" 
                  onChange={handleChange} 
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700">Area / Neighborhood</label>
                <input 
                  name="area" 
                  placeholder="e.g. Mission District" 
                  required 
                  className="w-full border border-slate-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm" 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="w-full bg-brand-600 text-white font-bold text-lg py-4 rounded-xl mt-6 hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? 'Creating Identity & Listing...' : 'Create Listing'}
            </button>
            <p className="text-center text-xs text-slate-500 mt-2">
              By listing this item, a unique SHA-256 digital passport will be generated to secure its rental history.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
