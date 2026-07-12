import { Outlet } from 'react-router';
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
}