import fs from 'node:fs/promises';
import path from 'node:path';

const root = 'd:/Scribble/apps/web';

const dirs = [
  '',
  'public',
  'src',
  'src/assets',
  'src/components',
  'src/components/ui',
  'src/components/game',
  'src/components/chat',
  'src/components/layout',
  'src/features',
  'src/features/drawing',
  'src/hooks',
  'src/lib',
  'src/pages',
  'src/stores',
];

const files = {
  'package.json': `{
  "name": "@scribble/web",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@scribble/shared": "workspace:*",
    "framer-motion": "^12.4.2",
    "lucide-react": "^0.475.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router": "^7.1.1",
    "socket.io-client": "^4.8.1",
    "zustand": "^5.0.3"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/react": "^19.0.8",
    "@types/react-dom": "^19.0.3",
    "@vitejs/plugin-react-swc": "^3.5.0",
    "eslint": "^9.19.0",
    "tailwindcss": "^4.0.0",
    "typescript": "~5.7.2",
    "vite": "^6.0.5"
  }
}`,
  'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/socket.io': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },
});`,
  'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}`,
  'index.html': `<!DOCTYPE html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta name="theme-color" content="#0f172a" />
    <title>Scribble — Draw, Guess, Win</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script>
      if (localStorage.getItem('theme') === 'light' || (!('theme' in localStorage) && !window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.remove('dark')
      }
    </script>
  </head>
  <body class="bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-50 font-sans antialiased overflow-hidden">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
  'src/index.css': `@import "tailwindcss";

@theme {
  --color-primary-50: #eef2ff;
  --color-primary-100: #e0e7ff;
  --color-primary-200: #c7d2fe;
  --color-primary-300: #a5b4fc;
  --color-primary-400: #818cf8;
  --color-primary-500: #6366f1;
  --color-primary-600: #4f46e5;
  --color-primary-700: #4338ca;
  --color-primary-800: #3730a3;
  --color-primary-900: #312e81;
  --color-primary-950: #1e1b4b;
  --font-sans: "Inter", system-ui, sans-serif;
}

@custom-variant dark (&:where(.dark, .dark *));

@layer utilities {
  .glass {
    @apply bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-white/20 dark:border-slate-700/50;
  }
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  @apply bg-slate-300 dark:bg-slate-700 rounded-full;
}
::-webkit-scrollbar-thumb:hover {
  @apply bg-slate-400 dark:bg-slate-600;
}

html, body, #root {
  height: 100%;
  width: 100%;
  overscroll-behavior-y: none;
}`,
  'src/main.tsx': `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);`,
  'src/App.tsx': `import { Routes, Route } from 'react-router';
import { Suspense, lazy } from 'react';
import { Layout } from './components/layout/Layout';
import { Spinner } from './components/ui/Spinner';

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const LobbyPage = lazy(() => import('./pages/LobbyPage'));
const RoomPage = lazy(() => import('./pages/RoomPage'));
const GamePage = lazy(() => import('./pages/GamePage'));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={
          <Suspense fallback={<div className="flex h-full items-center justify-center"><Spinner size="lg" /></div>}>
            <HomePage />
          </Suspense>
        } />
        <Route path="/login" element={
          <Suspense fallback={<div className="flex h-full items-center justify-center"><Spinner size="lg" /></div>}>
            <LoginPage />
          </Suspense>
        } />
        <Route path="/lobby" element={
          <Suspense fallback={<div className="flex h-full items-center justify-center"><Spinner size="lg" /></div>}>
            <LobbyPage />
          </Suspense>
        } />
        <Route path="/room/:code" element={
          <Suspense fallback={<div className="flex h-full items-center justify-center"><Spinner size="lg" /></div>}>
            <RoomPage />
          </Suspense>
        } />
        <Route path="/game/:roomId" element={
          <Suspense fallback={<div className="flex h-full items-center justify-center"><Spinner size="lg" /></div>}>
            <GamePage />
          </Suspense>
        } />
      </Route>
    </Routes>
  );
}`,
  'src/components/layout/Layout.tsx': `import { Outlet } from 'react-router';
import { Header } from './Header';
import { ToastContainer } from '../ui/Toast';

export function Layout() {
  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <Header />
      <main className="flex-1 relative overflow-hidden">
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  );
}`,
  'src/components/layout/Header.tsx': `import { Link } from 'react-router';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { Moon, Sun, Monitor, LogOut } from 'lucide-react';
import { Avatar } from '../ui/Avatar';

export function Header() {
  const { theme, setTheme } = useThemeStore();
  const { user, logout } = useAuthStore();

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const ThemeIcon = theme === 'system' ? Monitor : theme === 'light' ? Sun : Moon;

  return (
    <header className="h-16 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-40 relative">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl leading-none tracking-tighter">
          S
        </div>
        <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
          Scribble
        </span>
      </Link>
      
      <div className="flex items-center gap-3">
        <button
          onClick={cycleTheme}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          title={\`Theme: \${theme}\`}
        >
          <ThemeIcon className="w-5 h-5" />
        </button>
        
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
              <Avatar username={user.username} url={user.avatar} size="sm" />
              <span className="text-sm font-medium">{user.username}</span>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            Log In
          </Link>
        )}
      </div>
    </header>
  );
}`,
  'src/components/ui/Spinner.tsx': `export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <svg className={\`animate-spin text-primary-500 \${sizes[size]}\`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}`,
  'src/components/ui/Avatar.tsx': `export function Avatar({ username, url, size = 'md', status }: { username: string, url?: string, size?: 'sm' | 'md' | 'lg', status?: 'online' | 'offline' }) {
  const sizes = { sm: 'w-6 h-6 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl' };
  const initials = username.substring(0, 2).toUpperCase();
  
  return (
    <div className={\`relative inline-block rounded-full bg-slate-200 dark:bg-slate-700 shrink-0 \${sizes[size]}\`}>
      {url ? (
        <img src={url} alt={username} className="w-full h-full rounded-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 dark:text-slate-300 rounded-full">
          {initials}
        </div>
      )}
      {status === 'online' && (
        <div className="absolute bottom-0 right-0 w-1/4 h-1/4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></div>
      )}
    </div>
  );
}`,
  'src/components/ui/Toast.tsx': `import { create } from 'zustand';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: string; type: ToastType; message: string; }
interface ToastStore { toasts: Toast[]; addToast: (type: ToastType, message: string) => void; removeToast: (id: string) => void; }

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (type, message) => set((state) => ({ toasts: [...state.toasts, { id: Math.random().toString(36).substring(7), type, message }] })),
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }))
}));

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast, onRemove: () => void }) {
  useEffect(() => {
    const t = setTimeout(onRemove, 4000);
    return () => clearTimeout(t);
  }, [onRemove]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      className="pointer-events-auto flex items-center gap-3 bg-white dark:bg-slate-800 shadow-lg rounded-xl px-4 py-3 border border-slate-100 dark:border-slate-700 max-w-sm"
    >
      {icons[toast.type]}
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{toast.message}</p>
      <button onClick={onRemove} className="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}`,
  'src/components/ui/Button.tsx': `import { forwardRef, ButtonHTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Spinner } from './Spinner';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "disabled"> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ 
  className = '', variant = 'primary', size = 'md', loading, disabled, children, ...props 
}, ref) => {
  const base = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 rounded-xl disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-primary-500 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700",
    ghost: "text-slate-700 hover:bg-slate-100 focus:ring-slate-500 dark:text-slate-300 dark:hover:bg-slate-800",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm",
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  
  return (
    <motion.button
      ref={ref}
      whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
      className={\`\${base} \${variants[variant]} \${sizes[size]} \${className}\`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <div className="mr-2"><Spinner size="sm" /></div>}
      {children}
    </motion.button>
  );
});`,
  'src/stores/themeStore.ts': `import { create } from 'zustand';

type Theme = 'dark' | 'light' | 'system';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeStore>((set) => {
  const saved = localStorage.getItem('theme') as Theme | null;
  const initial = saved || 'system';
  
  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };
  
  applyTheme(initial);

  return {
    theme: initial,
    setTheme: (theme: Theme) => {
      localStorage.setItem('theme', theme);
      applyTheme(theme);
      set((state) => ({ ...state, theme }));
    }
  };
});`,
  'src/stores/authStore.ts': `import { create } from 'zustand';
import type { User } from '@scribble/shared';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loginAsGuest: (username: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  
  loginAsGuest: async (username: string) => {
    const res = await fetch('/api/auth/guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    
    if (!res.ok) throw new Error('Login failed');
    
    const { token, user } = await res.json();
    localStorage.setItem('token', token);
    set({ token, user, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, isAuthenticated: false });
  }
}));`,
  'src/pages/HomePage.tsx': `import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl">
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400">
          Draw. Guess. Win.
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 mb-10">
          The next-generation multiplayer drawing game. Fast, beautiful, and hilarious.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/login">
            <Button size="lg" className="w-full sm:w-auto text-lg px-8">Play Now</Button>
          </Link>
          <Button variant="ghost" size="lg" className="w-full sm:w-auto text-lg px-8">How it Works</Button>
        </div>
      </motion.div>
    </div>
  );
}`,
  'src/pages/LoginPage.tsx': `import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { useToastStore } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginAsGuest } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setLoading(true);
    try {
      await loginAsGuest(username);
      navigate('/lobby');
    } catch (err) {
      addToast('error', 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass p-8 rounded-2xl shadow-xl max-w-sm w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">Choose your name</h2>
        <form onSubmit={handleGuestLogin} className="flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="Username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
            required
            autoFocus
            maxLength={15}
          />
          <Button type="submit" size="lg" loading={loading} disabled={!username.trim()}>
            Play as Guest
          </Button>
        </form>
      </motion.div>
    </div>
  );
}`,
  'src/pages/LobbyPage.tsx': `export default function LobbyPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 text-center">
      <h2 className="text-3xl font-bold mb-4">Lobby</h2>
      <p className="text-slate-500 mb-8">Work in progress...</p>
    </div>
  );
}`,
  'src/pages/RoomPage.tsx': `export default function RoomPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 text-center">
      <h2 className="text-3xl font-bold mb-4">Room</h2>
      <p className="text-slate-500 mb-8">Work in progress...</p>
    </div>
  );
}`,
  'src/pages/GamePage.tsx': `export default function GamePage() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 text-center">
      <h2 className="text-3xl font-bold mb-4">Game</h2>
      <p className="text-slate-500 mb-8">Work in progress...</p>
    </div>
  );
}`
};

async function scaffold() {
  for (const dir of dirs) {
    if (dir) await fs.mkdir(path.join(root, dir), { recursive: true });
  }

  for (const [filepath, content] of Object.entries(files)) {
    await fs.writeFile(path.join(root, filepath), content, 'utf8');
  }
  console.log('Frontend scaffolded successfully!');
}

scaffold().catch(console.error);
