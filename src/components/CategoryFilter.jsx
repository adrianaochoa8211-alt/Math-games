import { motion } from 'motion/react';

export default function CategoryFilter({ categories, activeCategory, onSelect }) {
  return (
    <div className="flex flex-wrap gap-3 py-8 overflow-x-auto no-scrollbar">
      {categories.map((cat) => (
        <motion.button
          key={cat}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(cat)}
          className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
            activeCategory === cat 
              ? 'bg-arcade-accent border-arcade-accent text-white shadow-lg shadow-arcade-accent/30' 
              : 'bg-arcade-surface border-arcade-border text-arcade-muted hover:text-arcade-text hover:border-arcade-muted/50'
          }`}
        >
          {cat}
        </motion.button>
      ))}
    </div>
  );
}
