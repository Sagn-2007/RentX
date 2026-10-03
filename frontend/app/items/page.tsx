"use client";
import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';
import { SearchIcon, MapPinIcon } from 'lucide-react';

export default function Items() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadItems = async () => {
    try {
      const data = await fetchApi(`/items?search=${search}`);
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [search]);

  return (
    <div className="flex-1 bg-slate-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Browse Marketplace</h1>
          <p className="text-lg text-slate-600">Discover items available for rent in your area.</p>
        </div>

        <div className="relative mb-12 max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-slate-400" />
          </div>
          <input 
            type="text" 
            placeholder="Search for tools, cameras, camping gear..." 
            className="w-full border border-slate-300 pl-12 pr-4 py-4 rounded-xl shadow-sm text-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <p className="text-slate-500 font-medium">Loading items...</p>
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item: any) => (
              <Link href={`/items/${item.id}`} key={item.id} className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col">
                <div className="h-56 bg-slate-100 flex items-center justify-center text-slate-400 relative overflow-hidden">
                  {item.photos?.length ? (
                    <img src={item.photos[0].url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <span className="font-medium text-sm">No photo available</span>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-xl text-slate-900 line-clamp-1">{item.title}</h3>
                  </div>
                  <p className="text-slate-500 text-sm font-medium mb-4">{item.category}</p>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center text-slate-500 text-sm">
                      <MapPinIcon className="w-4 h-4 mr-1" />
                      <span className="line-clamp-1">{item.city}, {item.area}</span>
                    </div>
                    <p className="font-bold text-brand-600 text-lg">${item.price_per_day}<span className="text-sm font-normal text-slate-500"> / day</span></p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center bg-white border border-slate-200 rounded-2xl py-20 px-6">
            <SearchIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No items found</h3>
            <p className="text-slate-500 mb-6">We couldn't find any items matching your search criteria.</p>
            <button 
              onClick={() => setSearch('')} 
              className="bg-brand-50 text-brand-700 px-6 py-2 rounded-lg font-medium hover:bg-brand-100 transition-colors"
            >
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
