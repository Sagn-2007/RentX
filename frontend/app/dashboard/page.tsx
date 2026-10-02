"use client";
import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetchApi('/bookings/my')
      .then(setData)
      .catch(() => router.push('/login'));
  }, [router]);

  const handleAction = async (id: string, action: string) => {
    try {
      await fetchApi(`/bookings/${id}/${action}`, { method: 'PATCH' });
      const updated = await fetchApi('/bookings/my');
      setData(updated);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!data) return <div className="p-8">Loading dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-4">
          <Link href="/items" className="text-blue-600 font-medium">Browse Items</Link>
          <Link href="/items/new" className="bg-black text-white px-4 py-2 rounded">List an Item</Link>
          <button onClick={() => { localStorage.removeItem('token'); router.push('/login'); }} className="text-gray-600">Log out</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Your Rentals (As Renter)</h2>
          {data.asRenter.length === 0 && <p className="text-gray-500">No rental requests yet.</p>}
          <div className="flex flex-col gap-4">
            {data.asRenter.map((b: any) => (
              <div key={b.id} className="border p-4 rounded flex justify-between items-center">
                <div>
                  <p className="font-bold">{b.item.title}</p>
                  <p className="text-sm text-gray-600">{new Date(b.start_date).toLocaleDateString()} to {new Date(b.end_date).toLocaleDateString()}</p>
                  <p className="text-sm font-medium mt-1">Status: {b.status}</p>
                </div>
                <div className="flex gap-2">
                  {['pending', 'accepted'].includes(b.status) && (
                    <button onClick={() => handleAction(b.id, 'cancel')} className="bg-red-100 text-red-600 px-3 py-1 rounded text-sm">Cancel</button>
                  )}
                  {b.status === 'active' && (
                    <button onClick={() => handleAction(b.id, 'return')} className="bg-green-100 text-green-600 px-3 py-1 rounded text-sm">Return</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Incoming Requests (As Owner)</h2>
          {data.asOwner.length === 0 && <p className="text-gray-500">No incoming requests.</p>}
          <div className="flex flex-col gap-4">
            {data.asOwner.map((b: any) => (
              <div key={b.id} className="border p-4 rounded flex flex-col gap-2">
                <div>
                  <p className="font-bold">{b.item.title}</p>
                  <p className="text-sm text-gray-600">Requested by {b.renter.name}</p>
                  <p className="text-sm text-gray-600">{new Date(b.start_date).toLocaleDateString()} to {new Date(b.end_date).toLocaleDateString()}</p>
                  <p className="text-sm font-medium mt-1">Status: {b.status}</p>
                </div>
                {b.status === 'pending' && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleAction(b.id, 'accept')} className="bg-blue-600 text-white px-3 py-1 rounded text-sm flex-1">Accept</button>
                    <button onClick={() => handleAction(b.id, 'reject')} className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm flex-1">Reject</button>
                  </div>
                )}
                {b.status === 'active' && (
                  <button onClick={() => handleAction(b.id, 'return')} className="bg-green-100 text-green-600 px-3 py-1 rounded text-sm mt-2">Mark Returned</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
