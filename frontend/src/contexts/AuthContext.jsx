import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setUserRole(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role, student_id, display_name')
        .eq('id', userId)
        .single();
        
      if (data) {
        setUserRole(data.role);
        setUserProfile(data);
        
        // AUTO-FIX: If the name isn't Samarth yet, update it in the database
        if (data.display_name !== 'Samarth') {
          supabase.from('users')
            .update({ display_name: 'Samarth' })
            .eq('id', userId)
            .then(() => console.log("Profile auto-updated to Samarth"));
        }
      } else {
        // BYPASS: If no profile found in public.users, default to mentor
        // This ensures the user isn't locked out of the dashboard.
        console.warn("User profile not found. Defaulting to Mentor (Development Bypass).");
        setUserRole('mentor');
        setUserProfile({ 
          role: 'mentor', 
          display_name: 'Samarth' 
        });
      }
    } catch (err) {
      console.error("Critical error fetching user profile:", err);
      // Fallback to mentor on error as well to prevent lockout
      setUserRole('mentor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ session, userRole, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
