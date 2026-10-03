"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';
import Badge from '@/components/Badge';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      try {
        const [statsData, usersData, itemsData, bookingsData] = await Promise.all([
          fetchApi('/admin/stats'),
          fetchApi('/admin/users'),
          fetchApi('/admin/items'),
          fetchApi('/admin/bookings')
        ]);
        setStats(statsData);
        setUsers(usersData);
        setItems(itemsData);
        setBookings(bookingsData);
      } catch (err: any) {
        if (err.message === 'Forbidden: Admin access required' || err.message === 'Unauthenticated') {
          router.push('/dashboard');
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [router]);

  if (loading) return <div className="p-8 text-center text-text-muted">Loading Admin Dashboard...</div>;
  if (error) return <div className="p-8 text-center text-rose-600">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Admin Dashboard</h1>
          <p className="text-text-muted mt-1">Platform overview and moderation.</p>
        </div>
      </div>

      <div className="flex space-x-2 border-b border-text-secondary/20 mb-8">
        {['overview', 'users', 'items', 'bookings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-semibold capitalize border-b-2 transition-colors ${
              activeTab === tab ? 'border-brand-600 text-brand-700' : 'border-transparent text-text-muted hover:text-text-secondary hover:border-text-secondary/20'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={stats.totalUsers} />
          <StatCard title="Total Items" value={stats.totalItems} />
          <StatCard title="Total Bookings" value={stats.totalBookings} />
          <StatCard title="Active Rentals" value={stats.activeRentals} />
          <StatCard title="Pending Requests" value={stats.pendingRequests} />
          <StatCard title="Accepted Bookings" value={stats.acceptedBookings} />
          <StatCard title="Returned Bookings" value={stats.returnedBookings} />
          <StatCard title="Rejected/Cancelled" value={stats.rejectedRequests + stats.cancelledBookings} />
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-surface rounded-lg shadow-sm border border-text-secondary/20 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-text-muted border-b border-text-secondary/20">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Name</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Email</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Role</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Joined</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Items / Bookings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-background/50">
                  <td className="px-6 py-4 font-medium text-text-primary">{u.name}</td>
                  <td className="px-6 py-4 text-text-secondary">{u.email}</td>
                  <td className="px-6 py-4"><Badge status={u.role} /></td>
                  <td className="px-6 py-4 text-text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right text-text-secondary font-medium">
                    {u._count.items} / {u._count.bookings}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'items' && (
        <div className="bg-surface rounded-lg shadow-sm border border-text-secondary/20 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-text-muted border-b border-text-secondary/20">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Item Title</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Category</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Owner</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Price/Day</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map(i => (
                <tr key={i.id} className="hover:bg-background/50">
                  <td className="px-6 py-4 font-medium text-text-primary">
                    <Link href={`/items/${i.id}`} className="hover:text-brand-600 hover:underline">{i.title}</Link>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">{i.category}</td>
                  <td className="px-6 py-4 text-text-secondary">{i.owner.name}</td>
                  <td className="px-6 py-4 font-medium text-text-primary">${i.price_per_day}</td>
                  <td className="px-6 py-4"><Badge status={i.is_available ? 'AVAILABLE' : 'UNLISTED'} /></td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/items/${i.id}/passport`} className="text-brand-600 font-semibold text-xs bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors">
                      Passport
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="bg-surface rounded-lg shadow-sm border border-text-secondary/20 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-text-muted border-b border-text-secondary/20">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Item</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Renter</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Owner</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Dates</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map(b => (
                <tr key={b.id} className="hover:bg-background/50">
                  <td className="px-6 py-4 font-medium text-text-primary">
                    <Link href={`/items/${b.item.id}`} className="hover:text-brand-600 hover:underline">{b.item.title}</Link>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">{b.renter.name}</td>
                  <td className="px-6 py-4 text-text-secondary">{b.item.owner.name}</td>
                  <td className="px-6 py-4 text-text-muted text-xs font-medium">
                    {new Date(b.start_date).toLocaleDateString()} - {new Date(b.end_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Badge status={b.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string, value: number }) {
  return (
    <div className="bg-surface p-6 rounded-lg shadow-sm border border-text-secondary/20 flex flex-col justify-center">
      <h4 className="text-text-muted text-sm font-bold uppercase tracking-wider mb-2">{title}</h4>
      <p className="text-3xl font-extrabold text-text-primary">{value}</p>
    </div>
  );
}
