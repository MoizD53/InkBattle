import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Users, X, ChevronDown } from 'lucide-react';
import { useSocketStore } from '../stores/socketStore';
import { useAuthStore } from '../stores/authStore';
import { useGameStore } from '../stores/gameStore';
import { DrawingCanvas } from '../features/drawing/DrawingCanvas';
import { DrawingToolbar } from '../features/drawing/DrawingToolbar';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Avatar } from '../components/ui/Avatar';
import type { GameState, RoundResult, GameResult, ChatMessage } from '@scribble/shared';
import { WordSelectionOverlay } from '../features/game/WordSelectionOverlay';
import { RoundResultOverlay } from '../features/game/RoundResultOverlay';
import { GameOverOverlay } from '../features/game/GameOverOverlay';

export default function GamePage() {
  const { socket, isConnected } = useSocketStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const {
    gameState,
    chatMessages,
    wordChoices,
    lastRoundResult,
    gameResult,
    countdown,
    setGameState,
    addChatMessage,
    setWordChoices,
    setCountdown,
    setRoundResult,
    setGameResult,
    clearState
  } = useGameStore();

  const [chatInput, setChatInput] = useState('');
  const [engine, setEngine] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPlayersOpen, setIsPlayersOpen] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, gameState?.correctGuessers]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!socket || !isConnected) {
      return; // Wait for socket to connect
    }

    // Socket listeners
    const onGameState = (state: GameState) => setGameState(state);
    const onCountdown = (seconds: number) => setCountdown(seconds);
    const onWordChoices = (words: string[]) => setWordChoices(words);
    const onHint = (hint: string) => {
      if (useGameStore.getState().gameState) {
        setGameState({ ...useGameStore.getState().gameState!, hint });
      }
    };
    const onCorrectGuess = (_userId: string, username: string) => {
      addChatMessage({
        id: Math.random().toString(),
        userId: 'system',
        username: 'System',
        content: `${username} guessed the word!`,
        timestamp: Date.now(),
        type: 'correct'
      });
    };
    const onCloseGuess = (userId: string) => {
      if (userId === user.id) {
        addChatMessage({
          id: Math.random().toString(),
          userId: 'system',
          username: 'System',
          content: `You are close!`,
          timestamp: Date.now(),
          type: 'close'
        });
      }
    };
    const onRoundResult = (result: RoundResult) => {
      setRoundResult(result);
      setWordChoices([]);
      addChatMessage({
        id: Math.random().toString(),
        userId: 'system',
        username: 'System',
        content: `The word was ${result.word}!`,
        timestamp: Date.now(),
        type: 'system'
      });
    };
    const onFinished = (result: GameResult) => setGameResult(result);
    const onChatMessage = (msg: ChatMessage) => addChatMessage(msg);

    socket.on('game:state', onGameState);
    socket.on('game:countdown', onCountdown);
    socket.on('game:wordChoices', onWordChoices);
    socket.on('game:hint', onHint);
    socket.on('game:correctGuess', onCorrectGuess);
    socket.on('game:closeGuess', onCloseGuess);
    socket.on('game:roundResult', onRoundResult);
    socket.on('game:finished', onFinished);
    socket.on('chat:message', onChatMessage);

    return () => {
      socket.off('game:state', onGameState);
      socket.off('game:countdown', onCountdown);
      socket.off('game:wordChoices', onWordChoices);
      socket.off('game:hint', onHint);
      socket.off('game:correctGuess', onCorrectGuess);
      socket.off('game:closeGuess', onCloseGuess);
      socket.off('game:roundResult', onRoundResult);
      socket.off('game:finished', onFinished);
      socket.off('chat:message', onChatMessage);
    };
  }, [socket, isConnected, user, navigate]);

  // Clean up on unmount
  useEffect(() => {
    return () => clearState();
  }, []);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket) return;
    
    if (gameState?.currentDrawerId !== user?.id && gameState?.phase === 'drawing') {
      socket.emit('game:guess', chatInput.trim());
      
      addChatMessage({
        id: Math.random().toString(),
        userId: user?.id || '',
        username: user?.username || 'You',
        content: chatInput.trim(),
        timestamp: Date.now(),
        type: 'message'
      });
    } else {
      socket.emit('chat:message', chatInput.trim());
    }
    
    setChatInput('');
  };

  const handleLeave = () => {
    if (socket) {
      socket.emit('room:leave');
    }
    navigate('/lobby');
  };

  if (!gameState) {
    return <div className="flex h-full items-center justify-center"><Spinner size="lg" /></div>;
  }

  const isDrawer = gameState.currentDrawerId === user?.id;

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-slate-100 dark:bg-slate-950 p-2 lg:p-4 gap-2 lg:gap-4 overflow-hidden pt-[env(safe-area-inset-top,8px)]">
      {/* Top Bar */}
      <div className="glass h-14 lg:h-16 rounded-2xl flex items-center justify-between px-4 lg:px-6 shrink-0 z-10">
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="text-xl lg:text-2xl font-bold font-mono bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-xl min-w-[2.5rem] lg:min-w-[3rem] text-center">
            {gameState.phase === 'starting' ? countdown : gameState.timeLeft}
          </div>
          <div className="text-xs lg:text-sm text-slate-500 font-medium whitespace-nowrap">Round {gameState.currentRound}/{gameState.totalRounds}</div>
        </div>
        
        <div className="text-base lg:text-2xl font-bold tracking-widest uppercase text-center truncate px-2 max-w-[40%]">
          {gameState.phase === 'starting' && 'GET READY'}
          {gameState.phase === 'selecting' && (isDrawer ? 'CHOOSE A WORD' : `${gameState.players.find(p => p.id === gameState.currentDrawerId)?.username || 'Drawer'} is choosing...`)}
          {gameState.phase === 'drawing' && (isDrawer ? gameState.word : gameState.hint)}
          {gameState.phase === 'reveal' && gameState.word}
          {gameState.phase === 'scoring' && gameState.word}
          {gameState.phase === 'finished' && 'GAME OVER'}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Mobile Toggles */}
          <button className="lg:hidden p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300" onClick={() => setIsPlayersOpen(true)}>
            <Users className="w-5 h-5" />
          </button>
          <button className="lg:hidden p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300" onClick={() => setIsChatOpen(true)}>
            <MessageCircle className="w-5 h-5" />
          </button>
          <Button variant="ghost" size="sm" onClick={handleLeave} className="hidden sm:flex">Leave</Button>
          <Button variant="ghost" size="sm" onClick={handleLeave} className="sm:hidden px-2"><X className="w-5 h-5" /></Button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex flex-1 gap-4 min-h-0 relative">
        {/* Players Sidebar (Desktop) & Bottom Sheet (Mobile) */}
        <AnimatePresence>
          {(isPlayersOpen || window.innerWidth >= 1024) && (
            <>
              {/* Backdrop for Mobile */}
              {isPlayersOpen && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
                  onClick={() => setIsPlayersOpen(false)}
                />
              )}
              
              <motion.div 
                initial={window.innerWidth < 1024 ? { y: '100%' } : { opacity: 1 }}
                animate={window.innerWidth < 1024 ? { y: 0 } : { opacity: 1 }}
                exit={window.innerWidth < 1024 ? { y: '100%' } : { opacity: 0 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                className="fixed bottom-0 left-0 right-0 h-[60dvh] lg:h-auto lg:relative lg:flex lg:w-64 glass rounded-t-3xl lg:rounded-2xl flex-col p-4 gap-2 overflow-y-auto z-50 lg:z-10 shadow-2xl lg:shadow-none bg-white dark:bg-slate-900 lg:bg-transparent lg:dark:bg-transparent"
              >
                <div className="flex items-center justify-between mb-2 shrink-0">
                  <h3 className="font-semibold text-slate-500 uppercase text-xs tracking-wider">Players</h3>
                  <button className="lg:hidden p-1 bg-slate-100 dark:bg-slate-800 rounded-full" onClick={() => setIsPlayersOpen(false)}>
                    <ChevronDown className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pb-[env(safe-area-inset-bottom,16px)] lg:pb-0">
                  {[...gameState.players].sort((a,b) => b.score - a.score).map((p, index) => {
                    const isThisDrawer = gameState.currentDrawerId === p.id;
                    const hasGuessed = gameState.correctGuessers.includes(p.id);
                    return (
                      <div key={p.id} className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${hasGuessed ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : isThisDrawer ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200' : ''}`}>
                        <div className="relative shrink-0">
                          <Avatar username={p.username} url={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${p.username}&backgroundColor=b6e3f4,c0aede,d1d4f9`} size="md" />
                          {index === 0 && gameState.phase !== 'starting' && <span className="absolute -top-2 -right-2 text-lg z-10 drop-shadow-md">👑</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate text-sm">{p.username}</div>
                          <div className="text-xs text-slate-500 font-bold">{p.score} pts</div>
                        </div>
                        {isThisDrawer && <div className="text-[10px] font-black text-primary-500 uppercase tracking-wider shrink-0">DRAWING</div>}
                        {hasGuessed && !isThisDrawer && <div className="text-[10px] font-black text-green-500 uppercase tracking-wider shrink-0">GUESSED</div>}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Canvas Area (Center) */}
        <div className="flex-1 relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
          <DrawingCanvas isDrawer={isDrawer && gameState.phase === 'drawing'} onEngineReady={setEngine} />
          <DrawingToolbar isDrawer={isDrawer && gameState.phase === 'drawing'} engine={engine} />
          
          {/* Overlays */}
          {gameState.phase === 'selecting' && isDrawer && (
            <WordSelectionOverlay choices={wordChoices} onSelect={(word) => socket?.emit('game:selectWord', word)} />
          )}
          
          {(gameState.phase === 'reveal' || gameState.phase === 'scoring') && lastRoundResult && (
            <RoundResultOverlay result={lastRoundResult} players={gameState.players} />
          )}
          
          {gameState.phase === 'finished' && gameResult && (
            <GameOverOverlay result={gameResult} onBackToLobby={() => navigate('/lobby')} />
          )}
        </div>

        {/* Chat Sidebar (Desktop) & Bottom Sheet (Mobile) */}
        <AnimatePresence>
          {(isChatOpen || window.innerWidth >= 768) && (
            <>
              {isChatOpen && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
                  onClick={() => setIsChatOpen(false)}
                />
              )}

              <motion.div 
                initial={window.innerWidth < 768 ? { y: '100%' } : { opacity: 1 }}
                animate={window.innerWidth < 768 ? { y: 0 } : { opacity: 1 }}
                exit={window.innerWidth < 768 ? { y: '100%' } : { opacity: 0 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                className="fixed bottom-0 left-0 right-0 h-[70dvh] md:h-auto md:relative md:flex md:w-80 glass rounded-t-3xl md:rounded-2xl flex-col z-50 md:z-10 shadow-2xl md:shadow-none bg-white dark:bg-slate-900 md:bg-transparent md:dark:bg-transparent"
              >
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0 flex justify-between items-center bg-slate-50 dark:bg-slate-900 rounded-t-3xl md:bg-transparent md:dark:bg-transparent">
                  <h3 className="font-semibold text-slate-500 uppercase text-xs tracking-wider">Chat & Guesses</h3>
                  <button className="md:hidden p-1 bg-slate-200 dark:bg-slate-800 rounded-full" onClick={() => setIsChatOpen(false)}>
                    <ChevronDown className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                  {chatMessages.map((msg, i) => (
                    <div key={msg.id || i} className={`text-sm ${msg.type === 'correct' ? 'bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-800 dark:text-green-200 font-medium' : msg.type === 'close' ? 'text-amber-500 font-medium' : ''}`}>
                      {msg.type !== 'system' && msg.type !== 'correct' && msg.type !== 'close' && <span className="font-bold mr-1">{msg.username}:</span>}
                      {(msg.type === 'system' || msg.type === 'close') && <span className="font-bold mr-1 text-amber-500">System:</span>}
                      <span className="break-words">{msg.content}</span>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>
                <div className="p-4 shrink-0 bg-white dark:bg-slate-900 md:bg-transparent pb-[calc(env(safe-area-inset-bottom,16px)+16px)] md:pb-4 rounded-b-2xl">
                  <form onSubmit={handleSendChat} className="flex gap-2">
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={isDrawer ? "You are drawing..." : "Type guess..."} 
                      className="flex-1 w-full px-4 py-3 md:py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none text-base md:text-sm"
                      disabled={isDrawer || gameState.correctGuessers.includes(user?.id || '') || gameState.phase !== 'drawing'}
                    />
                    <Button type="submit" disabled={!chatInput.trim() || isDrawer || gameState.correctGuessers.includes(user?.id || '') || gameState.phase !== 'drawing'} className="md:hidden px-4 rounded-xl">
                      Send
                    </Button>
                  </form>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}