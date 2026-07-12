export function Avatar({ username, url, size = 'md', status }: { username: string, url?: string, size?: 'sm' | 'md' | 'lg', status?: 'online' | 'offline' }) {
  const sizes = { sm: 'w-6 h-6 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl' };
  const initials = username.substring(0, 2).toUpperCase();
  
  return (
    <div className={`relative inline-block rounded-full bg-slate-200 dark:bg-slate-700 shrink-0 ${sizes[size]}`}>
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
}