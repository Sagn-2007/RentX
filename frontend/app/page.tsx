"use client";

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import Link from "next/link";
import { ArrowRightIcon, MapPinIcon, ShieldCheckIcon, LeafIcon } from "lucide-react";
import Image from "next/image";

export default function Home() {
  const [featuredItems, setFeaturedItems] = useState([]);

  useEffect(() => {
    fetchApi('/items')
      .then((data) => {
        if (data && data.length > 0) {
          // Get up to 3 items that have photos
          const itemsWithPhotos = data.filter((item: any) => item.photos && item.photos.length > 0);
          setFeaturedItems(itemsWithPhotos.slice(0, 3));
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="flex flex-col flex-1 bg-background">
      <main className="w-full flex flex-col">
        
        {/* Hero Section */}
        <section className="w-full max-w-6xl mx-auto px-6 pt-32 pb-24 flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-200 bg-brand-50 text-brand-700 text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
              The local sharing network
            </div>
            <h1 className="text-5xl md:text-7xl font-serif text-text-primary mb-6 leading-tight">
              Everything you need.<br />
              <span className="italic text-text-secondary">Nothing you need to own.</span>
            </h1>
            <p className="text-lg md:text-xl text-text-secondary max-w-lg mb-10 leading-relaxed font-light">
              Rent tools, electronics, equipment and more from people around you. 
              Buy nothing, rent everything.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link 
                href="/items" 
                className="inline-flex items-center justify-center gap-2 bg-text-primary text-surface px-8 py-4 rounded-full font-medium text-lg hover:bg-brand-900 transition-all shadow-md hover:shadow-lg"
              >
                Browse Items
                <ArrowRightIcon className="w-5 h-5 ml-1" />
              </Link>
              <Link 
                href="/items/new" 
                className="inline-flex items-center justify-center gap-2 bg-transparent text-text-primary border border-text-secondary/30 px-8 py-4 rounded-full font-medium text-lg hover:bg-surface hover:border-text-primary transition-all"
              >
                List an Item
              </Link>
            </div>
          </div>
          
          <div className="flex-1 w-full h-[500px] lg:h-[600px] rounded-[2rem] relative flex items-center justify-center hidden md:flex">
             {/* Decorative Circles */}
             <div className="absolute inset-0 bg-brand-50/50 rounded-[2rem] -z-10 transform rotate-3"></div>
             <div className="w-64 h-64 rounded-full border border-brand-500/20 absolute -top-10 -right-10"></div>
             <div className="w-96 h-96 rounded-full border border-brand-500/20 absolute -bottom-20 -left-20"></div>
             
             {featuredItems.length >= 2 ? (
               <div className="relative w-full h-full flex items-center justify-center">
                 {featuredItems.map((item: any, index: number) => {
                   const isFirst = index === 0;
                   const isSecond = index === 1;
                   const isThird = index === 2;
                   
                   return (
                     <div 
                       key={item.id} 
                       className={`bg-surface p-4 rounded-2xl shadow-xl w-64 absolute border border-text-secondary/10 transition-transform duration-700 ease-out hover:scale-105 hover:z-20 cursor-pointer ${
                         isFirst ? 'rotate-[-6deg] -translate-x-20 -translate-y-10 z-10' : 
                         isSecond ? 'rotate-[4deg] translate-x-20 translate-y-10 z-10' : 
                         'rotate-[10deg] translate-x-40 -translate-y-20 z-0'
                       }`}
                     >
                       <div className="w-full h-48 bg-zinc-100 rounded-xl mb-3 overflow-hidden">
                         <img src={item.photos[0].url} alt={item.title} className="w-full h-full object-cover" />
                       </div>
                       <div className="text-sm font-serif font-medium text-text-primary line-clamp-1">{item.title}</div>
                       <div className="text-xs text-text-secondary mt-1">${item.price_per_day} / day</div>
                     </div>
                   );
                 })}
               </div>
             ) : (
               <div className="relative w-full h-full flex items-center justify-center">
                 <div className="bg-surface p-4 rounded-2xl shadow-xl w-64 rotate-[-6deg] -translate-x-12 -translate-y-12 absolute border border-text-secondary/10 z-10">
                   <div className="w-full h-48 bg-zinc-100 rounded-xl mb-3 overflow-hidden flex items-center justify-center text-text-muted/40">
                     <ShieldCheckIcon className="w-12 h-12" />
                   </div>
                   <div className="text-sm font-serif font-medium text-text-primary">Trusted Exchange</div>
                   <div className="text-xs text-text-secondary mt-1">Join the network</div>
                 </div>
                 <div className="bg-surface p-4 rounded-2xl shadow-xl w-64 rotate-[4deg] translate-x-12 translate-y-12 absolute border border-text-secondary/10 z-10">
                   <div className="w-full h-48 bg-brand-50 rounded-xl mb-3 overflow-hidden flex items-center justify-center text-brand-500/40">
                     <LeafIcon className="w-12 h-12" />
                   </div>
                   <div className="text-sm font-serif font-medium text-text-primary">Sustainable Choice</div>
                   <div className="text-xs text-text-secondary mt-1">Rent locally</div>
                 </div>
               </div>
             )}
          </div>
        </section>

        {/* Value Proposition */}
        <section className="w-full bg-surface border-y border-text-secondary/10 py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-serif text-text-primary mb-4">A new way to consume</h2>
              <p className="text-text-secondary max-w-xl mx-auto text-lg font-light">
                RentX is built on trust, locality, and the idea that access is better than ownership.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-12">
              <div className="flex flex-col items-start">
                <div className="w-12 h-12 bg-background border border-text-secondary/20 rounded-xl flex items-center justify-center mb-6 text-brand-600">
                  <MapPinIcon className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-medium text-text-primary mb-3">Hyperlocal Exchange</h3>
                <p className="text-text-secondary leading-relaxed font-light">
                  Find what you need from people right in your neighborhood. Less shipping, more human connection.
                </p>
              </div>
              
              <div className="flex flex-col items-start">
                <div className="w-12 h-12 bg-background border border-text-secondary/20 rounded-xl flex items-center justify-center mb-6 text-brand-600">
                  <ShieldCheckIcon className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-medium text-text-primary mb-3">Trust by Design</h3>
                <p className="text-text-secondary leading-relaxed font-light">
                  Every item has a verified Passport tracking its history and condition. Reputation keeps the community safe.
                </p>
              </div>
              
              <div className="flex flex-col items-start">
                <div className="w-12 h-12 bg-background border border-text-secondary/20 rounded-xl flex items-center justify-center mb-6 text-brand-600">
                  <LeafIcon className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-medium text-text-primary mb-3">Sustainable by Default</h3>
                <p className="text-text-secondary leading-relaxed font-light">
                  Maximize the lifespan of manufactured goods. Why buy a drill you'll use for 12 minutes in its lifetime?
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
