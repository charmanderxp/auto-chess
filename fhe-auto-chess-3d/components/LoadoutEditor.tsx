import React from 'react';
import { HEROES, ITEMS, TEAM_SIZE } from '../constants';
import { Loadout, LoadoutSlot } from '../types';

interface LoadoutEditorProps {
  loadout: Loadout;
  setLoadout: (l: Loadout) => void;
  onConfirm: () => void;
}

const LoadoutEditor: React.FC<LoadoutEditorProps> = ({ loadout, setLoadout, onConfirm }) => {
  
  const updateSlot = (index: number, field: 'heroId' | 'itemId', value: number) => {
    const newLoadout = [...loadout] as Loadout;
    newLoadout[index] = { ...newLoadout[index], [field]: value };
    setLoadout(newLoadout);
  };

  const randomizeLoadout = () => {
    const newLoadout: Loadout = Array.from({ length: TEAM_SIZE }, () => ({
      heroId: Math.floor(Math.random() * HEROES.length),
      itemId: Math.floor(Math.random() * ITEMS.length)
    })) as Loadout;
    setLoadout(newLoadout);
  };

  const isComplete = loadout.every(s => s.heroId !== null && s.itemId !== null);

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md p-6">
      <div className="max-w-4xl w-full bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-2xl">
        <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          Encrypted Loadout
        </h2>
        <p className="text-slate-400 mb-8">
          Configure your team. This data will be encrypted client-side before submission.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {loadout.map((slot, idx) => (
            <div key={idx} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 flex flex-col gap-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit {idx + 1}</div>
              
              {/* Hero preview image */}
              {slot.heroId !== null && slot.heroId !== undefined && HEROES[slot.heroId] && (
                <div className="w-full flex justify-center mb-1">
                  <img
                    src={`/models/${HEROES[slot.heroId].id}.png`}
                    alt={HEROES[slot.heroId].name}
                    className="w-20 h-20 object-contain rounded-md border border-slate-700 bg-slate-900/80 shadow-inner"
                  />
                </div>
              )}
              
              {/* Hero Select */}
              <div>
                <label className="block text-xs text-cyan-400 mb-1">Hero Model</label>
                <select 
                  className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm focus:border-cyan-500 outline-none"
                  value={slot.heroId ?? ''}
                  onChange={(e) => updateSlot(idx, 'heroId', Number(e.target.value))}
                >
                  <option value="" disabled>Select Hero</option>
                  {HEROES.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name} (HP:{h.baseStats.hp} ATK:{h.baseStats.atk})
                    </option>
                  ))}
                </select>
              </div>

              {/* Item Select */}
              <div>
                <label className="block text-xs text-emerald-400 mb-1">Module (Item)</label>
                <select 
                  className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm focus:border-emerald-500 outline-none"
                  value={slot.itemId ?? ''}
                  onChange={(e) => updateSlot(idx, 'itemId', Number(e.target.value))}
                >
                  <option value="" disabled>Select Item</option>
                  {ITEMS.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={randomizeLoadout}
            className="px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105 bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 hover:border-slate-500"
          >
            🎲 Random
          </button>
          <button
            disabled={!isComplete}
            onClick={onConfirm}
            className={`px-8 py-3 rounded-lg font-bold transition-all transform hover:scale-105 ${
              isComplete 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25' 
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            Encrypt & Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoadoutEditor;
