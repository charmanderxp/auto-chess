import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GamePhase, Loadout, BattleResult, CombatUnit, CombatAction } from './types';
import { DEFAULT_LOADOUT_SLOT, TEAM_SIZE } from './constants';
import LoadoutEditor from './components/LoadoutEditor';
import BattleScene from './components/BattleScene';
import StatusPanel from './components/StatusPanel';
import { generateRandomLoadout, simulateMatch } from './services/mockFheService';
import { fheService } from './services/fheService';
import { useFhevm } from './components/FhevmProvider';

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.LOBBY);
  const [loadout, setLoadout] = useState<Loadout>(
    Array(TEAM_SIZE).fill(DEFAULT_LOADOUT_SLOT) as Loadout
  );
  
  // Simulation State
  const [result, setResult] = useState<BattleResult | null>(null);
  const [currentUnits, setCurrentUnits] = useState<CombatUnit[]>([]);
  const [currentAction, setCurrentAction] = useState<CombatAction | null>(null);
  const [replayIndex, setReplayIndex] = useState(0);
  const [replaySpeed, setReplaySpeed] = useState(1); // 1x, 2x, 3x speed

  // FHE Service State
  const { isInitialized, account, connect, error: fhevmError } = useFhevm();
  const [useRealContract, setUseRealContract] = useState(false);
  const [matchId, setMatchId] = useState<bigint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [matchInfo, setMatchInfo] = useState<{p1: string, p2: string, phase: number} | null>(null);
  const [joinMatchId, setJoinMatchId] = useState<string>('');
  const [opponentAddress, setOpponentAddress] = useState<string>('');
  const [isPlayer1, setIsPlayer1] = useState(false);

  // Initial dummy units for the background scene
  const [dummyUnits, setDummyUnits] = useState<CombatUnit[]>([]);

  useEffect(() => {
    // Generate dummy units for the lobby background
    const p1 = generateRandomLoadout();
    const p2 = generateRandomLoadout();
    const sim = simulateMatch(p1, p2);
    setDummyUnits(sim.initialUnits);
  }, []);

  // Initialize FHE service when wallet is connected
  useEffect(() => {
    if (isInitialized && account) {
      fheService.initialize()
        .then(() => {
          setUseRealContract(true);
          setError(null);
        })
        .catch((err: any) => {
          console.error('Failed to initialize FHE service:', err);
          setError(err.message || 'Failed to initialize FHE service');
          setUseRealContract(false);
        });
    } else {
      setUseRealContract(false);
    }
  }, [isInitialized, account]);

  // Auto-refresh match info when in SUBMITTED phase (polling)
  useEffect(() => {
    if (phase !== GamePhase.SUBMITTED || !useRealContract || !matchId || !isInitialized || !account) {
      return;
    }

    // Refresh immediately
    const refreshMatchInfo = async () => {
      try {
        const info = await fheService.getMatchInfo(matchId);
        setMatchInfo(info);
        console.log('[Polling] Match info refreshed. Phase:', info.phase);
        
        // If both players submitted, we could optionally show a notification
        if (info.phase === 1 && matchInfo && matchInfo.phase !== 1) {
          console.log('[Polling] ✅ Both players submitted!');
        }
      } catch (err) {
        console.error('[Polling] Failed to refresh match info:', err);
      }
    };

    refreshMatchInfo();

    // Poll every 3 seconds
    const interval = setInterval(refreshMatchInfo, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [phase, useRealContract, matchId, isInitialized, account, matchInfo]);

  // --- Handlers ---

  const handleCreateMatch = async () => {
    if (!isInitialized || !account) {
      setError('Please connect wallet first');
      return;
    }

    // Ensure FHE service is initialized
    try {
      await fheService.initialize();
      setUseRealContract(true);
    } catch (err: any) {
      console.error('[CreateMatch] Failed to initialize FHE service:', err);
      setError(err.message || 'Failed to initialize FHE service. Please check your wallet connection.');
      return;
    }

    // Validate opponent address
    if (!opponentAddress || !opponentAddress.startsWith('0x') || opponentAddress.length !== 42) {
      setError('Please enter a valid opponent address (0x...)');
      return;
    }

    if (opponentAddress.toLowerCase() === account?.toLowerCase()) {
      setError('Cannot play against yourself');
      return;
    }

    try {
      setError(null);
      console.log('[CreateMatch] Creating match with opponent:', opponentAddress);
      console.log('[CreateMatch] Current account:', account);
      const newMatchId = await fheService.createMatch(opponentAddress);
      console.log('[CreateMatch] Match created with ID:', newMatchId.toString());
      setMatchId(newMatchId);
      
      // Get match info
      const info = await fheService.getMatchInfo(newMatchId);
      console.log('[CreateMatch] Match info:', info);
      setMatchInfo(info);
      setIsPlayer1(info.p1.toLowerCase() === account.toLowerCase());
      console.log('[CreateMatch] Is Player 1:', info.p1.toLowerCase() === account.toLowerCase());
      
      setPhase(GamePhase.MATCH_LOBBY);
    } catch (err: any) {
      console.error('[CreateMatch] Failed to create match:', err);
      setError(err.message || 'Failed to create match');
    }
  };

  const handleJoinMatch = async () => {
    if (!isInitialized || !account) {
      setError('Please connect wallet first');
      return;
    }

    // Ensure FHE service is initialized
    try {
      await fheService.initialize();
      setUseRealContract(true);
    } catch (err: any) {
      console.error('[JoinMatch] Failed to initialize FHE service:', err);
      setError(err.message || 'Failed to initialize FHE service. Please check your wallet connection.');
      return;
    }

    try {
      const matchIdNum = BigInt(joinMatchId);
      setError(null);
      
      // Get match info
      const info = await fheService.getMatchInfo(matchIdNum);
      setMatchInfo(info);
      setIsPlayer1(info.p1.toLowerCase() === account.toLowerCase());
      
      // Check if user is part of this match
      if (info.p1.toLowerCase() !== account.toLowerCase() && 
          info.p2.toLowerCase() !== account.toLowerCase()) {
        setError('You are not a player in this match');
        return;
      }
      
      setMatchId(matchIdNum);
      setPhase(GamePhase.MATCH_LOBBY);
    } catch (err: any) {
      console.error('Failed to join match:', err);
      setError(err.message || 'Failed to join match');
    }
  };

  const startEditing = () => {
    setPhase(GamePhase.EDITING);
  };

  const handleSubmit = async () => {
    if (useRealContract && isInitialized && account && matchId !== null) {
      try {
        setPhase(GamePhase.RESOLVING);
        setError(null);
        
        // Submit encrypted loadout to contract
        await fheService.submitLoadout(matchId, loadout);
        console.log('[Submit] Loadout submitted successfully');
        
        // Wait a bit for transaction to be mined
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Refresh match info to check if both players submitted
        const updatedInfo = await fheService.getMatchInfo(matchId);
        setMatchInfo(updatedInfo);
        console.log('[Submit] Match info updated. Phase:', updatedInfo.phase, 'P1:', updatedInfo.p1, 'P2:', updatedInfo.p2);
        
        setPhase(GamePhase.SUBMITTED);
      } catch (err: any) {
        console.error('Failed to submit loadout:', err);
        setError(err.message || 'Failed to submit loadout');
        // Fallback to mock mode
        setUseRealContract(false);
        setPhase(GamePhase.SUBMITTED);
      }
    } else {
      // Mock mode: just set phase
      setPhase(GamePhase.SUBMITTED);
    }
  };

  const handleResolve = async () => {
    setPhase(GamePhase.RESOLVING);
    setError(null);
    
    try {
      // Luôn chạy combat offchain cho visual (cả real contract & mock)
      const opponentLoadout = generateRandomLoadout();
      const simResult = simulateMatch(loadout, opponentLoadout);

      let signedFromOnChain: number | null = null;
      let currentIsPlayer1 = isPlayer1;

      if (useRealContract && isInitialized && account && matchId !== null) {
        // Refresh match info trước khi resolve / đọc kết quả
        const updatedInfo = await fheService.getMatchInfo(matchId);
        setMatchInfo(updatedInfo);

        currentIsPlayer1 = updatedInfo.p1.toLowerCase() === account.toLowerCase();
        setIsPlayer1(currentIsPlayer1);

        console.log('[Resolve] Match phase:', updatedInfo.phase, 'Expected: 1 (Submitted) or 2 (Resolved)');
        console.log('[Resolve] Match info:', updatedInfo);
        console.log('[Resolve] Current account:', account);
        console.log('[Resolve] P1 address:', updatedInfo.p1);
        console.log('[Resolve] P2 address:', updatedInfo.p2);
        console.log('[Resolve] Is Player 1:', currentIsPlayer1);
        console.log('[Resolve] P1 submitted:', updatedInfo.p1Submitted);
        console.log('[Resolve] P2 submitted:', updatedInfo.p2Submitted);

        // Verify both players have submitted
        if (updatedInfo.p1Submitted === false || updatedInfo.p2Submitted === false) {
          console.error('[Resolve] ⚠️ Not all players have submitted!');
          throw new Error('Both players must submit their loadouts before resolving');
        }

        // Nếu chưa resolved, chỉ cho P1 submit kết quả plain lên on-chain
        if (!updatedInfo.resolved) {
          if (currentIsPlayer1) {
            console.log('[Resolve] Match not yet resolved. P1 will submit plain result.');
            // Chuyển winner/margin local thành signedResult: hpSum1 - hpSum2
            let localSigned = 0;
            if (simResult.winner === 0) {
              localSigned = simResult.margin;
            } else if (simResult.winner === 1) {
              localSigned = -simResult.margin;
            } else {
              localSigned = 0;
            }

            await fheService.submitResultPlain(matchId, localSigned);
            console.log('[Resolve] Plain result submitted by P1:', localSigned);
            signedFromOnChain = localSigned;
          } else {
            console.log('[Resolve] Match not yet resolved on-chain. Waiting for P1 to resolve.');
            throw new Error('Match not yet resolved on-chain. Please wait for Player 1 to resolve.');
          }
        } else {
          // Match đã resolved → đọc kết quả plain on-chain
          try {
            signedFromOnChain = await fheService.getResultPlain(matchId);
            console.log('[Resolve] On-chain plain signedResult:', signedFromOnChain);
          } catch (getErr: any) {
            console.error('[Resolve] Failed to get on-chain plain result:', getErr);
          }
        }
      }

      // Dùng kết quả on-chain nếu có, fallback về local simResult nếu cần
      let signed: number;
      let winner: number;
      let margin: number;

      if (signedFromOnChain !== null) {
        signed = signedFromOnChain;
        winner = signed > 0 ? 0 : signed < 0 ? 1 : -1;
        margin = Math.abs(signed);
      } else {
        // Fallback: dùng winner/margin từ mô phỏng local
        if (simResult.winner === 0) {
          signed = simResult.margin;
        } else if (simResult.winner === 1) {
          signed = -simResult.margin;
        } else {
          signed = 0;
        }
        winner = simResult.winner;
        margin = simResult.margin;
      }

      const actualResult: BattleResult = {
        ...simResult,
        margin,
        winner,
        source: signedFromOnChain !== null ? 'onchain' : 'demo',
      };

      console.log('[Resolve] Final display result:', {
        signedResult: signed,
        margin,
        winner,
        isPlayer1: currentIsPlayer1,
      });

      setResult(actualResult);
      setCurrentUnits(actualResult.initialUnits);
      setReplayIndex(0);
      setPhase(GamePhase.REPLAY);
    } catch (err: any) {
      console.error('Failed to resolve match:', err);
      setError(err.message || 'Failed to resolve match');

      // Nếu đang dùng real contract, KHÔNG fallback về mock để tránh kết quả lệch.
      // Người chơi sẽ vẫn ở màn SUBMITTED / MATCH_LOBBY và có thể thử lại sau khi P1 submit thành công.
      if (useRealContract && isInitialized && matchId !== null) {
        setPhase(GamePhase.SUBMITTED);
      } else {
        // Demo mode: cho phép fallback sang mock battle
        const opponentLoadout = generateRandomLoadout();
        const simResult = simulateMatch(loadout, opponentLoadout);

        setResult(simResult);
        setCurrentUnits(simResult.initialUnits);
        setReplayIndex(0);
        setPhase(GamePhase.REPLAY);
      }
    }
  };

  const handleReset = () => {
    setPhase(GamePhase.LOBBY);
    setResult(null);
    setLoadout(Array(TEAM_SIZE).fill(DEFAULT_LOADOUT_SLOT) as Loadout);
    setReplayIndex(0);
    setReplaySpeed(1); // Reset to 1x speed
  };

  // --- Replay Logic ---

  // Use ref to store interval so we can clear it when speed changes
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const speedRef = useRef(replaySpeed);

  // Update speed ref when it changes
  useEffect(() => {
    speedRef.current = replaySpeed;
  }, [replaySpeed]);

  useEffect(() => {
    if (phase !== GamePhase.REPLAY || !result) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Clear existing interval if any
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Create new interval with current speed
    const currentSpeed = speedRef.current;
    const intervalMs = Math.max(50, Math.floor(800 / currentSpeed)); // Minimum 50ms, adjust based on speed
    console.log(`[Replay] Creating interval with speed ${currentSpeed}x (interval: ${intervalMs}ms)`);
    
    intervalRef.current = setInterval(() => {
        setReplayIndex(prevIndex => {
            if (prevIndex >= result.log.length) {
                setPhase(GamePhase.RESULT);
                setCurrentAction(null);
                if (intervalRef.current) {
                  clearInterval(intervalRef.current);
                  intervalRef.current = null;
                }
                return prevIndex;
            }

            const action = result.log[prevIndex];
            setCurrentAction(action);

            // Update Unit State based on action
            setCurrentUnits(prev => {
                const next = [...prev];
                
                if (action.type === 'HIT') {
                    // Find unit and apply damage
                    const targetIdx = next.findIndex(u => u.owner === action.targetOwner && u.slotIndex === action.targetSlot);
                    if (targetIdx !== -1) {
                        next[targetIdx] = {
                            ...next[targetIdx],
                            currentHp: action.hpRemaining ?? next[targetIdx].currentHp
                        };
                    }
                } else if (action.type === 'DIE') {
                     const targetIdx = next.findIndex(u => u.owner === action.actorOwner && u.slotIndex === action.actorSlot);
                     if (targetIdx !== -1) {
                         next[targetIdx] = { ...next[targetIdx], isDead: true };
                     }
                }
                return next;
            });

            return prevIndex + 1;
        });
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [phase, result, replaySpeed]); // Remove replayIndex from dependencies


  // --- Render Helpers ---

  // Determine what units to show in 3D scene
  const sceneUnits = phase === GamePhase.REPLAY || phase === GamePhase.RESULT 
    ? currentUnits 
    : dummyUnits;

  const currentRound = currentAction ? currentAction.round : 0;

  return (
    <div className="relative w-full h-full font-sans select-none">
      
      {/* 3D Layer */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${phase === GamePhase.EDITING ? 'opacity-30 blur-sm' : 'opacity-100'}`}>
        <BattleScene 
            units={sceneUnits} 
            action={currentAction}
            isPlaying={phase === GamePhase.REPLAY}
        />
      </div>

      {/* UI Overlay */}
      <StatusPanel 
        phase={phase} 
        round={currentRound} 
        result={result} 
        onReset={handleReset}
        onResolve={handleResolve}
        replaySpeed={replaySpeed}
        onSpeedChange={setReplaySpeed}
        isPlayer1={isPlayer1}
      />

      {/* Main Content Areas */}
      
      {phase === GamePhase.LOBBY && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900/80 backdrop-blur p-8 rounded-2xl border border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.3)] text-center pointer-events-auto max-w-md">
            <h2 className="text-3xl font-bold mb-4 text-white">Private Auto-Chess</h2>
            <p className="text-slate-300 mb-6">
              Encrypted loadouts. FHE-verified combat. 
              <br/>Create your strategy in secret.
            </p>
            
            {!account && window.ethereum && (
              <button 
                onClick={connect}
                className="px-6 py-2 mb-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-all text-sm"
              >
                🔗 Connect Wallet
              </button>
            )}
            
            {account && (
              <div className="mb-4 text-xs text-green-400">
                ✓ Connected: {account.slice(0, 6)}...{account.slice(-4)}
                {isInitialized && <span className="ml-2">✓ FHEVM Ready</span>}
              </div>
            )}
            
            {(fhevmError || error) && (
              <div className="mb-4 text-xs text-yellow-400 bg-yellow-900/30 p-2 rounded">
                ⚠ {fhevmError || error}
                <br/>
                <span className="text-slate-400">Using demo mode</span>
              </div>
            )}
            
            <div className="space-y-3">
              <div>
                <div className="text-xs text-slate-400 mb-2 text-left">Opponent Address (P2):</div>
                <input
                  type="text"
                  placeholder="0x..."
                  value={opponentAddress}
                  onChange={(e) => setOpponentAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 outline-none mb-2 font-mono"
                />
                <button 
                  onClick={handleCreateMatch}
                  disabled={!opponentAddress}
                  className={`w-full px-8 py-3 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg ${
                    opponentAddress
                      ? 'bg-cyan-600 hover:bg-cyan-500'
                      : 'bg-slate-700 cursor-not-allowed'
                  }`}
                >
                  🎮 CREATE MATCH
                </button>
              </div>
              
              <div className="text-slate-400 text-sm my-4">OR</div>
              
              <div>
                <div className="text-xs text-slate-400 mb-2 text-left">Join by Match ID:</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Match ID"
                    value={joinMatchId}
                    onChange={(e) => setJoinMatchId(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
                  />
                  <button
                    onClick={handleJoinMatch}
                    disabled={!joinMatchId}
                    className={`px-4 py-2 rounded-lg font-bold transition-all ${
                      joinMatchId
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    JOIN
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === GamePhase.MATCH_LOBBY && matchInfo && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900/80 backdrop-blur p-8 rounded-2xl border border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.3)] text-center pointer-events-auto max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-white">Match Lobby</h2>
            
            <div className="bg-slate-800/50 p-4 rounded-lg mb-4 text-left">
              <div className="text-xs text-slate-400 mb-2">Match ID:</div>
              <div className="text-sm font-mono text-cyan-400 break-all">{matchId?.toString()}</div>
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Player 1:</span>
                  <span className={`font-mono ${isPlayer1 ? 'text-green-400' : 'text-white'}`}>
                    {matchInfo.p1.slice(0, 6)}...{matchInfo.p1.slice(-4)}
                    {isPlayer1 && <span className="ml-2">(You)</span>}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Player 2:</span>
                  <span className={`font-mono ${!isPlayer1 && matchInfo.p2.toLowerCase() === account?.toLowerCase() ? 'text-green-400' : 'text-white'}`}>
                    {matchInfo.p2.slice(0, 6)}...{matchInfo.p2.slice(-4)}
                    {!isPlayer1 && matchInfo.p2.toLowerCase() === account?.toLowerCase() && <span className="ml-2">(You)</span>}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-3 pt-3 border-t border-slate-700">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-yellow-400">
                    {matchInfo.phase === 0 ? 'Waiting for loadouts...' : 
                     matchInfo.phase === 1 ? 'Ready to resolve' : 
                     'Resolved'}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 text-xs text-red-400 bg-red-900/30 p-2 rounded">
                ⚠ {error}
              </div>
            )}

            <button 
              onClick={startEditing}
              className="w-full px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg"
            >
              {matchInfo.phase === 1 ? 'VIEW RESULT' : 'CREATE LOADOUT'}
            </button>

            <button
              onClick={() => {
                setPhase(GamePhase.LOBBY);
                setMatchId(null);
                setMatchInfo(null);
                setJoinMatchId('');
              }}
              className="w-full mt-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-all"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      )}

      {phase === GamePhase.EDITING && (
        <LoadoutEditor 
          loadout={loadout} 
          setLoadout={setLoadout} 
          onConfirm={handleSubmit} 
        />
      )}

      {phase === GamePhase.SUBMITTED && (
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center pointer-events-auto">
                <div className="text-2xl font-bold text-white mb-2 drop-shadow-md">Loadout Encrypted & Submitted</div>
                <div className="text-slate-400 text-sm mb-4">
                  {useRealContract && matchInfo 
                    ? matchInfo.phase === 1 
                      ? '✅ Both players submitted! Ready to resolve on-chain'
                      : '⏳ Waiting for opponent to submit...'
                    : 'Demo Mode: Will match with random opponent'}
                </div>
                {useRealContract && matchInfo && matchInfo.phase === 1 && (
                  <div className="text-green-400 text-xs mb-4">
                    Match Phase: Submitted (Ready to resolve)
                  </div>
                )}
                {useRealContract && matchInfo && matchInfo.phase !== 1 && (
                  <button
                    onClick={async () => {
                      if (matchId) {
                        try {
                          const info = await fheService.getMatchInfo(matchId);
                          setMatchInfo(info);
                          console.log('[Refresh] Match info updated. Phase:', info.phase);
                        } catch (err: any) {
                          console.error('[Refresh] Failed to refresh:', err);
                          setError(err.message || 'Failed to refresh match info');
                        }
                      }
                    }}
                    className="mb-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-all"
                  >
                    🔄 Refresh Status
                  </button>
                )}
                <button
                  onClick={handleResolve}
                  disabled={useRealContract && matchInfo && matchInfo.phase === 0}
                  className={`bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold py-4 px-12 rounded-xl shadow-2xl border-2 border-yellow-400/50 transition-all transform hover:scale-105 text-lg ${
                    useRealContract && matchInfo && matchInfo.phase === 0
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  🎲 RESOLVE MATCH
                </button>
                <div className="text-cyan-400 text-xs mt-4 animate-pulse">
                  {useRealContract && matchInfo && matchInfo.phase === 1
                    ? 'Click to resolve on-chain with FHEVM...'
                    : useRealContract
                    ? 'Waiting for opponent... (Auto-refreshing every 3s)'
                    : 'Click to simulate battle...'}
                </div>
            </div>
         </div>
      )}

      {phase === GamePhase.RESOLVING && (
        <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h2 className="text-2xl font-bold text-white">COMPUTING ON FHEVM</h2>
            <p className="text-slate-400 font-mono mt-2">Homomorphic execution in progress...</p>
        </div>
      )}

    </div>
  );
};

export default App;
