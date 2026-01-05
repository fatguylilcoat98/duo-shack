
import React, { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, ContactShadows, Environment } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Gamepad2, RefreshCcw, Heart, LogOut, Send, Bot, User } from 'lucide-react';
import { GameView, BoardState, GameStatus, ChatMessage } from './types';
import { GameGrid } from './components/Scene';
import { getAIMove, getAICommentary } from './services/ai';

const INITIAL_BOARD: BoardState = Array(9).fill(null);

export default function App() {
  const [view, setView] = useState<GameView>('LOGIN');
  const [name, setName] = useState('');
  const [roomID, setRoomID] = useState('SHACK-DELTA');
  const [board, setBoard] = useState<BoardState>(INITIAL_BOARD);
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [gameStatus, setGameStatus] = useState<GameStatus>({ winner: null, isDraw: false, winningLine: null });
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [myAvatar, setMyAvatar] = useState('X'); // In this AI version, User is X, AI is O

  // Check for winner
  const checkWinner = (currentBoard: BoardState): GameStatus => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return { winner: currentBoard[a], isDraw: false, winningLine: lines[i] };
      }
    }
    if (currentBoard.every(cell => cell !== null)) {
      return { winner: null, isDraw: true, winningLine: null };
    }
    return { winner: null, isDraw: false, winningLine: null };
  };

  const addMessage = (role: 'user' | 'ai', text: string) => {
    setMessages(prev => [...prev.slice(-4), { role, text }]);
  };

  const handleUserMove = useCallback(async (idx: number) => {
    if (board[idx] || gameStatus.winner || gameStatus.isDraw || turn !== 'X' || isProcessing) return;

    const newBoard = [...board];
    newBoard[idx] = 'X';
    setBoard(newBoard);
    
    const status = checkWinner(newBoard);
    setGameStatus(status);
    
    if (status.winner || status.isDraw) return;

    setTurn('O');
    setIsProcessing(true);

    // AI Reaction and Move
    const commentary = await getAICommentary(newBoard, idx, name);
    addMessage('ai', commentary);

    const aiIdx = await getAIMove(newBoard, 'O', 'X');
    if (aiIdx !== -1 && !newBoard[aiIdx]) {
      const finalBoard = [...newBoard];
      finalBoard[aiIdx] = 'O';
      setTimeout(() => {
        setBoard(finalBoard);
        const finalStatus = checkWinner(finalBoard);
        setGameStatus(finalStatus);
        setTurn('X');
        setIsProcessing(false);
      }, 800);
    } else {
      setIsProcessing(false);
      setTurn('X');
    }
  }, [board, gameStatus, turn, isProcessing, name]);

  const resetGame = () => {
    setBoard(INITIAL_BOARD);
    setGameStatus({ winner: null, isDraw: false, winningLine: null });
    setTurn('X');
    setMessages([]);
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 bg-black text-white font-sans overflow-hidden select-none">
      <AnimatePresence mode="wait">
        {view === 'LOGIN' ? (
          <motion.div 
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center h-full p-6 space-y-8"
          >
            <div className="relative">
              <Heart size={100} className="text-[#39ff14] animate-pulse" />
              <div className="absolute inset-0 bg-[#39ff14] blur-3xl opacity-20 animate-pulse"></div>
            </div>
            
            <div className="text-center">
              <h1 className="text-6xl font-black italic tracking-tighter mb-2">DUO_SHACK</h1>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Collaborative AI Gaming Space</p>
            </div>

            <div className="w-full max-w-xs space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 ml-4">AGENT NAME</label>
                <input 
                  placeholder="NAME" 
                  className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-3xl w-full text-center font-bold focus:outline-none focus:border-[#39ff14] transition-colors" 
                  value={name} 
                  onChange={e => setName(e.target.value.toUpperCase())} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 ml-4">SHACK ID</label>
                <input 
                  placeholder="ROOM_ID" 
                  className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-3xl w-full text-center font-bold focus:outline-none focus:border-[#39ff14] transition-colors" 
                  value={roomID} 
                  onChange={e => setRoomID(e.target.value.toUpperCase())} 
                />
              </div>
              <button 
                onClick={() => name && setView('ROOM')} 
                disabled={!name}
                className="bg-[#39ff14] text-black w-full p-6 rounded-3xl font-black text-lg hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(57,255,20,0.3)]"
              >
                ENTER VOID
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="room"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col relative"
          >
            {/* 3D GAME CANVAS */}
            <div className="flex-1 relative">
              <Canvas shadows camera={{ position: [0, 2, 12], fov: 45 }}>
                <color attach="background" args={['#000']} />
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <ambientLight intensity={0.2} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={0.5} />
                <Environment preset="night" />
                
                <GameGrid board={board} winningLine={gameStatus.winningLine} onMove={handleUserMove} />
                
                <ContactShadows position={[0, -4.5, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
                <OrbitControls enablePan={false} minDistance={8} maxDistance={20} />
              </Canvas>

              {/* Game Status Overlay */}
              <AnimatePresence>
                {(gameStatus.winner || gameStatus.isDraw) && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
                  >
                    <div className="glass p-12 rounded-[4rem] text-center border border-white/10 shadow-2xl">
                      <h2 className="text-7xl font-black mb-4 tracking-tighter">
                        {gameStatus.winner ? `${gameStatus.winner} WINS!` : "DRAW"}
                      </h2>
                      <button 
                        onClick={resetGame}
                        className="pointer-events-auto bg-[#39ff14] text-black px-10 py-4 rounded-full font-black text-xl hover:scale-105 transition-transform"
                      >
                        PLAY AGAIN
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* HEADER UI */}
            <div className="absolute top-10 left-10 p-6 glass rounded-3xl border border-white/10 z-10 w-64">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-3 h-3 rounded-full ${isProcessing ? 'bg-amber-500 animate-pulse' : 'bg-[#39ff14]'}`}></div>
                <p className="text-[10px] font-black text-zinc-400 tracking-widest uppercase">{roomID}</p>
              </div>
              <p className="text-2xl font-black">{name}</p>
              <div className="mt-4 flex gap-4 text-xs font-bold text-zinc-500">
                <div className="flex flex-col">
                  <span>TURN</span>
                  <span className="text-white text-lg">{turn}</span>
                </div>
                <div className="flex flex-col ml-auto text-right">
                  <span>ROLE</span>
                  <span className="text-[#39ff14] text-lg">LEADER</span>
                </div>
              </div>
            </div>

            {/* CHAT/LOG OVERLAY */}
            <div className="absolute right-10 bottom-32 w-80 glass rounded-[2.5rem] border border-white/10 p-6 z-10 space-y-4 max-h-[300px] flex flex-col">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <Bot size={16} className="text-[#39ff14]" />
                <span className="text-[10px] font-black uppercase tracking-widest">Duo Intelligence</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {messages.length === 0 && (
                  <p className="text-zinc-600 text-sm italic">Waiting for activity...</p>
                )}
                {messages.map((m, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={idx} 
                    className={`flex items-start gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`p-3 rounded-2xl text-sm font-medium ${m.role === 'ai' ? 'bg-[#39ff14]/10 text-[#39ff14] rounded-tl-none' : 'bg-white/5 text-white rounded-tr-none'}`}>
                      {m.text}
                    </div>
                  </motion.div>
                ))}
                {isProcessing && (
                  <div className="flex gap-1 items-center p-2 text-zinc-500">
                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER CONTROLS */}
            <footer className="p-10 flex justify-center items-center gap-8 relative z-50">
               <button 
                  onClick={resetGame} 
                  className="p-5 glass rounded-full hover:bg-[#39ff14]/10 hover:text-[#39ff14] transition-all border border-white/5"
                  title="Reset Game"
                >
                  <RefreshCcw size={28} />
               </button>
               
               <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-24 h-24 bg-[#39ff14] rounded-full flex items-center justify-center text-black border-[8px] border-black shadow-[0_0_50px_rgba(57,255,20,0.4)]"
                >
                  <Smile size={44} />
               </motion.button>

               <button 
                  onClick={() => setView('LOGIN')} 
                  className="p-5 glass rounded-full hover:bg-red-500/10 hover:text-red-500 transition-all border border-white/5"
                  title="Leave Shack"
                >
                  <LogOut size={28} />
               </button>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
