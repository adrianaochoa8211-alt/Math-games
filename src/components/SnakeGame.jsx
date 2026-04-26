import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RotateCcw, Play, Pause, Trophy as TrophyIcon } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const INITIAL_SPEED = 150;

export default function SnakeGame() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('snake-highscore')) || 0;
  });
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  const gameLoop = useRef();

  const generateFood = useCallback((currentSnake) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood(generateFood(INITIAL_SNAKE));
    setIsGameOver(false);
    setIsPaused(true);
    setScore(0);
    setSpeed(INITIAL_SPEED);
  };

  const moveSnake = useCallback(() => {
    if (isGameOver || isPaused) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: head.x + direction.x,
        y: head.y + direction.y,
      };

      // Collision Check: Walls
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setIsGameOver(true);
        return prevSnake;
      }

      // Collision Check: Self
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Eating Food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => {
          const newScore = s + 10;
          if (newScore > highScore) {
            setHighScore(newScore);
            localStorage.setItem('snake-highscore', newScore.toString());
          }
          return newScore;
        });
        setFood(generateFood(newSnake));
        // Increase speed slightly
        setSpeed(prev => Math.max(80, prev - 2));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, generateFood, highScore, isGameOver, isPaused]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (isGameOver) return;
      
      switch (e.key) {
        case 'ArrowUp':
          if (direction.y !== 1) setDirection({ x: 0, y: -1 });
          if (isPaused) setIsPaused(false);
          break;
        case 'ArrowDown':
          if (direction.y !== -1) setDirection({ x: 0, y: 1 });
          if (isPaused) setIsPaused(false);
          break;
        case 'ArrowLeft':
          if (direction.x !== 1) setDirection({ x: -1, y: 0 });
          if (isPaused) setIsPaused(false);
          break;
        case 'ArrowRight':
          if (direction.x !== -1) setDirection({ x: 1, y: 0 });
          if (isPaused) setIsPaused(false);
          break;
        case ' ': // Space to pause
          setIsPaused(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, isGameOver, isPaused]);

  useEffect(() => {
    if (!isGameOver && !isPaused) {
      gameLoop.current = setInterval(moveSnake, speed);
    } else {
      clearInterval(gameLoop.current);
    }
    return () => clearInterval(gameLoop.current);
  }, [moveSnake, isGameOver, isPaused, speed]);

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-[600px] font-sans">
      <div className="w-full max-w-md flex flex-col gap-6">
        
        {/* Header Stats */}
        <div className="flex justify-between items-center bg-arcade-surface p-4 rounded-2xl border border-arcade-border shadow-2xl">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-arcade-muted uppercase tracking-[.2em]">Score</span>
            <span className="text-3xl font-black text-arcade-accent tracking-tighter tabular-nums">{score}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-arcade-muted uppercase tracking-[.2em]">High Score</span>
            <span className="text-xl font-black text-white tracking-tighter flex items-center gap-2">
              <TrophyIcon size={16} className="text-yellow-500" />
              {highScore}
            </span>
          </div>
        </div>

        {/* Game Board Container */}
        <div className="relative aspect-square w-full rounded-2xl border-4 border-arcade-border bg-black overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          
          {/* Background Grid */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ 
                 backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                 backgroundSize: `${100/GRID_SIZE}% ${100/GRID_SIZE}%`
               }} 
          />

          {/* Snake & Food */}
          <div className="absolute inset-0 p-1">
            <div className="w-full h-full relative">
              {/* Food */}
              <motion.div 
                className="absolute bg-snake-food rounded-full shadow-[0_0_15px_rgba(239,68,68,0.8)]"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                style={{ 
                  left: `${(food.x / GRID_SIZE) * 100}%`,
                  top: `${(food.y / GRID_SIZE) * 100}%`,
                  width: `${100/GRID_SIZE}%`,
                  height: `${100/GRID_SIZE}%`,
                }}
              />

              {/* Snake */}
              {snake.map((segment, i) => (
                <div 
                  key={`${i}-${segment.x}-${segment.y}`}
                  className={`absolute rounded-[2px] transition-all duration-[150ms] ${i === 0 ? 'bg-snake-head z-10' : 'bg-snake-body'}`}
                  style={{ 
                    left: `${(segment.x / GRID_SIZE) * 100}%`,
                    top: `${(segment.y / GRID_SIZE) * 100}%`,
                    width: `${100/GRID_SIZE}%`,
                    height: `${100/GRID_SIZE}%`,
                    boxShadow: i === 0 ? '0 0 15px rgba(74, 222, 128, 0.6)' : 'none',
                    opacity: i === 0 ? 1 : Math.max(0.4, 1 - (i / snake.length))
                  }}
                />
              ))}
            </div>
          </div>

          {/* Overlays */}
          <AnimatePresence>
            {(isGameOver || isPaused) && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-[2px] flex items-center justify-center p-8 text-center"
              >
                <div className="bg-arcade-surface border-2 border-arcade-border p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 max-w-[280px]">
                  {isGameOver ? (
                    <>
                      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border-2 border-red-500/20 mb-2">
                        <Trophy className="text-red-500" size={32} />
                      </div>
                      <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">System Overload</h2>
                      <p className="text-arcade-muted text-xs font-bold uppercase tracking-widest leading-relaxed">
                        Recovery Points: {score}
                      </p>
                      <button 
                        onClick={resetGame}
                        className="w-full mt-4 py-4 bg-arcade-accent text-white font-black uppercase tracking-[0.2em] rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg"
                      >
                        Reboot System
                      </button>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Link Paused</h2>
                      <p className="text-arcade-muted text-[10px] font-black uppercase tracking-[.2em]">Engage Arrow Keys to Resume</p>
                      <button 
                        onClick={() => setIsPaused(false)}
                        className="w-full mt-2 py-4 bg-white text-black font-black uppercase tracking-[0.2em] rounded-xl hover:scale-105 active:scale-95 transition-all"
                      >
                        Resume Link
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls Hint */}
        <div className="bg-arcade-surface p-4 rounded-2xl border border-arcade-border grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex justify-center">
                <div className="w-6 h-6 bg-arcade-bg border border-arcade-border rounded flex items-center justify-center text-[10px] font-bold text-arcade-muted">▲</div>
              </div>
              <div className="flex gap-1">
                <div className="w-6 h-6 bg-arcade-bg border border-arcade-border rounded flex items-center justify-center text-[10px] font-bold text-arcade-muted">◄</div>
                <div className="w-6 h-6 bg-arcade-bg border border-arcade-border rounded flex items-center justify-center text-[10px] font-bold text-arcade-muted">▼</div>
                <div className="w-6 h-6 bg-arcade-bg border border-arcade-border rounded flex items-center justify-center text-[10px] font-bold text-arcade-muted">►</div>
              </div>
            </div>
            <span className="text-[10px] font-black text-arcade-muted uppercase tracking-widest">Navigate</span>
          </div>
          <div className="flex items-center gap-3 border-l border-arcade-border/30 pl-4">
            <div className="w-14 h-6 bg-arcade-bg border border-arcade-border rounded flex items-center justify-center text-[8px] font-bold tracking-widest text-arcade-muted">SPACE</div>
            <span className="text-[10px] font-black text-arcade-muted uppercase tracking-widest">Pause</span>
          </div>
        </div>

      </div>
    </div>
  );
}
