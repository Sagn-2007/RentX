"use client";
import { useState } from 'react';
import { fetchApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function NewItem() {
  const [formData, setFormData] = useState({
    title: '', description: '', category: '', price_per_day: '', deposit_amount: '', city: '', area: ''
  });
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price_per_day: parseFloat(formData.price_per_day),
        deposit_amount: parseFloat(formData.deposit_amount),
      };
      await fetchApi('/items', { method: 'POST', body: JSON.stringify(payload) });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex justify-center">
      <div className="max-w-2xl w-full bg-white p-8 border rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold mb-6">List an Item</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input name="title" placeholder="Title" required className="border p-2 rounded" onChange={handleChange} />
          <textarea name="description" placeholder="Description" required className="border p-2 rounded h-24" onChange={handleChange} />
          <input name="category" placeholder="Category (e.g. Tools, Camping)" required className="border p-2 rounded" onChange={handleChange} />
          
          <div className="grid grid-cols-2 gap-4">
            <input name="price_per_day" type="number" step="0.01" placeholder="Price per day" required className="border p-2 rounded" onChange={handleChange} />
            <input name="deposit_amount" type="number" step="0.01" placeholder="Deposit amount" required className="border p-2 rounded" onChange={handleChange} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input name="city" placeholder="City" required className="border p-2 rounded" onChange={handleChange} />
            <input name="area" placeholder="Area / Neighborhood" required className="border p-2 rounded" onChange={handleChange} />
          </div>

          <button type="submit" className="bg-black text-white font-medium py-3 rounded mt-4">Create Listing</button>
        </form>
      </div>
    </div>
  );
}
