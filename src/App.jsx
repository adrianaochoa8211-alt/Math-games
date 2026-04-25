import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import gamesData from './games.json';
import Header from './components/Header.jsx';
import CategoryFilter from './components/CategoryFilter.jsx';
import GameCard from './components/GameCard.jsx';
import GamePlayer from './components/GamePlayer.jsx';

const CATEGORIES = ['All', 'Action', 'Puzzle', 'Sports', 'Arcade', 'Strategy'];

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedGame, setSelectedGame] = useState(null);

  const filteredGames = useMemo(() => {
    return gamesData.filter((game) => {
      const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          game.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || game.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="min-h-screen bg-arcade-bg text-arcade-text relative overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--color-arcade-accent)_0%,_transparent_25%)] opacity-[0.03] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--color-arcade-accent)_0%,_transparent_25%)] opacity-[0.03] pointer-events-none" />

      <Header onSearch={setSearchQuery} />

      <main className="max-w-7xl mx-auto px-4 md:px-8 pb-32 relative z-10">
        <CategoryFilter 
          categories={CATEGORIES}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          <AnimatePresence mode="popLayout">
            {filteredGames.length > 0 ? (
              filteredGames.map((game) => (
                <GameCard 
                  key={game.id} 
                  game={game} 
                  onClick={setSelectedGame}
                />
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-32 text-center bg-arcade-surface rounded-3xl border border-arcade-border"
              >
                <div className="text-arcade-muted mb-4 opacity-20">
                  <div className="text-6xl">🕹️</div>
                </div>
                <h3 className="text-2xl font-bold mb-2">No results matching search</h3>
                <p className="text-arcade-muted text-sm px-4 max-w-sm mx-auto opacity-60">
                  Try adjusting your keywords or category filters to find what you're looking for.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status Footer */}
        <footer className="mt-32 pt-10 border-t border-arcade-border flex flex-col md:flex-row items-center justify-between gap-6 font-mono text-[10px] text-arcade-muted uppercase tracking-[0.2em]">
          <div>
            LOADED {gamesData.length} GAMES FROM GAMES.JSON
          </div>
          <div className="flex items-center gap-6">
            <span>CPU: 12%</span>
            <span>PING: 24MS</span>
            <span className="text-arcade-accent-light font-black">SYSTEM STATUS: STABLE</span>
          </div>
        </footer>
      </main>

      <GamePlayer 
        game={selectedGame}
        onClose={() => setSelectedGame(null)}
      />
    </div>
  );
}
