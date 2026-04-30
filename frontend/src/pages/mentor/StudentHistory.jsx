import { useState } from 'react';
import { Search } from 'lucide-react';

export default function StudentHistory() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-h1 text-primary">Student History</h1>
        <p className="text-body text-secondary mt-2">View detailed attendance history for individual students.</p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-tertiary" />
        <input 
          type="text" 
          className="input w-full pl-12 h-14 text-body-lg rounded-xl bg-surface border-border-subtle shadow-card"
          placeholder="Search by student name or USN..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="card bg-surface rounded-xl p-12 border border-border-subtle shadow-card flex items-center justify-center text-tertiary text-body-lg">
        Search and select a student to view their history.
      </div>
    </div>
  );
}
