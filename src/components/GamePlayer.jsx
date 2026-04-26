import { motion, AnimatePresence } from 'motion/react';
import { X, Maximize2, RotateCcw } from 'lucide-react';
import { useState, useRef } from 'react';
import ChessGame from './ChessGame';

export default function GamePlayer({ game, onClose }) {
  const [key, setKey] = useState(0);
  const iframeRef = useRef(null);

  const resetGame = () => {
    setKey(prev => prev + 1);
  };

  const toggleFullscreen = () => {
    if (iframeRef.current) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen();
      }
    }
  };

  const isNativeGame = game?.id === 'chess';

  return (
    <AnimatePresence>
      {game && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-arcade-bg flex flex-col"
        >
          {/* Header */}
          <div className="h-20 px-4 md:px-8 border-b border-arcade-border flex items-center justify-between bg-arcade-surface/90 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <button 
                onClick={onClose}
                className="p-3 bg-arcade-bg hover:bg-white/5 border border-arcade-border rounded-2xl transition-all text-arcade-muted hover:text-white shadow-lg"
              >
                <X size={20} />
              </button>
              <div>
                <h2 className="font-bold text-xl leading-none flex items-center gap-3">
                  {game.title || game.name}
                  <span className="text-[10px] bg-arcade-accent text-white px-2 py-0.5 rounded-full uppercase font-black tracking-widest animate-pulse">
                    Live
                  </span>
                </h2>
                <p className="text-[11px] text-arcade-muted uppercase font-bold tracking-widest mt-1.5 opacity-60">
                  {game.category} • {isNativeGame ? 'Native Experience' : 'Fullscreen Optimized'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isNativeGame && (
                <>
                  <button 
                    onClick={resetGame}
                    className="flex items-center gap-2 px-4 py-2 bg-arcade-bg border border-arcade-border hover:bg-white/5 rounded-xl text-xs font-bold transition-all text-arcade-muted hover:text-white shadow-lg"
                    title="Reset Game"
                  >
                    <RotateCcw size={14} />
                    <span className="hidden md:inline">RELOAD</span>
                  </button>
                  <button 
                    onClick={toggleFullscreen}
                    className="flex items-center gap-2 px-6 py-2.5 bg-arcade-accent text-white rounded-xl text-xs font-black tracking-widest hover:bg-arcade-accent/90 transition-all shadow-xl shadow-arcade-accent/20"
                  >
                    <Maximize2 size={14} />
                    <span className="hidden md:inline uppercase">FULLSCREEN</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Game Viewport */}
          <div className="flex-1 relative bg-black overflow-hidden arcade-grid">
            <div className="scanline" />
            
            {isNativeGame ? (
              <div key={key} className="w-full h-full overflow-auto">
                {game.id === 'chess' && <ChessGame />}
              </div>
            ) : (
              <iframe
                key={key}
                ref={iframeRef}
                src={game.iframeUrl || game.url}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                title={game.title || game.name}
              />
            )}
          </div>

          {/* Footer Info */}
          <div className="p-4 md:px-8 bg-arcade-surface border-t border-white/5 text-xs text-arcade-muted flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span>Category: <span className="text-white font-bold">{game.category}</span></span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">
                {isNativeGame ? 'Built-in Module' : `Embed source: ${(() => {
                  try {
                    return new URL(game.iframeUrl || game.url).hostname;
                  } catch (e) {
                    return 'Secure Portal';
                  }
                })()}`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-arcade-accent rounded-full animate-pulse" />
              <span>Session Secure</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
