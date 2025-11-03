import React, { useState } from 'react';
import { Edit3, Save, X, Trash2 } from 'lucide-react';

export default function DeckListItem({ deck, heroes, onUpdateDeck, onDeleteDeck }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(deck.name);
  const [editHero, setEditHero] = useState(deck.hero);

  const handleSave = () => {
    if (!editName.trim()) return;
    
    onUpdateDeck(deck.id, {
      name: editName.trim(),
      hero: editHero
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(deck.name);
    setEditHero(deck.hero);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le deck "${deck.name}" ?`)) {
      onDeleteDeck(deck.id);
    }
  };

  const totalGames = deck.wins + deck.losses;
  const winRate = totalGames > 0 ? ((deck.wins / totalGames) * 100).toFixed(1) : '0.0';

  return (
    <div className="bg-gray-700 rounded-lg p-3 sm:p-4 border border-gray-600">
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-500 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-red-500 text-sm sm:text-base"
            placeholder="Nom du deck"
          />
          <select
            value={editHero}
            onChange={(e) => setEditHero(e.target.value)}
            className="w-full bg-gray-800 border border-gray-500 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-red-500 text-sm sm:text-base"
          >
            {heroes.map(hero => (
              <option key={hero} value={hero}>{hero}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-xs sm:text-sm transition"
            >
              <Save className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Sauver</span><span className="sm:hidden">OK</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-xs sm:text-sm transition"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Annuler</span><span className="sm:hidden">✗</span>
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-100">{deck.name}</h3>
              <p className="text-red-400 text-xs sm:text-sm">{deck.hero}</p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition"
              >
                <Edit3 className="w-3 h-3" />
                <span className="hidden sm:inline">Modifier</span>
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition"
              >
                <Trash2 className="w-3 h-3" />
                <span className="hidden sm:inline">Supprimer</span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-green-400">{deck.wins}</div>
              <div className="text-gray-400 text-xs sm:text-sm">Victoires</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-red-400">{deck.losses}</div>
              <div className="text-gray-400 text-xs sm:text-sm">Défaites</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-yellow-400">{deck.elo}</div>
              <div className="text-gray-400 text-xs sm:text-sm">ELO</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl font-bold text-gray-300">{winRate}%</div>
              <div className="text-gray-400 text-xs sm:text-sm">Taux victoire</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}