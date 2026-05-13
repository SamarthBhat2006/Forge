import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Sparkles, Mail, Lock, Loader2, ArrowRight, BrainCircuit, Globe, ShieldCheck } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-void flex items-center justify-center p-6 relative overflow-hidden font-body selection:bg-accent-glow/30 selection:text-white">
            {/* Premium Cosmic Background */}
            <div className="cosmic-mesh"></div>
            <div className="cosmic-stars"></div>

            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-accent-glow/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4"></div>
            <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-accent-vibrant/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/4"></div>

            <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">

                {/* Left Side: Brand & Social Proof */}
                <div className="hidden lg:flex flex-col gap-12 page-entrance">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-gradient-to-tr from-accent-glow to-accent-vibrant rounded-2xl flex items-center justify-center shadow-glow">
                            <Sparkles className="h-7 w-7 text-white" />
                        </div>
                        <div className="text-3xl font-display font-bold text-white tracking-tight">ForgeTrack</div>
                    </div>

                    <div className="space-y-6">
                        <h1 className="text-6xl font-display font-bold text-white leading-[1.1] tracking-tight">
                            Architecting the <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-glow to-accent-vibrant">Future of Education</span>
                        </h1>
                        <p className="text-secondary text-xl max-w-md leading-relaxed">
                            The next-generation attendance and resource management platform for elite mentors and proactive students.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-accent-glow">
                                <BrainCircuit className="h-5 w-5" />
                                <span className="text-sm font-black uppercase tracking-widest">AI Intelligence</span>
                            </div>
                            <p className="text-tertiary text-sm">Automated mapping and predictive student analytics.</p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-success">
                                <ShieldCheck className="h-5 w-5" />
                                <span className="text-sm font-black uppercase tracking-widest">Enterprise Security</span>
                            </div>
                            <p className="text-tertiary text-sm">Military-grade RLS protection for all academic records.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-6 glass-card bg-white/[0.02] border-white/5 max-w-sm">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-10 w-10 rounded-full border-2 border-void bg-white/10 flex items-center justify-center text-[10px] font-bold">
                                    {String.fromCharCode(64 + i)}
                                </div>
                            ))}
                        </div>
                        <div className="text-xs">
                            <div className="text-primary font-bold">Join 2,400+ Mentors</div>
                            <div className="text-tertiary mt-0.5">Managing classrooms at scale</div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="flex justify-center lg:justify-end page-entrance" style={{ animationDelay: '0.2s' }}>
                    <div className="w-full max-w-[460px] glass-card p-10 md:p-12 border-white/10 bg-white/[0.03]">
                        <div className="mb-10">
                            <h2 className="text-3xl font-display font-bold text-white tracking-tight">Welcome Back</h2>
                            <p className="text-secondary mt-2 font-medium">Please enter your credentials to access the terminal.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            {error && (
                                <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in shake-in-from-top">
                                    <ShieldCheck className="h-4 w-4" /> {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1">Work Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-tertiary group-focus-within:text-accent-glow transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        className="input-premium w-full pl-12 h-14 bg-white/[0.02]"
                                        placeholder="name@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-[10px] font-black text-tertiary uppercase tracking-widest">Access Key</label>
                                    <a href="#" className="text-[10px] font-black text-accent-glow uppercase tracking-widest hover:underline">Reset Key?</a>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-tertiary group-focus-within:text-accent-glow transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        className="input-premium w-full pl-12 h-14 bg-white/[0.02]"
                                        placeholder="••••••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <input type="checkbox" id="remember" className="h-4 w-4 rounded border-white/10 bg-white/5 text-accent-glow focus:ring-accent-glow/20" />
                                <label htmlFor="remember" className="text-xs font-medium text-tertiary">Stay authenticated for 30 days</label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-premium w-full h-16 text-lg font-bold shadow-glow mt-4"
                            >
                                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                                    <span className="flex items-center gap-2">
                                        Initialize Session <ArrowRight className="h-5 w-5" />
                                    </span>
                                )}
                            </button>
                        </form>

                        <div className="mt-10 pt-10 border-t border-white/5 text-center">
                            <p className="text-tertiary text-xs font-medium flex items-center justify-center gap-2">
                                <Globe className="h-3.5 w-3.5" />
                                Protected by ForgeSecure™ Distributed Identity
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Branding */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-tertiary/20 uppercase tracking-[0.5em] pointer-events-none">
                ForgeTrack Architecture v1.1.0-Stable
            </div>
        </div>
    );
}
