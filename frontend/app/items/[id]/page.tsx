"use client";
import { useEffect, useState, use } from 'react';
import { fetchApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function ItemDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [item, setItem] = useState<any>(null);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchApi(`/items/${resolvedParams.id}`)
      .then(setItem)
      .catch(() => router.push('/items'));
  }, [resolvedParams.id, router]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await fetchApi('/bookings', {
        method: 'POST',
        body: JSON.stringify({ item_id: item.id, start_date: start, end_date: end }),
      });
      setSuccess('Rental requested successfully! Check dashboard.');
      setStart('');
      setEnd('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!item) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
        <div className="flex-1 bg-white p-6 border rounded-lg shadow-sm">
          <div className="h-64 bg-gray-200 mb-6 rounded flex items-center justify-center">
             {item.photo_urls?.length ? <img src={item.photo_urls[0]} alt={item.title} className="w-full h-full object-cover rounded" /> : <span className="text-gray-400">No Photo</span>}
          </div>
          <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
          <p className="text-gray-600 mb-4">{item.category} • Owned by {item.owner.name}</p>
          <p className="mb-4">{item.description}</p>
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
            <div>
              <p className="text-gray-500 text-sm">Location</p>
              <p className="font-medium">{item.city}, {item.area}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Deposit Amount</p>
              <p className="font-medium">${item.deposit_amount}</p>
            </div>
          </div>
        </div>

        <div className="w-full md:w-80">
          <div className="bg-white p-6 border rounded-lg shadow-sm sticky top-8">
            <h2 className="text-2xl font-bold mb-1">${item.price_per_day} <span className="text-base font-normal text-gray-500">/ day</span></h2>
            
            <form onSubmit={handleRequest} className="mt-6 flex flex-col gap-4">
              {error && <p className="text-red-500 text-sm">{error}</p>}
              {success && <p className="text-green-600 text-sm">{success}</p>}
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                <input type="date" required value={start} onChange={e => setStart(e.target.value)} className="w-full border p-2 rounded" />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">End Date</label>
                <input type="date" required value={end} onChange={e => setEnd(e.target.value)} className="w-full border p-2 rounded" />
              </div>

              <button type="submit" className="w-full bg-black text-white font-medium py-3 rounded mt-2 hover:bg-gray-800 transition">
                Request to Rent
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
