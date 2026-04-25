import { motion } from 'motion/react';
import { Gamepad2, Search } from 'lucide-react';

export default function Header({ onSearch }) {
  return (
    <header className="sticky top-0 z-50 bg-arcade-bg/80 backdrop-blur-md border-b border-arcade-border p-4 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-arcade-accent rounded-lg flex items-center justify-center text-white font-bold text-xl italic shadow-lg shadow-arcade-accent/20">
            G
          </div>
          <h1 className="text-2xl font-black tracking-tight uppercase">
            Grid<span className="text-arcade-accent">Play</span>
          </h1>
        </motion.div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-arcade-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search games..."
              onChange={(e) => onSearch(e.target.value)}
              className="w-full bg-arcade-surface border border-arcade-border rounded-full py-2.5 pl-11 pr-4 focus:outline-none focus:border-arcade-accent transition-colors text-sm text-arcade-text placeholder:text-arcade-muted/50"
            />
          </div>
          <div className="hidden md:flex w-10 h-10 rounded-full bg-arcade-accent/10 border border-arcade-accent/20 items-center justify-center">
            <div className="w-2 h-2 bg-arcade-accent rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </header>
  );
}
