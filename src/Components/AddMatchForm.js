import React from 'react';

export default function AddMatchForm({ 
  deck1Id, 
  setDeck1Id, 
  deck2Id, 
  setDeck2Id, 
  winnerId, 
  setWinnerId, 
  decks, 
  onAddResult 
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onAddResult();
  };

  const isFormValid = deck1Id && deck2Id && winnerId && deck1Id !== deck2Id;

  return (
    <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700">
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-green-400">⚔️ Ajouter un résultat</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <select
          value={deck1Id}
          onChange={(e) => setDeck1Id(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 sm:px-4 sm:py-2 text-gray-100 focus:outline-none focus:border-red-500 text-sm sm:text-base"
          required
        >
          <option value="" disabled>Sélectionner le deck 1</option>
          {decks.map(deck => (
            <option key={deck.id} value={deck.id}>
              {deck.name} ({deck.hero})
            </option>
          ))}
        </select>
        <select
          value={deck2Id}
          onChange={(e) => setDeck2Id(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 sm:px-4 sm:py-2 text-gray-100 focus:outline-none focus:border-red-500 text-sm sm:text-base"
          required
        >
          <option value="" disabled>Sélectionner le deck 2</option>
          {decks.map(deck => (
            <option key={deck.id} value={deck.id}>
              {deck.name} ({deck.hero})
            </option>
          ))}
        </select>
        
        {/* Boutons pour choisir le vainqueur */}
        {deck1Id && deck2Id && deck1Id !== deck2Id && (
          <div className="space-y-2">
            <p className="text-xs sm:text-sm text-gray-300 font-medium">Qui a gagné ?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setWinnerId(deck1Id)}
                className={`px-3 py-2 sm:px-4 sm:py-3 rounded font-semibold transition text-sm sm:text-base ${
                  winnerId === deck1Id
                    ? 'bg-green-600 text-white border-2 border-green-400'
                    : 'bg-gray-700 text-gray-200 border-2 border-gray-600 hover:bg-gray-600'
                }`}
              >
                <div className="font-medium">
                  🏆 {decks.find(d => d.id === deck1Id)?.name}
                </div>
                <div className="text-xs text-gray-400">
                  {decks.find(d => d.id === deck1Id)?.hero}
                </div>
              </button>
              <button
                type="button"
                onClick={() => setWinnerId(deck2Id)}
                className={`px-3 py-2 sm:px-4 sm:py-3 rounded font-semibold transition text-sm sm:text-base ${
                  winnerId === deck2Id
                    ? 'bg-green-600 text-white border-2 border-green-400'
                    : 'bg-gray-700 text-gray-200 border-2 border-gray-600 hover:bg-gray-600'
                }`}
              >
                <div className="font-medium">
                  🏆 {decks.find(d => d.id === deck2Id)?.name}
                </div>
                <div className="text-xs text-gray-400">
                  {decks.find(d => d.id === deck2Id)?.hero}
                </div>
              </button>
            </div>
          </div>
        )}
        <button
          type="submit"
          disabled={!isFormValid}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 sm:py-3 rounded transition text-sm sm:text-base"
        >
          ✅ Enregistrer le résultat
        </button>
      </form>
    </div>
  );
}