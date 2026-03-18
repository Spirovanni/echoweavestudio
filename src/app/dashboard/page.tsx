import React from 'react';

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">EchoWeave Studio Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Xavier & Natalie</span>
          <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Active Projects */}
          <div className="col-span-2 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Active Chapters</h2>
            <div className="space-y-3">
              <div className="p-4 border border-gray-100 rounded bg-gray-50 flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-800">Chapter 1: The Awakening</h3>
                  <p className="text-xs text-gray-500">Last edited 2 hours ago</p>
                </div>
                <button className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">Open</button>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
            <ul className="space-y-4">
              <li className="text-sm">
                <span className="font-medium">Natalie</span> left a comment on Chapter 1.
                <div className="text-xs text-gray-400 mt-1">10 mins ago</div>
              </li>
              <li className="text-sm">
                <span className="font-medium">The Muse (AI)</span> generated a new concept art.
                <div className="text-xs text-gray-400 mt-1">1 hour ago</div>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
