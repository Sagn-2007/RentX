"use client";
import { useEffect, useState, use } from 'react';
import { fetchApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, MapPinIcon, ShieldCheckIcon, CalendarIcon, UserIcon, ClockIcon } from 'lucide-react';
import Link from 'next/link';

export default function ItemDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [item, setItem] = useState<any>(null);
  const [passport, setPassport] = useState<any>(null);
  const [ownerRep, setOwnerRep] = useState<any>(null);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [existingBooking, setExistingBooking] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetchApi(`/items/${resolvedParams.id}`)
      .then((data) => {
        setItem(data);
        // Fetch owner reputation once we have the owner_id
        fetchApi(`/users/${data.owner_id}/reputation`)
          .then(setOwnerRep)
          .catch(() => {});
      })
      .catch(() => router.push('/items'));
      
    fetchApi(`/items/${resolvedParams.id}/passport`)
      .then(setPassport)
      .catch(console.error);

    if (localStorage.getItem('token')) {
      fetchApi('/bookings/my')
        .then((data) => {
          // DUPLICATE REQUEST RULE:
          // Only check if the currently authenticated user has an active booking for this item.
          // Do not globally disable the item.
          const active = data.asRenter.find((b: any) => 
            b.item_id === resolvedParams.id && ['pending', 'accepted', 'active'].includes(b.status)
          );
          if (active) {
            setExistingBooking(active);
          }
        })
        .catch(() => {});
    }
  }, [resolvedParams.id, router]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequesting(true);
    setError('');
    setSuccess('');
    try {
      await fetchApi('/bookings', {
        method: 'POST',
        body: JSON.stringify({ item_id: item.id, start_date: start, end_date: end }),
      });
      setSuccess('Rental requested successfully! You can track it in your Dashboard.');
      setStart('');
      setEnd('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRequesting(false);
    }
  };

  if (!item) {
    return (
      <div className="flex-1 flex justify-center items-center bg-background">
        <p className="text-text-muted font-medium text-lg">Loading item details...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <Link href={`/items`} className="inline-flex items-center text-sm font-medium text-text-muted hover:text-text-primary mb-6 transition-colors">
          <ChevronLeftIcon className="w-4 h-4 mr-1" />
          Back to Marketplace
        </Link>
        
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col gap-8">
            
            {/* Item Details Card */}
            <div className="bg-surface rounded-lg shadow-sm border border-text-secondary/20 overflow-hidden">
              <div className="h-72 sm:h-96 bg-zinc-100 flex items-center justify-center relative">
                 {item.photos?.length ? (
                   <img src={item.photos[0].url} alt={item.title} className="w-full h-full object-cover" />
                 ) : (
                   <div className="flex flex-col items-center text-text-muted/60">
                     <span className="font-medium">No Image Provided</span>
                   </div>
                 )}
              </div>
              {item.photos?.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto bg-background border-b border-text-secondary/20">
                  {item.photos.map((photo: any) => (
                    <img key={photo.id} src={photo.url} alt="Gallery thumbnail" className="h-20 w-20 object-cover rounded-md border border-text-secondary/20" />
                  ))}
                </div>
              )}
              
              <div className="p-8">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider">
                    {item.category}
                  </span>
                  <div className="flex items-center text-text-muted text-sm font-medium">
                    <MapPinIcon className="w-4 h-4 mr-1" />
                    {item.city}, {item.area}
                  </div>
                </div>
                
                <h1 className="text-3xl sm:text-5xl font-serif text-text-primary mb-4">{item.title}</h1>
                <p className="text-text-secondary text-lg leading-relaxed mb-8">{item.description}</p>
                
                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-text-secondary/10">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-text-muted uppercase tracking-wide">Owner</span>
                    <div className="flex items-center gap-2 text-text-primary font-medium">
                      <div className="w-8 h-8 bg-zinc-200 rounded-full flex items-center justify-center text-text-secondary">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      {item.owner.name}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-text-muted uppercase tracking-wide">Security Deposit</span>
                    <span className="text-lg text-text-primary font-medium">${item.deposit_amount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Passport & History Section */}
            {passport && (
              <div className="bg-surface rounded-lg shadow-sm border border-text-secondary/20 overflow-hidden">
                <div className="p-8 border-b border-text-secondary/10 bg-background/50 flex items-center gap-3">
                  <ShieldCheckIcon className="w-6 h-6 text-brand-600" />
                  <h2 className="text-2xl font-medium text-text-primary">Digital Passport & History</h2>
                </div>
                
                <div className="p-8">
                  {/* Hash Section */}
                  <div className="mb-10">
                    <h3 className="text-sm font-medium text-text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                      Cryptographic Identity
                    </h3>
                    <div className="bg-slate-900 text-text-secondary/30 p-4 rounded-lg font-mono text-sm break-all shadow-inner">
                      <span className="block text-text-muted text-xs mb-2 uppercase font-sans font-medium tracking-widest">SHA-256 Hash</span>
                      {passport.passport_hash}
                    </div>
                    {passport.serial_number && (
                      <div className="mt-4 flex items-center gap-2 text-sm">
                        <span className="font-semibold text-text-secondary">Serial Number:</span>
                        <span className="text-text-primary font-mono bg-zinc-100 px-2 py-1 rounded">{passport.serial_number}</span>
                      </div>
                    )}
                  </div>

                  {/* Condition Section */}
                  <div className="mb-12">
                    <h3 className="text-sm font-medium text-text-primary uppercase tracking-wider mb-4 border-b border-text-secondary/10 pb-2">
                      Verified Condition
                    </h3>
                    {passport.current_condition ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                        <div className="bg-background p-3 rounded-lg"><span className="text-text-muted block font-semibold mb-1 text-xs uppercase">Overall</span><span className="font-medium text-text-primary">{passport.current_condition.overall}</span></div>
                        <div className="bg-background p-3 rounded-lg"><span className="text-text-muted block font-semibold mb-1 text-xs uppercase">Exterior</span><span className="font-medium text-text-primary">{passport.current_condition.exterior}</span></div>
                        <div className="bg-background p-3 rounded-lg"><span className="text-text-muted block font-semibold mb-1 text-xs uppercase">Functional</span><span className="font-medium text-text-primary">{passport.current_condition.functional}</span></div>
                        <div className="bg-background p-3 rounded-lg"><span className="text-text-muted block font-semibold mb-1 text-xs uppercase">Accessories</span><span className="font-medium text-text-primary">{passport.current_condition.accessories}</span></div>
                        <div className="sm:col-span-2 bg-background p-3 rounded-lg"><span className="text-text-muted block font-semibold mb-1 text-xs uppercase">Notes</span><span className="font-medium text-text-primary">{passport.current_condition.notes}</span></div>
                      </div>
                    ) : (
                      <p className="text-text-muted italic bg-background p-4 rounded-lg text-sm">No condition data recorded.</p>
                    )}
                  </div>

                  {/* Timeline Section */}
                  <div>
                    <h3 className="text-sm font-medium text-text-primary uppercase tracking-wider mb-6 border-b border-text-secondary/10 pb-2">
                      Audit Timeline
                    </h3>
                    <div className="flex flex-col gap-0 ml-2">
                      {passport.history.map((event: any, index: number) => (
                        <div key={event.id} className="relative pl-8 pb-8 last:pb-0">
                          {/* Timeline Line */}
                          {index !== passport.history.length - 1 && (
                            <div className="absolute left-2.5 top-6 bottom-0 w-px bg-zinc-200"></div>
                          )}
                          {/* Timeline Dot */}
                          <div className="absolute left-1 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-brand-600 bg-surface"></div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-1">
                            <div className="font-medium text-text-primary">{event.event_type.replace(/_/g, ' ')}</div>
                            <div className="text-xs text-text-muted font-medium flex items-center">
                              <ClockIcon className="w-3 h-3 mr-1" />
                              {new Date(event.created_at).toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="text-sm text-text-secondary mt-1 flex items-center gap-2">
                            <span className="bg-zinc-100 px-2 py-0.5 rounded text-xs font-medium text-text-secondary">Actor: {event.actor_name}</span>
                            {event.metadata?.reconstructed && (
                              <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">Reconstructed</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {passport.history.length === 0 && (
                        <p className="text-text-muted text-sm">No audit events recorded.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar / Booking Request Action */}
          <div className="w-full lg:w-96 shrink-0">
            <div className="bg-surface p-8 rounded-lg shadow-sm border border-text-secondary/20 sticky top-24">
              <div className="mb-6 pb-6 border-b border-text-secondary/10">
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-serif text-text-primary">${item.price_per_day}</span>
                  <span className="text-text-muted font-medium pb-1">/ day</span>
                </div>
              </div>

              {/* Owner Reputation */}
              {ownerRep && (
                <div className="mb-6 pb-6 border-b border-text-secondary/10">
                  <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Owner Reputation</p>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="flex items-center gap-1">
                        <span className="text-amber-400 text-xl">★</span>
                        <span className="text-2xl font-medium text-text-primary">
                          {ownerRep.owner.total_ratings > 0 ? ownerRep.owner.average_rating.toFixed(1) : '—'}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">{ownerRep.owner.total_ratings} rating{ownerRep.owner.total_ratings !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="h-10 w-px bg-zinc-200" />
                    <div className="text-sm text-text-secondary">
                      <span className="font-semibold text-text-primary">{ownerRep.owner.completed_rentals}</span> completed rental{ownerRep.owner.completed_rentals !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              )}
              
              {!item.is_available ? (
                <div className="bg-background border border-text-secondary/20 rounded-lg p-5 text-center">
                  <h4 className="font-medium text-text-primary mb-2">Item Unlisted</h4>
                  <p className="text-sm text-text-secondary mb-4">
                    This item has been unlisted by the owner and is not available for new rental requests.
                  </p>
                </div>
              ) : existingBooking ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 text-center">
                  <h4 className="font-medium text-amber-800 mb-2">Request already active</h4>
                  <p className="text-sm text-amber-700 mb-4">
                    You already have a <strong>{existingBooking.status}</strong> rental request for this item.
                  </p>
                  <Link href="/dashboard" className="inline-block bg-surface text-amber-800 font-semibold text-sm px-4 py-2 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors">
                    View in Dashboard
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleRequest} className="flex flex-col gap-5">
                  {error && (
                    <div className="bg-rose-50 text-rose-700 border border-rose-200 p-3 rounded-lg text-sm font-medium">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-3 rounded-lg text-sm font-medium">
                      {success}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">Start Date</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CalendarIcon className="h-4 w-4 text-text-muted/60" />
                        </div>
                        <input 
                          type="date" 
                          required 
                          value={start} 
                          onChange={e => setStart(e.target.value)} 
                          className="w-full border border-text-secondary/20 pl-9 pr-3 py-2.5 rounded-lg text-sm focus:ring-1 focus:ring-text-primary focus:border-text-primary outline-none transition-all shadow-sm" 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">End Date</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CalendarIcon className="h-4 w-4 text-text-muted/60" />
                        </div>
                        <input 
                          type="date" 
                          required 
                          value={end} 
                          onChange={e => setEnd(e.target.value)} 
                          className="w-full border border-text-secondary/20 pl-9 pr-3 py-2.5 rounded-lg text-sm focus:ring-1 focus:ring-text-primary focus:border-text-primary outline-none transition-all shadow-sm" 
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={requesting}
                    className="w-full bg-text-primary text-surface font-medium py-4 rounded-full mt-2 hover:bg-brand-900 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {requesting ? 'Processing Request...' : 'Request to Rent'}
                  </button>
                  
                  <p className="text-xs text-center text-text-muted mt-2 font-medium">
                    You won't be charged until the owner accepts.
                  </p>
                </form>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
