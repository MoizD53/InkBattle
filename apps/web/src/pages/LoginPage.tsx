import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { loginAsGuest } = useAuthStore();
  const navigate = useNavigate();

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setIsLoading(true);
    try {
      await loginAsGuest(username);
      navigate('/lobby');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass w-full max-w-md p-8 rounded-3xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2">Welcome Back</h1>
          <p className="text-slate-500">Choose a nickname to start playing</p>
        </div>

        <form onSubmit={handleGuestLogin} className="space-y-4">
          <div>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nickname" 
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary-500 outline-none"
              maxLength={20}
              required
            />
          </div>
          
          <Button type="submit" loading={isLoading} className="w-full py-6 text-lg rounded-xl">
            Play as Guest
          </Button>
        </form>
      </motion.div>
    </div>
  );
}