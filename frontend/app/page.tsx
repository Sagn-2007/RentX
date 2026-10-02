"use client";

import Link from "next/link";
import { ArrowRightIcon, SearchIcon, PlusIcon, ShieldCheckIcon } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center bg-slate-50">
      <main className="w-full flex flex-col items-center">
        
        {/* Hero Section */}
        <section className="w-full max-w-6xl mx-auto px-6 pt-24 pb-20 text-center flex flex-col items-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6">
            Buy Nothing,<br />
            <span className="text-brand-600">Rent Everything.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
            The secure peer-to-peer marketplace for physical goods. Access the tools, gear, and equipment you need, right in your neighborhood.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link 
              href="/items" 
              className="inline-flex items-center justify-center gap-2 bg-brand-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-brand-700 transition-all shadow-sm hover:shadow"
            >
              <SearchIcon className="w-5 h-5" />
              Browse Marketplace
            </Link>
            <Link 
              href="/items/new" 
              className="inline-flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-300 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm hover:shadow"
            >
              <PlusIcon className="w-5 h-5" />
              List an Item
            </Link>
          </div>
        </section>

        {/* How it works */}
        <section className="w-full bg-white border-t border-slate-200 py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-16">How RentX Works</h2>
            
            <div className="grid md:grid-cols-3 gap-10 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mb-6">
                  <SearchIcon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Find</h3>
                <p className="text-slate-600">Discover items available in your local area. From power tools to party equipment.</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mb-6">
                  <ArrowRightIcon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Rent</h3>
                <p className="text-slate-600">Request the dates you need. Pick up the item locally and use it.</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldCheckIcon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Return securely</h3>
                <p className="text-slate-600">Return the item. All transactions are logged securely via Item Passports.</p>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
