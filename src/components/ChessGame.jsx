import { useState, useCallback, useEffect, useMemo } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Brain, RotateCcw, ListOrdered, History } from 'lucide-react';

// Piece-Square Tables for better positional evaluation
const pst = {
  p: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
  ],
  n: [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ],
  b: [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
  ],
  r: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [0,  0,  0,  5,  5,  0,  0,  0]
  ],
  q: [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [-5,  0,  5,  5,  5,  5,  0, -5],
    [0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20]
  ],
  k: [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [20, 20,  0,  0,  0,  0, 20, 20],
    [20, 30, 10,  0,  0, 10, 30, 20]
  ]
};

const weights = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

const evaluateBoard = (game) => {
  let totalEvaluation = 0;
  const board = game.board();
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      totalEvaluation = totalEvaluation + getPieceValue(board[i][j], i, j);
    }
  }
  return totalEvaluation;
};

const getPieceValue = (piece, y, x) => {
  if (piece === null) return 0;
  
  // Base value
  let absoluteValue = weights[piece.type];
  
  // Positional value (PST)
  // if black, flip the table
  const table = pst[piece.type];
  const positionalValue = piece.color === 'w' 
    ? table[y][x] 
    : table[7 - y][x];

  return piece.color === 'w' ? (absoluteValue + positionalValue) : -(absoluteValue + positionalValue);
};

let nodesVisited = 0;

const orderMoves = (game, moves) => {
  return moves.map(move => {
    let score = 0;
    const piece = game.get(move.from);
    const target = game.get(move.to);
    
    // Captured value - attacker value
    if (target) {
      score += 10 * weights[target.type] - weights[piece.type];
    }
    
    // Pawn promotion
    if (move.promotion) {
      score += weights[move.promotion];
    }
    
    // Prioritize checks
    if (game.move(move)) {
      if (game.inCheck()) score += 50;
      game.undo();
    }
    
    return { move, score };
  }).sort((a, b) => b.score - a.score).map(m => m.move);
};

const minimax = (game, depth, alpha, beta, isMaximizingPlayer) => {
  nodesVisited++;
  if (depth === 0) return -evaluateBoard(game);
  
  const possibleMoves = orderMoves(game, game.moves({ verbose: true }));
  
  if (isMaximizingPlayer) {
    let bestEval = -99999;
    for (const move of possibleMoves) {
      game.move(move);
      bestEval = Math.max(bestEval, minimax(game, depth - 1, alpha, beta, !isMaximizingPlayer));
      game.undo();
      alpha = Math.max(alpha, bestEval);
      if (beta <= alpha) return bestEval;
    }
    return bestEval;
  } else {
    let bestEval = 99999;
    for (const move of possibleMoves) {
      game.move(move);
      bestEval = Math.min(bestEval, minimax(game, depth - 1, alpha, beta, !isMaximizingPlayer));
      game.undo();
      beta = Math.min(beta, bestEval);
      if (beta <= alpha) return bestEval;
    }
    return bestEval;
  }
};

const getBestMove = (game, depth) => {
  nodesVisited = 0;
  const startTime = performance.now();
  const verboseMoves = game.moves({ verbose: true });
  if (verboseMoves.length === 0) return null;
  
  const possibleMoves = orderMoves(game, verboseMoves);
  let bestMove = null;
  let bestValue = -99999;
  
  for (const move of possibleMoves) {
    game.move(move);
    const boardValue = minimax(game, depth - 1, -100000, 100000, false);
    game.undo();
    if (boardValue > bestValue) {
      bestValue = boardValue;
      bestMove = move;
    }
  }
  
  const endTime = performance.now();
  return { 
    move: bestMove, 
    nodes: nodesVisited, 
    time: endTime - startTime,
    eval: bestValue
  };
};

export default function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [difficulty, setDifficulty] = useState(2);
  const [status, setStatus] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [optionSquares, setOptionSquares] = useState({});
  const [engineStats, setEngineStats] = useState({ nodes: 0, time: 0, eval: 0 });
  const [timer, setTimer] = useState({ w: 600, b: 600 }); // 10 minutes each

  const evalScore = useMemo(() => evaluateBoard(game), [game]);
  const moveHistory = useMemo(() => game.history({ verbose: true }), [game]);

  const capturedPieces = useMemo(() => {
    const pieces = {
      w: { p: 8, n: 2, b: 2, r: 2, q: 1 },
      b: { p: 8, n: 2, b: 2, r: 2, q: 1 }
    };
    game.board().flat().filter(p => p !== null).forEach(p => {
      pieces[p.color][p.type]--;
    });
    return pieces;
  }, [game]);

  // Timer Effect
  useEffect(() => {
    if (!gameStarted || game.isGameOver()) return;
    const interval = setInterval(() => {
      const turn = game.turn();
      setTimer(prev => ({
        ...prev,
        [turn]: Math.max(0, prev[turn] - 1)
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [game, gameStarted]);

  const getMoveOptions = (square) => {
    const moves = game.moves({ square, verbose: true });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }
    const newSquares = {};
    moves.map((move) => {
      newSquares[move.to] = {
        background: game.get(move.to) && game.get(move.to).color !== game.get(square).color
          ? 'radial-gradient(circle, rgba(255,0,0,.15) 85%, transparent 85%)'
          : 'radial-gradient(circle, rgba(30,144,255,0.2) 25%, transparent 25%)',
        borderRadius: '50%',
      };
      return move;
    });
    newSquares[square] = { background: 'rgba(255, 255, 0, 0.4)' };
    setOptionSquares(newSquares);
    return true;
  };

  const onSquareClick = (square) => {
    if (!gameStarted || game.isGameOver() || isAiThinking) return;
    const move = makeAMove({
      from: Object.keys(optionSquares).find(s => optionSquares[s].background === 'rgba(255, 255, 0, 0.4)') || square,
      to: square,
      promotion: 'q',
    });
    if (move) {
      setOptionSquares({});
      return;
    }
    getMoveOptions(square);
  };

  const makeAMove = useCallback((move) => {
    try {
      const gameCopy = new Chess(game.fen());
      const result = gameCopy.move(move);
      if (result) {
        setGame(gameCopy);
        return result;
      }
      return null;
    } catch (e) {
      return null;
    }
  }, [game]);

  const onDrop = (sourceSquare, targetSquare) => {
    if (!gameStarted || game.isGameOver() || isAiThinking) return false;
    const move = makeAMove({ from: sourceSquare, to: targetSquare, promotion: 'q' });
    if (move === null) return false;
    setOptionSquares({});
    return true;
  };

  useEffect(() => {
    if (!gameStarted) return;
    if (game.isGameOver()) {
      if (game.isCheckmate()) setStatus(`Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins!`);
      else if (game.isDraw()) setStatus('Draw!');
      else setStatus('Game over!');
      return;
    }
    if (game.turn() === 'b' && !game.isGameOver()) {
      setIsAiThinking(true);
      const brainDelay = setTimeout(() => {
        const gameCopy = new Chess(game.fen());
        const result = getBestMove(gameCopy, difficulty + 1);
        if (result && result.move) {
          makeAMove(result.move);
          setEngineStats({ nodes: result.nodes, time: result.time, eval: result.eval });
        }
        setIsAiThinking(false);
      }, 500);
      return () => clearTimeout(brainDelay);
    }
  }, [game, difficulty, makeAMove, gameStarted]);

  const startGame = () => {
    setGameStarted(true);
  };

  const resetGame = () => {
    setGame(new Chess());
    setStatus('');
    setIsAiThinking(false);
    setGameStarted(false);
    setOptionSquares({});
    setTimer({ w: 600, b: 600 });
  };

  const PieceIcon = ({ type, color }) => {
    const pieces = {
      p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚'
    };
    return <span className={`text-lg sm:text-xl leading-none flex items-center justify-center ${color === 'w' ? 'text-white' : 'text-gray-400 opacity-60'}`}>{pieces[type]}</span>;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 md:gap-8 items-start justify-center p-4 md:p-8 max-w-7xl mx-auto w-full min-h-[600px] font-sans">
      
      {/* Eval Meter (Vertical) - Desktop Only */}
      <div className="hidden xl:flex flex-col items-center gap-2 h-[600px] py-4 bg-arcade-surface/30 rounded-full border border-arcade-border/50 shrink-0">
        <div className="flex-1 w-3 bg-white/10 rounded-full overflow-hidden flex flex-col-reverse relative">
          <motion.div 
            animate={{ height: `${Math.max(5, Math.min(95, 50 + (evalScore / 20)))}%` }}
            className="w-full bg-arcade-accent shadow-[0_0_10px_rgba(30,144,255,0.5)]"
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-[1px] bg-white/30 z-10" />
        </div>
        <span className="text-[10px] font-black text-arcade-muted vertical-rl transform rotate-180">EVALUATION</span>
      </div>

      {/* Board Column */}
      <div className="w-full xl:max-w-[600px] flex flex-col gap-4">
        {/* Opponent Info (Top) */}
        <div className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${game.turn() === 'b' ? 'bg-red-500/10 border-red-500/30' : 'bg-arcade-surface/50 border-arcade-border/50'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center border transition-all ${isAiThinking ? 'bg-red-500 animate-pulse border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-red-500/20 border-red-500/30'}`}>
              <Brain size={24} className={isAiThinking ? 'text-white' : 'text-red-400'} />
            </div>
            <div>
              <p className="text-xs font-black text-white tracking-widest uppercase flex items-center gap-2">
                Bot Opponent
                {isAiThinking && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />}
              </p>
              <div className="flex gap-1 flex-wrap mt-1">
                {Object.entries(capturedPieces.w).map(([type, count]) => 
                  Array.from({ length: count }).map((_, i) => <PieceIcon key={`${type}-${i}`} type={type} color="b" />)
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-white tabular-nums tracking-tighter">
              {formatTime(timer.b)}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-widest block ${game.turn() === 'b' ? 'text-red-400' : 'text-arcade-muted'}`}>
              {game.turn() === 'b' ? 'Thinking...' : 'Waiting'}
            </span>
          </div>
        </div>

        <div className="w-full aspect-square relative shadow-2xl shadow-black/50 rounded-lg overflow-hidden border-4 border-arcade-border group ring-1 ring-white/10">
          {/* Mobile Eval Bar */}
          <div className="absolute left-0 top-0 bottom-0 w-1 xl:hidden z-10 bg-white/10">
            <motion.div 
               animate={{ height: `${Math.max(5, Math.min(95, 50 + (evalScore / 20)))}%` }}
               className="w-full bg-arcade-accent"
            />
          </div>

          <div className={`${!gameStarted ? 'blur-md grayscale filter transition-all pointer-events-none' : ''} transition-all duration-500 w-full h-full`}>
            <Chessboard 
              position={game.fen()} 
              onPieceDrop={onDrop}
              onSquareClick={onSquareClick}
              onPieceDragBegin={(p, s) => getMoveOptions(s)}
              onPieceDragEnd={() => setOptionSquares({})}
              customDarkSquareStyle={{ backgroundColor: '#1a1a2e' }}
              customLightSquareStyle={{ backgroundColor: '#16213e' }}
              customSquareStyles={optionSquares}
              animationDuration={200}
            />
          </div>
          
          <AnimatePresence>
            {!gameStarted && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-center"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-arcade-surface border-2 border-arcade-accent rounded-3xl p-8 shadow-[0_0_50px_rgba(30,144,255,0.3)] space-y-6 max-w-xs w-full"
                >
                  <div className="w-16 h-16 bg-arcade-accent/20 rounded-full flex items-center justify-center mx-auto">
                    <History size={32} className="text-arcade-accent" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tighter uppercase italic">Ready to Play?</h2>
                    <p className="text-arcade-muted text-[10px] font-bold uppercase tracking-widest mt-1">AI Engine v2.0 (Optimized)</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => setDifficulty(lvl)}
                          className={`py-3 rounded-xl text-[10px] font-black tracking-widest transition-all border-2 ${
                            difficulty === lvl 
                              ? 'bg-arcade-accent border-arcade-accent text-white shadow-lg shadow-arcade-accent/30' 
                              : 'bg-arcade-bg border-arcade-border text-arcade-muted hover:border-white/20'
                          }`}
                        >
                          {['EASY', 'MED', 'HARD'][lvl-1]}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={startGame}
                      className="w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl"
                    >
                      Start Match
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Player Info (Bottom) */}
        <div className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${game.turn() === 'w' ? 'bg-arcade-accent/10 border-arcade-accent/30' : 'bg-arcade-surface/50 border-arcade-border/50'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center border transition-all ${game.turn() === 'w' && gameStarted ? 'bg-arcade-accent border-arcade-accent/40 shadow-[0_0_15px_rgba(30,144,255,0.4)]' : 'bg-green-500/20 border-green-500/30'}`}>
              <div className={`w-6 h-6 rounded-sm ${game.turn() === 'w' && gameStarted ? 'bg-white' : 'bg-white/60 ring-2 ring-white/20'}`} />
            </div>
            <div>
              <p className="text-xs font-black text-white tracking-widest uppercase">You (White)</p>
              <div className="flex gap-1 flex-wrap mt-1">
                {Object.entries(capturedPieces.b).map(([type, count]) => 
                  Array.from({ length: count }).map((_, i) => <PieceIcon key={`${type}-${i}`} type={type} color="w" />)
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-white tabular-nums tracking-tighter">
              {formatTime(timer.w)}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-widest block ${game.turn() === 'w' ? 'text-arcade-accent' : 'text-arcade-muted'}`}>
              {game.turn() === 'w' ? 'Your Turn' : 'Waiting'}
            </span>
          </div>
        </div>
      </div>

      {/* Info Column */}
      <div className="flex-1 w-full max-w-sm flex flex-col gap-6 h-full min-h-[500px]">
        {/* Engine Stats */}
        <div className="bg-arcade-surface p-4 rounded-2xl border border-arcade-border space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-black text-arcade-muted uppercase tracking-[.2em]">
            <Brain size={14} className="text-arcade-accent" />
            Stockfish-Lite Performance
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-arcade-bg/50 p-2 rounded-lg border border-arcade-border/30">
              <span className="text-[10px] text-arcade-muted block uppercase">Nodes</span>
              <span className="text-xs font-mono font-bold text-white">{(engineStats.nodes / 1000).toFixed(1)}k</span>
            </div>
            <div className="bg-arcade-bg/50 p-2 rounded-lg border border-arcade-border/30">
              <span className="text-[10px] text-arcade-muted block uppercase">Speed</span>
              <span className="text-xs font-mono font-bold text-white">
                {engineStats.time > 0 ? ((engineStats.nodes / engineStats.time)).toFixed(0) : 0} kn/s
              </span>
            </div>
            <div className="bg-arcade-bg/50 p-2 rounded-lg border border-arcade-border/30 col-span-2">
              <span className="text-[10px] text-arcade-muted block uppercase">Evaluation</span>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-mono font-bold ${engineStats.eval > 0 ? 'text-green-400' : engineStats.eval < 0 ? 'text-red-400' : 'text-white'}`}>
                  {(engineStats.eval / 100).toFixed(2)}
                </span>
                <span className="text-[9px] text-arcade-muted font-bold">DEPTH {difficulty + 1}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Game Stats */}
        <div className="bg-arcade-surface p-6 rounded-3xl border border-arcade-border space-y-6 flex-1 flex flex-col relative overflow-hidden">
          {/* Decorative background grid */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
          
          <div className="flex items-center justify-between shrink-0 relative z-10">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Trophy className="text-arcade-accent" />
              Overview
            </h3>
            <button 
              onClick={resetGame}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-arcade-muted group"
            >
              <RotateCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>

          <div className="space-y-4 flex-1 flex flex-col overflow-hidden relative z-10">
            <div className={`p-4 rounded-2xl border ${status ? 'border-arcade-accent bg-arcade-accent/10 shadow-[0_0_20px_rgba(30,144,255,0.1)] opacity-100' : 'border-arcade-border bg-arcade-bg opacity-80'} transition-all shrink-0`}>
              <p className="text-[10px] font-black text-arcade-muted uppercase tracking-[.2em] mb-1">Live Update</p>
              <p className="text-sm font-black text-white uppercase italic">
                {!gameStarted ? "Ready to Play" : (status || (game.turn() === 'w' ? "Strategic Move Required" : "Bot Analyzing Depth..."))}
              </p>
              {status && (
                <button 
                  onClick={resetGame}
                  className="w-full mt-4 py-3 bg-arcade-accent text-white font-black uppercase tracking-widest text-xs rounded-xl hover:scale-[1.02] transition-all shadow-lg shadow-arcade-accent/20"
                >
                  Play Again
                </button>
              )}
            </div>

            {/* Move History */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-2 text-[10px] font-black text-arcade-muted uppercase tracking-[.2em] mb-3">
                <ListOrdered size={14} className="text-arcade-accent" />
                Battle Log
              </div>
              <div className="flex-1 bg-arcade-bg/50 rounded-2xl border border-arcade-border/50 overflow-hidden flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-arcade-border">
                  {moveHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-40 py-8">
                       <History size={32} className="mb-2" />
                       <p className="text-[10px] text-center italic font-bold">No tactical data yet...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                        <div key={i} className="contents group">
                          <div className="text-[10px] text-arcade-muted col-span-2 mb-1 mt-2 font-black border-l-2 border-arcade-accent pl-2">ROUND {i + 1}</div>
                          <div className="bg-arcade-surface/50 p-2 rounded-lg text-[11px] font-bold border border-arcade-border/30 group-hover:border-arcade-accent/30 transition-colors flex justify-between">
                            <span className="text-arcade-muted">W</span>
                            <span className="text-white">{moveHistory[i * 2]?.san}</span>
                          </div>
                          {moveHistory[i * 2 + 1] && (
                            <div className="bg-arcade-surface/50 p-2 rounded-lg text-[11px] font-bold border border-arcade-border/30 group-hover:border-arcade-accent/30 transition-colors flex justify-between">
                              <span className="text-arcade-muted">B</span>
                              <span className="text-white">{moveHistory[i * 2 + 1].san}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tactical Analysis Tooltip */}
        <div className="bg-arcade-accent/5 p-5 rounded-2xl border border-arcade-accent/20 text-[11px] text-arcade-muted shrink-0 shadow-inner group">
          <p className="mb-3 uppercase font-black tracking-widest text-white flex items-center gap-2 group-hover:text-arcade-accent transition-colors">
            <Brain size={12} className="group-hover:scale-125 transition-transform" />
            AI Strategy Insights
          </p>
          <ul className="space-y-2 font-bold leading-relaxed">
            <li className="flex gap-2">
              <span className="text-arcade-accent font-black">»</span>
              Positioning knights near the center increases their mobility index.
            </li>
            <li className="flex gap-2">
              <span className="text-arcade-accent font-black">»</span>
              Connected rooks on open files are worth +50 weight points.
            </li>
            <li className="flex gap-2 text-arcade-accent/80">
              <span className="text-arcade-accent font-black">»</span>
              Bot evaluation uses Minimax with PST weighting.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
