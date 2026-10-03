"use client";
import { useState, useRef } from 'react';
import { fetchApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeftIcon, XIcon, PlusIcon } from 'lucide-react';

export default function NewItem() {
  const [formData, setFormData] = useState({
    title: '', description: '', category: '', price_per_day: '', deposit_amount: '', city: '', area: '', serial_number: ''
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(file => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          setError('Only JPEG, PNG, and WebP are allowed.');
          return false;
        }
        if (file.size > 5 * 1024 * 1024) {
          setError('Files must be under 5MB.');
          return false;
        }
        return true;
      });
      
      if (photos.length + validFiles.length > 5) {
        setError('Maximum 5 photos allowed.');
        return;
      }
      
      setPhotos([...photos, ...validFiles]);
      setError('');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
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
      if (!payload.serial_number) delete (payload as any).serial_number;
      
      const res = await fetchApi('/items', { method: 'POST', body: JSON.stringify(payload) });
      
      // Upload photos if any
      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach(photo => formData.append('photos', photo));
        
        const token = localStorage.getItem('token') || '';
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const uploadRes = await fetch(`${API_URL}/items/${res.id}/photos`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || 'Failed to upload photos');
        }
      }

      router.push(`/items/${res.id}`);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 bg-background py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Link href={`/dashboard`} className="inline-flex items-center text-sm font-medium text-text-muted hover:text-text-primary mb-6 transition-colors">
          <ChevronLeftIcon className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
        
        <div className="bg-surface p-8 sm:p-10 border border-text-secondary/20 rounded-lg shadow-sm">
          <div className="mb-8 border-b border-text-secondary/10 pb-6">
            <h1 className="text-4xl font-serif text-text-primary font-medium text-text-primary">List an Item</h1>
            <p className="text-text-muted mt-2">Rent out your unused items securely to people in your area.</p>
          </div>
          
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-text-secondary">Add Photos (Max 5)</label>
              <div className="flex gap-4 flex-wrap">
                {photos.map((photo, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-text-secondary/20">
                    <img src={URL.createObjectURL(photo)} alt="preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70">
                      <XIcon className="w-3 h-3" />
                    </button>
                    {i === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-brand-600/80 text-white text-[10px] font-medium text-center py-0.5 uppercase tracking-wide">
                        Cover
                      </div>
                    )}
                  </div>
                ))}
                {photos.length < 5 && (
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="w-24 h-24 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-text-secondary/20 text-text-muted hover:border-brand-500 hover:text-brand-600 transition-colors bg-background">
                    <PlusIcon className="w-6 h-6 mb-1" />
                    <span className="text-xs font-semibold">Add</span>
                  </button>
                )}
              </div>
              <input type="file" multiple accept="image/jpeg, image/png, image/webp" className="hidden" ref={fileInputRef} onChange={handlePhotoSelect} />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-secondary">Item Title</label>
              <input name="title" placeholder="e.g. Sony A7III Camera" required className="w-full border border-text-secondary/20 px-4 py-3 rounded-lg focus:ring-1 focus:ring-text-primary focus:border-text-primary outline-none transition-all shadow-sm" onChange={handleChange} />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-secondary">Description</label>
              <textarea name="description" placeholder="Describe the item, what's included, and any rules for renters..." required className="w-full border border-text-secondary/20 px-4 py-3 rounded-lg h-32 focus:ring-1 focus:ring-text-primary focus:border-text-primary outline-none transition-all shadow-sm resize-y" onChange={handleChange} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-secondary">Category</label>
                <input name="category" placeholder="e.g. Tools, Photography, Camping" required className="w-full border border-text-secondary/20 px-4 py-3 rounded-lg focus:ring-1 focus:ring-text-primary focus:border-text-primary outline-none transition-all shadow-sm" onChange={handleChange} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-secondary">Serial Number <span className="font-normal text-text-muted/60">(Optional)</span></label>
                <input name="serial_number" placeholder="e.g. SN-998822" className="w-full border border-text-secondary/20 px-4 py-3 rounded-lg focus:ring-1 focus:ring-text-primary focus:border-text-primary outline-none transition-all shadow-sm" onChange={handleChange} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-text-secondary/10">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-secondary">Price per day ($)</label>
                <input name="price_per_day" type="number" step="0.01" placeholder="0.00" required className="w-full border border-text-secondary/20 px-4 py-3 rounded-lg focus:ring-1 focus:ring-text-primary focus:border-text-primary outline-none transition-all shadow-sm" onChange={handleChange} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-secondary">Deposit amount ($)</label>
                <input name="deposit_amount" type="number" step="0.01" placeholder="0.00" required className="w-full border border-text-secondary/20 px-4 py-3 rounded-lg focus:ring-1 focus:ring-text-primary focus:border-text-primary outline-none transition-all shadow-sm" onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-text-secondary/10">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-secondary">City</label>
                <input name="city" placeholder="e.g. San Francisco" required className="w-full border border-text-secondary/20 px-4 py-3 rounded-lg focus:ring-1 focus:ring-text-primary focus:border-text-primary outline-none transition-all shadow-sm" onChange={handleChange} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-text-secondary">Area / Neighborhood</label>
                <input name="area" placeholder="e.g. Mission District" required className="w-full border border-text-secondary/20 px-4 py-3 rounded-lg focus:ring-1 focus:ring-text-primary focus:border-text-primary outline-none transition-all shadow-sm" onChange={handleChange} />
              </div>
            </div>

            <button type="submit" disabled={saving} className="w-full bg-text-primary text-surface font-medium text-lg py-4 rounded-lg mt-6 hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
              {saving ? 'Creating Identity & Listing...' : 'Create Listing'}
            </button>
            <p className="text-center text-xs text-text-muted mt-2">
              By listing this item, a unique SHA-256 digital passport will be generated to secure its rental history.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
