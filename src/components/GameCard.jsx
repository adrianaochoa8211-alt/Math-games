import React from 'react';
import { motion } from 'motion/react';
import { Play } from 'lucide-react';

const GameCard = ({ game, onClick }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8 }}
      onClick={() => onClick(game)}
      className="group relative bg-arcade-surface rounded-3xl overflow-hidden cursor-pointer border border-arcade-border hover:border-arcade-accent/50 transition-all duration-300 shadow-xl shadow-black/20 hover:shadow-arcade-accent/10"
    >
      <div className="aspect-[4/3] w-full overflow-hidden relative">
        <img 
          src={game.thumbnail} 
          alt={game.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 blur-0 group-hover:blur-[2px]"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-arcade-bg/90 via-arcade-bg/20 to-transparent" />
        <div className="absolute top-4 right-4 z-20">
          <span className="px-2 py-1 bg-black/50 backdrop-blur-md text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/10 text-arcade-accent-light">
            {game.category}
          </span>
        </div>
        
        <div className="absolute inset-0 flex items-center justify-center translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30">
          <div className="px-6 py-2 bg-white text-black font-bold rounded-xl text-sm shadow-2xl">
            PLAY NOW
          </div>
        </div>
      </div>
      
      <div className="p-6 relative">
        <h3 className="font-bold text-xl mb-2 group-hover:text-arcade-accent-light transition-colors leading-tight">
          {game.title || game.name}
        </h3>
        <p className="text-arcade-muted text-sm line-clamp-2 leading-relaxed opacity-80">
          {game.description}
        </p>
      </div>
    </motion.div>
  );
};

export default GameCard;
