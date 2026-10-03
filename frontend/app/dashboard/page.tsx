"use client";
import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Badge from '@/components/Badge';
import ChatModal from '@/components/ChatModal';

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={`text-2xl font-serif transition-colors ${star <= value ? 'text-amber-400' : 'text-text-secondary/30'} ${onChange ? 'hover:text-amber-300 cursor-pointer' : 'cursor-default'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ReputationPanel({ rep }: { rep: any }) {
  if (!rep) return <p className="text-text-muted/60 text-sm">Loading...</p>;
  const fmt = (n: number) => n > 0 ? n.toFixed(1) : '—';
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div className="bg-background rounded-lg p-5 border border-text-secondary/20">
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">As Renter</p>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-amber-400 text-xl">★</span>
          <span className="text-2xl font-serif font-medium text-text-primary">{fmt(rep.renter.average_rating)}</span>
          <span className="text-sm text-text-muted ml-1">/ 5</span>
        </div>
        <p className="text-sm text-text-muted mb-4">{rep.renter.total_ratings} rating{rep.renter.total_ratings !== 1 ? 's' : ''}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-text-muted">Completed rentals</span><span className="font-semibold text-text-primary">{rep.renter.completed_rentals}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Cancellations</span><span className="font-semibold text-text-primary">{rep.renter.cancelled_rentals}</span></div>
        </div>
      </div>
      <div className="bg-background rounded-lg p-5 border border-text-secondary/20">
        <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">As Owner</p>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-amber-400 text-xl">★</span>
          <span className="text-2xl font-serif font-medium text-text-primary">{fmt(rep.owner.average_rating)}</span>
          <span className="text-sm text-text-muted ml-1">/ 5</span>
        </div>
        <p className="text-sm text-text-muted mb-4">{rep.owner.total_ratings} rating{rep.owner.total_ratings !== 1 ? 's' : ''}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-text-muted">Completed rentals</span><span className="font-semibold text-text-primary">{rep.owner.completed_rentals}</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Cancellations</span><span className="font-semibold text-text-primary">{rep.owner.cancelled_rentals}</span></div>
        </div>
      </div>
    </div>
  );
}

function ReviewModal({ booking, onClose, onSubmit }: { booking: any; onClose: () => void; onSubmit: () => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) { setErr('Please select a star rating.'); return; }
    setSubmitting(true);
    try {
      await fetchApi(`/bookings/${booking.id}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment }),
      });
      onSubmit();
    } catch (e: any) {
      setErr(e.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold text-text-primary mb-1">Rate your experience</h3>
        <p className="text-sm text-text-muted mb-5">{booking.item?.title || booking.renter?.name}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {err && <div className="bg-rose-50 text-rose-700 border border-rose-200 p-3 rounded-lg text-sm">{err}</div>}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">Rating</label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">Comment <span className="text-text-muted/60 font-normal">(optional)</span></label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full border border-text-secondary/20 rounded-lg p-3 text-sm text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Describe your experience..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-zinc-100 text-text-secondary hover:bg-zinc-200 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 bg-text-primary text-surface hover:bg-brand-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-70">
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [myItems, setMyItems] = useState<any[] | null>(null);
  const [reputation, setReputation] = useState<any>(null);
  const [reviewModal, setReviewModal] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chatBooking, setChatBooking] = useState<any>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  const loadAll = async () => {
    const [bookings, items] = await Promise.all([
      fetchApi('/bookings/my'),
      fetchApi('/items/mine'),
    ]);
    setData(bookings);
    setMyItems(items);

    // Fetch my reputation using /auth/me to get user id
    const me = await fetchApi('/auth/me');
    setCurrentUser(me);
    const rep = await fetchApi(`/users/${me.id}/reputation`);
    setReputation(rep);
  };

  useEffect(() => {
    loadAll().catch(() => router.push('/login'));
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

  const handleItemAction = async (id: string, title: string, action: 'unlist' | 'relist') => {
    if (action === 'unlist') {
      const confirmed = window.confirm(`Unlist "${title}"?\n\nThis will remove the item from the public marketplace.\nExisting rental history will be preserved.\nAny pending requests will be cancelled.`);
      if (!confirmed) return;
    }
    try {
      setError('');
      await fetchApi(`/items/${id}/${action}`, { method: 'POST' });
      const items = await fetchApi('/items/mine');
      setMyItems(items);
    } catch (err: any) {
      setError(err.message || `An error occurred during ${action}.`);
    }
  };

  const handleReviewSubmitted = async () => {
    setReviewModal(null);
    await loadAll().catch(() => {});
  };

  if (!data || !myItems) {
    return (
      <div className="flex-1 flex justify-center items-center bg-background">
        <p className="text-text-muted font-medium text-lg">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-medium text-text-primary tracking-tight">Dashboard</h1>
          <p className="text-lg text-text-secondary mt-2">Manage your rentals and requests.</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg mb-8 text-sm font-medium flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 text-xl font-bold">&times;</button>
          </div>
        )}

        {/* My Reputation */}
        <div className="mb-8 bg-surface rounded-lg shadow-sm border border-text-secondary/20 overflow-hidden">
          <div className="p-6 border-b border-text-secondary/10 bg-background/50">
            <h2 className="text-xl font-bold text-text-primary">My Reputation</h2>
            <p className="text-sm text-text-muted mt-0.5">Calculated from your actual rental activity.</p>
          </div>
          <div className="p-6">
            <ReputationPanel rep={reputation} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Your Rentals */}
          <div className="bg-surface rounded-lg shadow-sm border border-text-secondary/20 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-text-secondary/10 bg-background/50">
              <h2 className="text-xl font-bold text-text-primary">Your Rentals (As Renter)</h2>
            </div>
            
            <div className="p-6 flex-1">
              {data.asRenter.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-text-muted mb-4">You haven't requested any items yet.</p>
                  <Link href="/items" className="text-brand-600 font-medium hover:underline">
                    Browse the marketplace
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {data.asRenter.map((b: any) => (
                    <div key={b.id} className="border border-text-secondary/10 rounded-lg p-5 flex flex-col gap-4 bg-background/30 hover:bg-background transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <Link href={`/items/${b.item.id}`} className="font-bold text-lg text-text-primary hover:text-brand-600 transition-colors">
                              {b.item.title}
                            </Link>
                            <Badge status={b.status} />
                          </div>
                          <p className="text-sm text-text-secondary font-medium">
                            {new Date(b.start_date).toLocaleDateString()} — {new Date(b.end_date).toLocaleDateString()}
                          </p>
                          {b.terms_version && (
                            <p className="text-xs text-emerald-700/80 font-medium mt-1">
                              ✓ Rental agreement accepted · {b.terms_version}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button onClick={() => setChatBooking(b)} className="flex-1 sm:flex-none bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">Chat</button>
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

                      {/* Post-return review CTA for renter */}
                      {b.status === 'returned' && !b.my_review_submitted && (
                        <div className="pt-3 border-t border-text-secondary/10 flex items-center justify-between gap-3">
                          <p className="text-sm text-emerald-700 font-medium">✓ Rental complete — rate your experience</p>
                          <button
                            onClick={() => setReviewModal({ ...b, _reviewAs: 'renter' })}
                            className="bg-text-primary text-surface hover:bg-brand-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
                          >
                            Rate Owner
                          </button>
                        </div>
                      )}
                      {b.status === 'returned' && b.my_review_submitted && (
                        <div className="pt-3 border-t border-text-secondary/10">
                          <p className="text-sm text-text-muted/60 font-medium">✓ You reviewed this rental</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Incoming Requests */}
          <div className="bg-surface rounded-lg shadow-sm border border-text-secondary/20 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-text-secondary/10 bg-background/50">
              <h2 className="text-xl font-bold text-text-primary">Incoming Requests (As Owner)</h2>
            </div>
            
            <div className="p-6 flex-1">
              {data.asOwner.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-text-muted mb-4">No incoming requests yet.</p>
                  <Link href="/items/new" className="text-brand-600 font-medium hover:underline">
                    List a new item
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {data.asOwner.map((b: any) => (
                    <div key={b.id} className="border border-text-secondary/10 rounded-lg p-5 flex flex-col gap-4 bg-background/30 hover:bg-background transition-colors">
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <Link href={`/items/${b.item.id}`} className="font-bold text-lg text-text-primary hover:text-brand-600 transition-colors">
                              {b.item.title}
                            </Link>
                            <Badge status={b.status} />
                          </div>
                          <p className="text-sm text-text-secondary">
                            Requested by <span className="font-medium text-text-primary">{b.renter.name}</span>
                          </p>
                          <p className="text-sm text-text-secondary mt-1 font-medium">
                            {new Date(b.start_date).toLocaleDateString()} — {new Date(b.end_date).toLocaleDateString()}
                          </p>
                          {b.terms_version && (
                            <p className="text-xs text-emerald-700/80 font-medium mt-1">
                              ✓ Rental agreement accepted · {b.terms_version}
                            </p>
                          )}
                        </div>
                        
                        <Link 
                          href={`/items/${b.item.id}/condition`} 
                          className="text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap"
                        >
                          Update Condition
                        </Link>
                      </div>

                      <div className="pt-2 border-t border-text-secondary/10 mb-2">
                        <button onClick={() => setChatBooking(b)} className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">Chat</button>
                      </div>

                      {b.status === 'pending' && (
                        <div className="flex gap-3 pt-2 border-t border-text-secondary/10">
                          <button onClick={() => handleAction(b.id, 'accept')} className="flex-1 bg-text-primary hover:bg-brand-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
                            Accept
                          </button>
                          <button onClick={() => handleAction(b.id, 'reject')} className="flex-1 bg-surface border border-text-secondary/20 text-text-secondary hover:bg-background px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
                            Reject
                          </button>
                        </div>
                      )}
                      
                      {['accepted', 'active'].includes(b.status) && (
                        <div className="pt-2 border-t border-text-secondary/10">
                          <button onClick={() => handleAction(b.id, 'return')} className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                            Mark as Returned
                          </button>
                        </div>
                      )}

                      {/* Post-return review CTA for owner */}
                      {b.status === 'returned' && !b.my_review_submitted && (
                        <div className="pt-3 border-t border-text-secondary/10 flex items-center justify-between gap-3">
                          <p className="text-sm text-emerald-700 font-medium">✓ Returned — rate this renter</p>
                          <button
                            onClick={() => setReviewModal({ ...b, _reviewAs: 'owner' })}
                            className="bg-text-primary text-surface hover:bg-brand-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
                          >
                            Rate Renter
                          </button>
                        </div>
                      )}
                      {b.status === 'returned' && b.my_review_submitted && (
                        <div className="pt-3 border-t border-text-secondary/10">
                          <p className="text-sm text-text-muted/60 font-medium">✓ You reviewed this renter</p>
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
        <div className="mt-8 bg-surface rounded-lg shadow-sm border border-text-secondary/20 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-text-secondary/10 bg-background/50">
            <h2 className="text-xl font-bold text-text-primary">Your Listed Items</h2>
          </div>
          
          <div className="p-6 flex-1">
            {myItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-text-muted mb-4">You haven't listed any items yet.</p>
                <Link href="/items/new" className="bg-text-primary text-surface px-6 py-2.5 rounded-lg font-bold hover:bg-brand-700 transition-colors inline-block shadow-sm">
                  List an Item
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myItems.map((item: any) => (
                  <div key={item.id} className="border border-text-secondary/20 rounded-lg p-5 hover:border-brand-300 transition-colors bg-surface flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-lg text-text-primary truncate pr-2" title={item.title}>{item.title}</h3>
                        <Badge status={item.is_available ? 'AVAILABLE' : 'UNLISTED'} />
                      </div>
                      <p className="text-sm text-text-muted mb-4">{item.category} • {item.city}, {item.area}</p>
                      <p className="text-lg font-bold text-brand-700 mb-6">₹{item.price_per_day}<span className="text-sm font-normal text-text-muted">/day</span></p>
                    </div>
                    
                    <div className="flex gap-2 border-t border-text-secondary/10 pt-4">
                      <Link href={`/items/${item.id}`} className="flex-1 text-center bg-background text-text-secondary hover:bg-zinc-100 border border-text-secondary/20 px-3 py-2 rounded-lg text-sm font-semibold transition-colors">
                        View
                      </Link>
                      <button onClick={() => setError('Item editing will be available in a future update.')} className="flex-1 text-center bg-surface text-text-secondary hover:bg-background border border-text-secondary/20 px-3 py-2 rounded-lg text-sm font-semibold transition-colors">
                        Edit
                      </button>
                      {item.is_available ? (
                        <button onClick={() => handleItemAction(item.id, item.title, 'unlist')} className="flex-1 text-center bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-3 py-2 rounded-lg text-sm font-semibold transition-colors">
                          Unlist
                        </button>
                      ) : (
                        <button onClick={() => handleItemAction(item.id, item.title, 'relist')} className="flex-1 text-center bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-lg text-sm font-semibold transition-colors">
                          Relist
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Review Modal */}
      {chatBooking && (
        <ChatModal
          booking={chatBooking}
          currentUser={currentUser}
          onClose={() => setChatBooking(null)}
        />
      )}

      {reviewModal && (
        <ReviewModal
          booking={reviewModal}
          onClose={() => setReviewModal(null)}
          onSubmit={handleReviewSubmitted}
        />
      )}
    </div>
  );
}
