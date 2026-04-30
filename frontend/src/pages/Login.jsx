import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const [tab, setTab] = useState('mentor'); // 'mentor' | 'student'
  const [identifier, setIdentifier] = useState(''); // email or usn
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let email = identifier;
      
      // If student login, format the USN as email per spec: usn@forge.local
      if (tab === 'student') {
        email = `${identifier.toLowerCase()}@forge.local`;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // The AuthContext and RoleGuard will handle the role-based redirection,
      // but we can manually route them right here to be snappy.
      // Wait for auth context to catch up? It's better to just navigate to '/' and let RoleGuard handle it.
      // Or we can check the public.users role ourselves. Let's just navigate to '/' or the intended location.
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
      
    } catch (err) {
      console.error(err);
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-void relative overflow-hidden">
      {/* Cosmic Glow */}
      <div className="absolute inset-0 pointer-events-none z-0" style={{ backgroundImage: 'var(--glow-cosmic)' }}></div>
      
      <div className="card max-w-[440px] w-full p-12 flex flex-col z-10 bg-surface border border-border-subtle shadow-card rounded-2xl">
        <div className="mb-10 text-center">
          <div className="text-display-md font-display font-bold text-primary tracking-tight mb-2">ForgeTrack</div>
          <div className="text-body text-secondary">Attendance & Materials Portal</div>
        </div>

        {/* Tab Toggle */}
        <div className="flex p-1 bg-surface-inset border border-border-default rounded-xl mb-8">
          <button 
            className={`flex-1 py-2 text-body-sm font-medium rounded-lg transition-colors ${tab === 'mentor' ? 'bg-surface-raised text-primary shadow-sm' : 'text-secondary hover:text-primary'}`}
            onClick={() => { setTab('mentor'); setError(''); }}
            type="button"
          >
            Mentor Login
          </button>
          <button 
            className={`flex-1 py-2 text-body-sm font-medium rounded-lg transition-colors ${tab === 'student' ? 'bg-surface-raised text-primary shadow-sm' : 'text-secondary hover:text-primary'}`}
            onClick={() => { setTab('student'); setError(''); }}
            type="button"
          >
            Student Login
          </button>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div>
            <label className="block text-label text-secondary mb-2 uppercase tracking-widest">
              {tab === 'mentor' ? 'Email Address' : 'USN'}
            </label>
            <input 
              type={tab === 'mentor' ? 'email' : 'text'}
              className="input w-full"
              placeholder={tab === 'mentor' ? 'name@theboringpeople.in' : '4SH24CS001'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-label text-secondary mb-2 uppercase tracking-widest">Password</label>
            <input 
              type="password"
              className="input w-full"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="text-caption text-danger-fg bg-danger-bg border border-danger-border p-3 rounded-lg">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary w-full mt-2 h-12 flex justify-center items-center"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
