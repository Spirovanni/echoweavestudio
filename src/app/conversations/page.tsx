import React from 'react';

export default function ConversationsPage() {
  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-800">Conversations & Idea Board</h1>
        <p className="text-sm text-gray-500">Drop raw dialogue and audio transcripts here. AI will extract plot points.</p>
      </header>

      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Sample Chat Message */}
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 font-bold shrink-0">X</div>
            <div className="bg-white p-4 rounded-lg rounded-tl-none border border-gray-200 shadow-sm w-full">
              <p className="text-gray-800">What if the main character discovers the artifact wasn't stolen, but given away willingly?</p>
            </div>
          </div>

          {/* AI Extracted Note */}
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-800 font-bold shrink-0">AI</div>
            <div className="bg-purple-50 p-4 rounded-lg rounded-tl-none border border-purple-200 shadow-sm w-full">
              <div className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-2">Plot Point Extracted</div>
              <p className="text-purple-900 text-sm">Action item: Update Chapter 2 outline to reflect the voluntary handover of the artifact. This changes the antagonist's motivation.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input 
            type="text" 
            placeholder="Type a new idea or paste a transcript..." 
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
          />
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">Add</button>
        </div>
      </div>
    </div>
  );
}
