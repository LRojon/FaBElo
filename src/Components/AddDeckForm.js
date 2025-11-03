import React from 'react';
import { Plus } from 'lucide-react';

export default function AddDeckForm({ 
  newDeckName, 
  setNewDeckName, 
  newDeckHero, 
  setNewDeckHero, 
  heroes, 
  onAddDeck 
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onAddDeck();
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-red-400">
        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
        Ajouter un deck
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Nom du deck"
          value={newDeckName}
          onChange={(e) => setNewDeckName(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 sm:px-4 sm:py-2 text-gray-100 placeholder-gray-400 focus:outline-none focus:border-red-500 text-sm sm:text-base"
          required
        />
        <select
          value={newDeckHero}
          onChange={(e) => setNewDeckHero(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 sm:px-4 sm:py-2 text-gray-100 focus:outline-none focus:border-red-500 text-sm sm:text-base"
        >
          {heroes.map(hero => (
            <option key={hero} value={hero}>{hero}</option>
          ))}
        </select>
        <button
          type="submit"
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 sm:py-3 rounded transition text-sm sm:text-base"
        >
          ➕ Ajouter
        </button>
      </form>
    </div>
  );
}