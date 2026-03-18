import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles } from 'lucide-react';

export function Login() {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Inloggningen misslyckades';
      if (!message.includes('popup-closed-by-user')) {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background aurora-bg grain-overlay flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-sm">
        {/* Glass card */}
        <div className="glass-card rounded-2xl p-8 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-aurora-cyan to-aurora-violet flex items-center justify-center shadow-lg glow-cyan">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
          <h1 className="font-serif text-3xl tracking-tight mb-1">
            <span className="text-foreground">SaaS</span>
            <span className="text-aurora-cyan">översikt</span>
          </h1>
          <p className="text-muted-foreground text-sm mb-8">
            Hantera din SaaS-portfölj
          </p>

          {/* Google login button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-white/[0.06] border border-border/50 hover:bg-white/[0.10] hover:border-border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-sm font-medium text-foreground">
              {loading ? 'Loggar in...' : 'Logga in med Google'}
            </span>
          </button>

          {/* Error message */}
          {error && (
            <p className="mt-4 text-sm text-aurora-rose bg-aurora-rose/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-muted-foreground/40 mt-6 tracking-wider uppercase">
          PeakAutomation AB
        </p>
      </div>
    </div>
  );
}
