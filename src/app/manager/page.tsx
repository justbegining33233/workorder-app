import React from 'react';

export default function ManagerDashboard() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col p-4">
        <h2 className="text-2xl font-bold mb-8">Manager</h2>
        <nav className="flex flex-col gap-4">
          <button className="text-left py-2 px-4 rounded hover:bg-gray-700">All Photos</button>
          <button className="text-left py-2 px-4 rounded hover:bg-gray-700">Upload Photo</button>
          <button className="text-left py-2 px-4 rounded hover:bg-gray-700">Work Order Photos</button>
          <button className="text-left py-2 px-4 rounded hover:bg-gray-700">Audit Trail</button>
        </nav>
      </aside>
      {/* Main content placeholder */}
      <main className="flex-1 p-8 bg-gray-50">
        <h1 className="text-3xl font-bold mb-4">Manager Dashboard</h1>
        <p>Select an option from the menu.</p>
      </main>
    </div>
  );
}
