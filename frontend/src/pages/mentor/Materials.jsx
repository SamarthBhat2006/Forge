import { Plus } from 'lucide-react';

export default function Materials() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-primary">Materials Library</h1>
          <p className="text-body text-secondary mt-2">Manage slides and recordings for all sessions.</p>
        </div>
        
        <button className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Material
        </button>
      </div>

      <div className="flex gap-4 items-center">
        <select className="input bg-surface border-border-subtle w-48 text-primary">
          <option value="">All Months</option>
          <option value="4">Month 4</option>
          <option value="5">Month 5</option>
          <option value="6">Month 6</option>
        </select>
        
        <input 
          type="text"
          className="input flex-1 bg-surface border-border-subtle"
          placeholder="Search materials..."
        />
      </div>

      <div className="card bg-surface rounded-xl p-12 border border-border-subtle shadow-card flex items-center justify-center text-tertiary text-body-lg">
        No materials found.
      </div>
    </div>
  );
}
