import React from 'react';
import { GamePhase, BattleResult } from '../types';

interface StatusPanelProps {
  phase: GamePhase;
  round: number;
  result: BattleResult | null;
  onReset: () => void;
  onResolve: () => void;
  replaySpeed?: number;
  onSpeedChange?: (speed: number) => void;
  isPlayer1?: boolean; // Whether current player is Player 1
}

const StatusPanel: React.FC<StatusPanelProps> = ({ phase, round, result, onReset, onResolve, replaySpeed = 1, onSpeedChange, isPlayer1 = false }) => {
  return (
    <div className="absolute top-0 left-0 w-full p-4 z-10 pointer-events-none flex justify-between items-start">
      {/* Left: Branding */}
      <div className="bg-slate-900/80 backdrop-blur border border-cyan-500/30 p-4 rounded-br-2xl shadow-lg border-l-4 border-l-cyan-500">
        <h1 className="text-2xl font-black text-white tracking-tighter">
          FHE <span className="text-cyan-400">AUTO-CHESS</span>
        </h1>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-1">
          <div className={`w-2 h-2 rounded-full ${phase === GamePhase.RESOLVING ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></div>
          STATUS: {phase}
        </div>
      </div>

      {/* Center: Round / Action */}
      {phase === GamePhase.REPLAY && (
        <div className="mt-4 flex items-center gap-4">
          <div className="bg-black/60 backdrop-blur px-6 py-2 rounded-full border border-white/10 text-xl font-mono font-bold text-white shadow-xl animate-bounce">
            ROUND {round + 1}
          </div>
          {onSpeedChange && (
            <div className="bg-slate-800/90 backdrop-blur px-3 py-2 rounded-lg border border-slate-600 flex items-center gap-2 pointer-events-auto">
              <span className="text-xs text-slate-400">Speed:</span>
              {[1, 2, 3].map((speed) => (
                <button
                  key={speed}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log(`[Speed Button] Clicked ${speed}x`);
                    onSpeedChange(speed);
                  }}
                  className={`px-3 py-1 rounded text-sm font-bold transition-all cursor-pointer ${
                    replaySpeed === speed
                      ? 'bg-cyan-500 text-white shadow-lg'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Right: Controls (Pointer events enabled) */}
      <div className="pointer-events-auto flex flex-col gap-2">
        {phase === GamePhase.SUBMITTED && (
             <button 
             onClick={onResolve}
             className="bg-gradient-to-l from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold py-3 px-8 rounded-bl-2xl shadow-lg border-r-4 border-yellow-300 transition-all"
           >
             RESOLVE MATCH
           </button>
        )}

        {(phase === GamePhase.RESULT || phase === GamePhase.REPLAY) && result && (() => {
          // Determine if current player won
          // result.winner: 0 = P1 wins, 1 = P2 wins, -1 = draw
          // isPlayer1: true = current player is P1, false = current player is P2
          const isDraw = result.winner === -1;
          let currentPlayerWon: boolean | null = null;
          
          if (!isDraw) {
            if (result.winner === 0) {
              // P1 wins
              currentPlayerWon = isPlayer1;
            } else if (result.winner === 1) {
              // P2 wins
              currentPlayerWon = !isPlayer1;
            }
          }
          
          // Debug log
          console.log('[StatusPanel] Result display:', {
            winner: result.winner,
            isPlayer1,
            currentPlayerWon,
            margin: result.margin,
            displayText: isDraw ? 'DRAW' : currentPlayerWon ? 'VICTORY' : 'DEFEAT'
          });
          
          return (
            <div className="bg-slate-900/90 backdrop-blur px-5 py-4 rounded-bl-2xl border border-slate-700 text-right shadow-xl">
              <h2 className="text-xs text-slate-400 uppercase tracking-widest mb-1">Match Result</h2>
              <div className="text-[10px] uppercase tracking-widest mb-2 font-mono">
                {result.source === 'onchain'
                  ? <span className="text-cyan-400">On-chain result</span>
                  : <span className="text-slate-500">Demo result</span>}
              </div>
              <div className={`text-3xl font-black mb-3 ${
                isDraw ? 'text-yellow-400' : 
                currentPlayerWon ? 'text-green-400' : 'text-red-500'
              }`}>
                {isDraw ? 'DRAW' : currentPlayerWon ? 'VICTORY' : 'DEFEAT'}
              </div>
              <div className="text-xs font-mono text-slate-300 mb-1">
                Margin: {result.margin} HP
              </div>
              {!isDraw && (
                <div className="text-[11px] text-slate-400 mb-3 leading-snug">
                  {result.winner === 0 ? 'Player 1' : 'Player 2'} won
                  <br />
                  <span className="text-slate-500">(You are {isPlayer1 ? 'P1' : 'P2'})</span>
                </div>
              )}
              <button 
                onClick={onReset}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded transition-colors text-xs font-bold"
              >
                NEW MATCH
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default StatusPanel;
