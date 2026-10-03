"use client";
import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';
import { SearchIcon, MapPinIcon, ShieldCheckIcon } from 'lucide-react';
import Image from 'next/image';

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
    <div className="flex-1 bg-background py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-serif text-text-primary tracking-tight mb-4">The Collection</h1>
          <p className="text-lg text-text-secondary font-light max-w-xl mx-auto">
            Discover quality goods available to borrow from your community.
          </p>
        </div>

        <div className="relative mb-16 max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-text-muted" />
          </div>
          <input 
            type="text" 
            placeholder="Search tools, cameras, gear..." 
            className="w-full bg-surface border border-text-secondary/20 pl-14 pr-6 py-5 rounded-full shadow-sm text-lg focus:ring-1 focus:ring-text-primary focus:border-text-primary outline-none transition-all placeholder:text-text-muted/60"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
            {items.map((item: any) => (
              <Link href={`/items/${item.id}`} key={item.id} className="group flex flex-col">
                <div className="w-full aspect-[4/5] bg-surface rounded-lg mb-5 overflow-hidden relative border border-text-secondary/10">
                  {item.photos?.length ? (
                    <img src={item.photos[0].url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-text-muted/30 bg-zinc-50">
                      <SearchIcon className="w-12 h-12" />
                    </div>
                  )}
                  {/* Category Chip */}
                  <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-text-primary uppercase tracking-wider">
                    {item.category}
                  </div>
                </div>
                
                <div className="flex flex-col flex-1 px-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-serif text-xl text-text-primary line-clamp-1 group-hover:text-brand-600 transition-colors">{item.title}</h3>
                  </div>
                  
                  <div className="flex items-center text-text-secondary text-sm mb-3">
                    <MapPinIcon className="w-3.5 h-3.5 mr-1" />
                    <span className="line-clamp-1">{item.city}, {item.area}</span>
                  </div>
                  
                  <div className="mt-auto flex items-end justify-between">
                    <p className="text-text-primary text-lg">${item.price_per_day}<span className="text-sm font-light text-text-secondary"> / day</span></p>
                    
                    {/* Trust indicator mock */}
                    <div className="flex items-center text-xs text-text-secondary bg-surface border border-text-secondary/10 px-2 py-1 rounded-full">
                       <ShieldCheckIcon className="w-3 h-3 mr-1 text-brand-600" />
                       Verified
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 px-6">
            <div className="w-20 h-20 bg-surface border border-text-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
               <SearchIcon className="w-8 h-8 text-text-muted" />
            </div>
            <h3 className="text-2xl font-serif text-text-primary mb-3">No items found</h3>
            <p className="text-text-secondary mb-8 font-light">We couldn't find any items matching your search criteria.</p>
            <button 
              onClick={() => setSearch('')} 
              className="bg-transparent border border-text-secondary text-text-primary px-8 py-3 rounded-full font-medium hover:bg-surface transition-colors"
            >
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
