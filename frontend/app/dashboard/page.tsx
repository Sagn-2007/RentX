"use client";
import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Badge from '@/components/Badge';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [myItems, setMyItems] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetchApi('/bookings/my'),
      fetchApi('/items/mine')
    ])
      .then(([bookings, items]) => {
        setData(bookings);
        setMyItems(items);
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const handleAction = async (id: string, action: string) => {
    try {
      setError('');
      await fetchApi(`/bookings/${id}/${action}`, { method: 'PATCH' });
      const updated = await fetchApi('/bookings/my');
      setData(updated);
    } catch (err: any) {
      setError(err.message || 'An error occurred during the action.');
    }
  };

  if (!data || !myItems) {
    return (
      <div className="flex-1 flex justify-center items-center bg-slate-50">
        <p className="text-slate-500 font-medium text-lg">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-lg text-slate-600 mt-2">Manage your rentals and requests.</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg mb-8 text-sm font-medium flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 text-xl font-bold">&times;</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Your Rentals */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">Your Rentals (As Renter)</h2>
            </div>
            
            <div className="p-6 flex-1">
              {data.asRenter.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500 mb-4">You haven't requested any items yet.</p>
                  <Link href="/items" className="text-brand-600 font-medium hover:underline">
                    Browse the marketplace
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {data.asRenter.map((b: any) => (
                    <div key={b.id} className="border border-slate-100 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/30 hover:bg-slate-50 transition-colors">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <Link href={`/items/${b.item.id}`} className="font-bold text-lg text-slate-900 hover:text-brand-600 transition-colors">
                            {b.item.title}
                          </Link>
                          <Badge status={b.status} />
                        </div>
                        <p className="text-sm text-slate-600 font-medium">
                          {new Date(b.start_date).toLocaleDateString()} — {new Date(b.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex gap-2 w-full sm:w-auto">
                        {['pending', 'accepted'].includes(b.status) && (
                          <button onClick={() => handleAction(b.id, 'cancel')} className="flex-1 sm:flex-none bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                            Cancel
                          </button>
                        )}
                        {['accepted', 'active'].includes(b.status) && (
                          <button onClick={() => handleAction(b.id, 'return')} className="flex-1 sm:flex-none bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                            Return
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Incoming Requests */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">Incoming Requests (As Owner)</h2>
            </div>
            
            <div className="p-6 flex-1">
              {data.asOwner.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500 mb-4">No incoming requests yet.</p>
                  <Link href="/items/new" className="text-brand-600 font-medium hover:underline">
                    List a new item
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {data.asOwner.map((b: any) => (
                    <div key={b.id} className="border border-slate-100 rounded-xl p-5 flex flex-col gap-4 bg-slate-50/30 hover:bg-slate-50 transition-colors">
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <Link href={`/items/${b.item.id}`} className="font-bold text-lg text-slate-900 hover:text-brand-600 transition-colors">
                              {b.item.title}
                            </Link>
                            <Badge status={b.status} />
                          </div>
                          <p className="text-sm text-slate-600">
                            Requested by <span className="font-medium text-slate-900">{b.renter.name}</span>
                          </p>
                          <p className="text-sm text-slate-600 mt-1 font-medium">
                            {new Date(b.start_date).toLocaleDateString()} — {new Date(b.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <Link 
                          href={`/items/${b.item.id}/condition`} 
                          className="text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap"
                        >
                          Update Condition
                        </Link>
                      </div>

                      {b.status === 'pending' && (
                        <div className="flex gap-3 pt-2 border-t border-slate-100">
                          <button onClick={() => handleAction(b.id, 'accept')} className="flex-1 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
                            Accept
                          </button>
                          <button onClick={() => handleAction(b.id, 'reject')} className="flex-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
                            Reject
                          </button>
                        </div>
                      )}
                      
                      {['accepted', 'active'].includes(b.status) && (
                        <div className="pt-2 border-t border-slate-100">
                          <button onClick={() => handleAction(b.id, 'return')} className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                            Mark as Returned
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Your Listed Items */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xl font-bold text-slate-900">Your Listed Items</h2>
          </div>
          
          <div className="p-6 flex-1">
            {myItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 mb-4">You haven't listed any items yet.</p>
                <Link href="/items/new" className="bg-brand-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-brand-700 transition-colors inline-block shadow-sm">
                  List an Item
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myItems.map((item: any) => (
                  <div key={item.id} className="border border-slate-200 rounded-xl p-5 hover:border-brand-300 transition-colors bg-white flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-lg text-slate-900 truncate pr-2" title={item.title}>{item.title}</h3>
                        <Badge status={item.is_available ? 'AVAILABLE' : 'UNAVAILABLE'} />
                      </div>
                      <p className="text-sm text-slate-500 mb-4">{item.category} • {item.city}, {item.area}</p>
                      <p className="text-lg font-bold text-brand-700 mb-6">₹{item.price_per_day}<span className="text-sm font-normal text-slate-500">/day</span></p>
                    </div>
                    
                    <div className="flex gap-2 border-t border-slate-100 pt-4">
                      <Link href={`/items/${item.id}`} className="flex-1 text-center bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                        View
                      </Link>
                      <button onClick={() => setError('Item editing will be available in a future update.')} className="flex-1 text-center bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
