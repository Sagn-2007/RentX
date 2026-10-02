"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [healthStatus, setHealthStatus] = useState<string>("Loading...");

  useEffect(() => {
    fetch("http://localhost:3001/api/health")
      .then((res) => res.json())
      .then((data) => {
        setHealthStatus(JSON.stringify(data));
      })
      .catch((error) => {
        setHealthStatus(`Error: ${error.message}`);
      });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-900 p-8">
      <main className="flex flex-col items-center gap-6 max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">RentX</h1>
        <p className="text-xl text-gray-600">Buy Nothing, Rent Everything</p>
        
        <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200 w-full">
          <h2 className="text-lg font-semibold mb-2">Backend Health Status</h2>
          <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto text-left">
            <code>{healthStatus}</code>
          </pre>
        </div>

        <div className="flex gap-4 mt-8">
          <a href="/items" className="bg-black text-white px-6 py-2 rounded-lg font-medium">Browse Items</a>
          <a href="/login" className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-medium hover:bg-gray-300">Log In</a>
          <a href="/signup" className="text-blue-600 font-medium px-4 py-2 hover:underline">Sign Up</a>
        </div>
      </main>
    </div>
  );
}
