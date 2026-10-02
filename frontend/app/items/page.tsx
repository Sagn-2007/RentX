"use client";
import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Items() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const router = useRouter();

  const loadItems = async () => {
    try {
      const data = await fetchApi(`/items?search=${search}`);
      setItems(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadItems();
  }, [search]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Browse Items</h1>
          <div className="flex gap-4">
            <Link href="/dashboard" className="text-blue-600 font-medium pt-2">Dashboard</Link>
          </div>
        </div>

        <input 
          type="text" 
          placeholder="Search items..." 
          className="w-full border p-3 rounded mb-8 shadow-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item: any) => (
            <Link href={`/items/${item.id}`} key={item.id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
              <div className="h-48 bg-gray-200 flex items-center justify-center text-gray-400">
                {item.photo_urls?.length ? <img src={item.photo_urls[0]} alt={item.title} className="w-full h-full object-cover" /> : 'No photo'}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.category} • {item.city}, {item.area}</p>
                <p className="mt-2 font-semibold">${item.price_per_day} / day</p>
              </div>
            </Link>
          ))}
        </div>
        
        {items.length === 0 && <p className="text-center text-gray-500 mt-12">No items found.</p>}
      </div>
    </div>
  );
}
