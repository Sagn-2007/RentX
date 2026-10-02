"use client";
import { useEffect, useState, use } from 'react';
import { fetchApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeftIcon, ClipboardCheckIcon } from 'lucide-react';

export default function UpdateCondition({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [item, setItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    overall: '', exterior: '', functional: '', accessories: '', notes: ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchApi(`/items/${resolvedParams.id}`)
      .then((data) => {
        setItem(data);
        if (data.condition_checklist) {
          setFormData(data.condition_checklist);
        }
      })
      .catch(() => router.push('/dashboard'));
  }, [resolvedParams.id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await fetchApi(`/items/${item.id}/condition`, {
        method: 'PATCH',
        body: JSON.stringify(formData),
      });
      router.push(`/items/${item.id}`);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (!item) {
    return (
      <div className="flex-1 flex justify-center items-center bg-slate-50">
        <p className="text-slate-500 font-medium text-lg">Loading form...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Link href={`/dashboard`} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors">
          <ChevronLeftIcon className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
        
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">
              <ClipboardCheckIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Condition Report</h1>
              <p className="text-slate-500 mt-1">Updating <span className="font-semibold text-slate-700">{item.title}</span></p>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">Overall Condition</label>
              <input 
                name="overall" 
                required 
                placeholder="e.g. Excellent, Good, Fair"
                className="w-full border border-slate-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm" 
                value={formData.overall} 
                onChange={handleChange} 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700">Exterior / Body</label>
                <input 
                  name="exterior" 
                  required 
                  placeholder="e.g. Minor scratches on base"
                  className="w-full border border-slate-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm" 
                  value={formData.exterior} 
                  onChange={handleChange} 
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-700">Functional Status</label>
                <input 
                  name="functional" 
                  required 
                  placeholder="e.g. Works perfectly"
                  className="w-full border border-slate-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm" 
                  value={formData.functional} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">Accessories</label>
              <input 
                name="accessories" 
                required 
                placeholder="e.g. Includes charger and carrying case"
                className="w-full border border-slate-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm" 
                value={formData.accessories} 
                onChange={handleChange} 
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">Additional Notes</label>
              <textarea 
                name="notes" 
                placeholder="Any other details about the item's current state..."
                className="w-full border border-slate-300 px-4 py-3 rounded-xl h-32 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all shadow-sm resize-y" 
                value={formData.notes} 
                onChange={handleChange} 
              />
            </div>

            <div className="pt-4 flex gap-4 mt-2">
              <Link href={`/dashboard`} className="flex-1 flex justify-center items-center bg-white border border-slate-300 text-slate-700 px-6 py-3.5 rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-sm">
                Cancel
              </Link>
              <button 
                type="submit" 
                disabled={saving}
                className="flex-[2] bg-brand-600 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Condition Record'}
              </button>
            </div>
            
            <p className="text-xs text-slate-500 text-center mt-2">
              Updating this form will append a cryptographic record to the item's Passport History.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
