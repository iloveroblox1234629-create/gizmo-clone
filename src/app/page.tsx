"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2 } from 'lucide-react';

interface User {
  id: string;
  username: string;
  createdAt: number;
}

const STORAGE_USERS_KEY = 'gizmo_users';
const STORAGE_CURRENT_USER_KEY = 'gizmo_current_user';

function getUsers(): User[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_USERS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveUser(user: User): void {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userId = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
  if (!userId) return null;
  const users = getUsers();
  return users.find(u => u.id === userId) || null;
}

function setCurrentUser(userId: string): void {
  localStorage.setItem(STORAGE_CURRENT_USER_KEY, userId);
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'landing' | 'create' | 'login'>('landing');
  const [username, setUsername] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleCreateAccount = async () => {
    if (!username.trim()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const users = getUsers();
      if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        setError('Username already taken');
        return;
      }

      const newUser: User = {
        id: crypto.randomUUID(),
        username: username.trim(),
        createdAt: Date.now(),
      };

      saveUser(newUser);
      setCurrentUser(newUser.id);
      router.replace('/dashboard');
    } catch {
      setError('Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginUsername.trim()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const users = getUsers();
      const user = users.find(u => u.username.toLowerCase() === loginUsername.toLowerCase());
      
      if (!user) {
        setError('User not found');
        return;
      }

      setCurrentUser(user.id);
      router.replace('/dashboard');
    } catch {
      setError('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const showLoginForm = () => {
    setMode('login');
    setError(null);
  };

  const showCreateForm = () => {
    setMode('create');
    setError(null);
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full relative z-10">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-display font-black flex items-center justify-center gap-3 text-primary tracking-tight">
          <Sparkles className="w-12 h-12 drop-shadow-[0_0_15px_rgba(255,135,190,0.5)]" />
          Gizmo
        </h1>
        <p className="text-on-surface-variant font-body mt-2 text-lg">
          Turn notes into knowledge
        </p>
      </div>

      {mode === 'landing' && (
        <div className="glass-panel rounded-[2rem] p-8 w-full space-y-6">
          <button
            onClick={showCreateForm}
            className="w-full py-4 gradient-primary text-on-primary font-bold text-lg rounded-full glow-hover flex justify-center items-center gap-2"
          >
            Create Account
          </button>
          <button
            onClick={showLoginForm}
            className="w-full py-4 bg-surface-container text-on-surface font-bold text-lg rounded-full hover:bg-surface-container-high transition-all border border-outline-variant/30"
          >
            Login
          </button>
        </div>
      )}

      {(mode === 'create' || mode === 'login') && (
        <div className="glass-panel rounded-[2rem] p-8 w-full space-y-6">
          <button
            onClick={() => router.back()}
            className="text-sm text-on-surface-variant hover:text-primary transition-colors"
          >
            ← Back
          </button>
          
          <h2 className="text-2xl font-display font-bold text-on-surface">
            {mode === 'create' ? 'Create Account' : 'Login'}
          </h2>

          {mode === 'create' && (
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full p-4 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition-all font-body text-lg"
              autoFocus
            />
          )}

          {mode === 'login' && (
            <input
              type="text"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              placeholder="Username"
              className="w-full p-4 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition-all font-body text-lg"
              autoFocus
            />
          )}

          {error && (
            <div className="text-error text-sm text-center bg-error/10 py-2 rounded-xl">
              {error}
            </div>
          )}

          <button
            onClick={mode === 'create' ? handleCreateAccount : handleLogin}
            disabled={isLoading || (mode === 'create' ? !username.trim() : !loginUsername.trim())}
            className="w-full py-4 gradient-primary text-on-primary font-bold text-lg rounded-full glow-hover flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Please wait...
              </>
            ) : (
              mode === 'create' ? 'Create Account' : 'Login'
            )}
          </button>
        </div>
      )}
    </main>
  );
}