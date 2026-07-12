import { Link } from 'react-router';
import { useThemeStore } from '../../stores/themeStore';
import { Moon, Sun, Monitor } from 'lucide-react';

export function Header() {
  const { theme, setTheme } = useThemeStore();

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const ThemeIcon = theme === 'system' ? Monitor : theme === 'light' ? Sun : Moon;

  return (
    <header className="h-16 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-40 relative">
      <Link to="/" className="flex items-center gap-2.5">
        <img
  src={new URL('/assets/logo.jpg', import.meta.env.BASE_URL).toString()}
          alt="Scribble"
          width={28}


          height={28}
          className="select-none"
          style={{ mixBlendMode: 'screen' }}
          draggable={false}
        />
        <span className="font-bold text-xl tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
          InkBattle
        </span>
      </Link>
      
      <div className="flex items-center gap-3">
        <button
          onClick={cycleTheme}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          title={`Theme: ${theme}`}
        >
          <ThemeIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}