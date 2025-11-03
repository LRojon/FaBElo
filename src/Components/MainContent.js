import React from 'react';
import { Trophy, Swords, Settings } from 'lucide-react';
import DeckListItem from './DeckListItem';

export default function MainContent({ 
  activeTab, 
  setActiveTab, 
  sortedDecks, 
  matches, 
  formatDate,
  heroes,
  onUpdateDeck,
  onDeleteDeck,
  getMatchDisplayData
}) {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('ranking')}
          className={`flex-1 px-3 py-3 sm:px-6 sm:py-4 font-semibold transition flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-base ${
            activeTab === 'ranking'
              ? 'bg-gray-700 text-red-500 border-b-2 border-red-500'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-750'
          }`}
        >
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Classement ELO</span><span className="sm:hidden">Ranking</span>
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          className={`flex-1 px-3 py-3 sm:px-6 sm:py-4 font-semibold transition flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-base ${
            activeTab === 'matches'
              ? 'bg-gray-700 text-red-500 border-b-2 border-red-500'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-750'
          }`}
        >
          <Swords className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Historique ({matches.length})</span><span className="sm:hidden">Matchs</span>
        </button>
        <button
          onClick={() => setActiveTab('decks')}
          className={`flex-1 px-3 py-3 sm:px-6 sm:py-4 font-semibold transition flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-base ${
            activeTab === 'decks'
              ? 'bg-gray-700 text-red-500 border-b-2 border-red-500'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-750'
          }`}
        >
          <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Gestion Decks ({sortedDecks.length})</span><span className="sm:hidden">Decks</span>
        </button>
      </div>

      {/* Contenu Classement */}
      {activeTab === 'ranking' && (
        <>
          {sortedDecks.length === 0 ? (
            <p className="p-4 sm:p-6 text-gray-400 text-center text-sm sm:text-base">
              Aucun deck pour le moment. Ajoutez-en un pour commencer !
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-750">
                  <tr className="text-left text-gray-300 text-xs sm:text-sm">
                    <th className="px-2 py-2 sm:px-6 sm:py-3 font-semibold">Rang</th>
                    <th className="px-2 py-2 sm:px-6 sm:py-3 font-semibold">Deck</th>
                    <th className="px-2 py-2 sm:px-6 sm:py-3 font-semibold hidden sm:table-cell">Hero</th>
                    <th className="px-2 py-2 sm:px-6 sm:py-3 font-semibold">ELO</th>
                    <th className="px-1 py-2 sm:px-6 sm:py-3 font-semibold">V</th>
                    <th className="px-1 py-2 sm:px-6 sm:py-3 font-semibold">D</th>
                    <th className="px-2 py-2 sm:px-6 sm:py-3 font-semibold">WR%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {(() => {
                    // Séparer les decks avec et sans combat
                    const decksWithMatches = sortedDecks.filter(deck => deck.wins + deck.losses > 0);
                    const decksWithoutMatches = sortedDecks.filter(deck => deck.wins + deck.losses === 0);
                    
                    return (
                      <>
                        {/* Decks avec combat - classés par ELO */}
                        {decksWithMatches.map((deck, index) => {
                          const totalGames = deck.wins + deck.losses;
                          const winRate = totalGames > 0 ? ((deck.wins / totalGames) * 100).toFixed(1) : '0.0';
                          
                          return (
                            <tr key={deck.id} className="hover:bg-gray-750 transition">
                              <td className="px-2 py-2 sm:px-6 sm:py-4">
                                <span className={`text-sm sm:text-lg font-bold ${
                                  index === 0 ? 'text-yellow-400' :
                                  index === 1 ? 'text-gray-300' :
                                  index === 2 ? 'text-orange-400' :
                                  'text-gray-400'
                                }`}>
                                  #{index + 1}
                                </span>
                              </td>
                              <td className="px-2 py-2 sm:px-6 sm:py-4 font-medium text-xs sm:text-base">
                                <div>{deck.name}</div>
                                <div className="text-xs text-red-400 sm:hidden">{deck.hero}</div>
                              </td>
                              <td className="px-2 py-2 sm:px-6 sm:py-4 text-red-400 hidden sm:table-cell">{deck.hero}</td>
                              <td className="px-2 py-2 sm:px-6 sm:py-4">
                                <span className="text-sm sm:text-lg font-bold">{deck.elo}</span>
                              </td>
                              <td className="px-1 py-2 sm:px-6 sm:py-4 text-green-400 text-xs sm:text-base">{deck.wins}</td>
                              <td className="px-1 py-2 sm:px-6 sm:py-4 text-red-400 text-xs sm:text-base">{deck.losses}</td>
                              <td className="px-2 py-2 sm:px-6 sm:py-4 text-gray-300 text-xs sm:text-base">{winRate}%</td>
                            </tr>
                          );
                        })}
                        
                        {/* Decks sans combat - sans rang */}
                        {decksWithoutMatches.map((deck) => (
                          <tr key={deck.id} className="hover:bg-gray-750 transition opacity-75">
                            <td className="px-2 py-2 sm:px-6 sm:py-4">
                              <span className="text-sm sm:text-lg font-bold text-gray-500">-</span>
                            </td>
                            <td className="px-2 py-2 sm:px-6 sm:py-4 font-medium text-gray-300 text-xs sm:text-base">
                              <div>{deck.name}</div>
                              <div className="text-xs text-red-400 sm:hidden">{deck.hero}</div>
                            </td>
                            <td className="px-2 py-2 sm:px-6 sm:py-4 text-red-400 hidden sm:table-cell">{deck.hero}</td>
                            <td className="px-2 py-2 sm:px-6 sm:py-4">
                              <span className="text-sm italic text-gray-500">En attente</span>
                            </td>
                            <td className="px-1 py-2 sm:px-6 sm:py-4 text-gray-500 text-xs sm:text-base">{deck.wins}</td>
                            <td className="px-1 py-2 sm:px-6 sm:py-4 text-gray-500 text-xs sm:text-base">{deck.losses}</td>
                            <td className="px-2 py-2 sm:px-6 sm:py-4 text-gray-500 text-xs sm:text-base">-</td>
                          </tr>
                        ))}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Contenu Historique */}
      {activeTab === 'matches' && (
        <>
          {matches.length === 0 ? (
            <p className="p-6 text-gray-400 text-center">
              Aucun affrontement enregistré pour le moment.
            </p>
          ) : (
            <div className="divide-y divide-gray-700">
              {matches.map((rawMatch) => {
                const match = getMatchDisplayData(rawMatch, sortedDecks);
                
                // Vérifier si les decks existent encore
                const deck1Exists = sortedDecks.some(d => d.id === match.deck1.id);
                const deck2Exists = sortedDecks.some(d => d.id === match.deck2.id);
                
                return (
                  <div key={match.id} className="p-3 sm:p-6 hover:bg-gray-750 transition">
                    <div className="flex items-center justify-between mb-2 sm:mb-4">
                      <span className="text-xs sm:text-sm text-gray-400">
                        {formatDate(match.date)}
                      </span>
                      {(!deck1Exists || !deck2Exists) && (
                        <span className="text-xs text-orange-400 bg-orange-400/10 px-2 py-1 rounded">
                          Deck supprimé
                        </span>
                      )}
                    </div>
                    
                    {/* Version mobile */}
                    <div className="sm:hidden space-y-3">
                      {/* Deck 1 */}
                      <div className={`${match.winnerId === match.deck1.id ? 'opacity-100' : 'opacity-60'} ${!deck1Exists ? 'line-through' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className={`font-semibold text-sm ${!deck1Exists ? 'text-gray-500' : ''}`}>
                              {match.deck1.name} {match.winnerId === match.deck1.id && '🏆'}
                            </div>
                            <div className={`text-xs ${!deck1Exists ? 'text-gray-600' : 'text-gray-400'}`}>
                              {match.deck1.hero}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold">{match.deck1.oldElo} → {match.deck1.newElo}</div>
                            <div className={`text-xs font-semibold ${match.deck1.eloChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {match.deck1.eloChange > 0 ? '+' : ''}{match.deck1.eloChange} ELO
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Séparateur VS */}
                      <div className="text-center text-gray-500 text-xs">VS</div>
                      
                      {/* Deck 2 */}
                      <div className={`${match.winnerId === match.deck2.id ? 'opacity-100' : 'opacity-60'} ${!deck2Exists ? 'line-through' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className={`font-semibold text-sm ${!deck2Exists ? 'text-gray-500' : ''}`}>
                              {match.deck2.name} {match.winnerId === match.deck2.id && '🏆'}
                            </div>
                            <div className={`text-xs ${!deck2Exists ? 'text-gray-600' : 'text-gray-400'}`}>
                              {match.deck2.hero}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold">{match.deck2.oldElo} → {match.deck2.newElo}</div>
                            <div className={`text-xs font-semibold ${match.deck2.eloChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {match.deck2.eloChange > 0 ? '+' : ''}{match.deck2.eloChange} ELO
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Version desktop */}
                    <div className="hidden sm:grid grid-cols-3 gap-4 items-center">
                      {/* Deck 1 */}
                      <div className={`text-right ${match.winnerId === match.deck1.id ? 'opacity-100' : 'opacity-60'} ${!deck1Exists ? 'line-through' : ''}`}>
                        <div className={`font-semibold text-lg ${!deck1Exists ? 'text-gray-500' : ''}`}>
                          {match.deck1.name}
                        </div>
                        <div className={`text-sm ${!deck1Exists ? 'text-gray-600' : 'text-gray-400'}`}>
                          {match.deck1.hero}
                        </div>
                        <div className="mt-2">
                          <span className="text-xl font-bold">{match.deck1.oldElo}</span>
                          <span className="mx-2 text-gray-500">→</span>
                          <span className="text-xl font-bold">{match.deck1.newElo}</span>
                        </div>
                        <div className={`text-sm font-semibold ${match.deck1.eloChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {match.deck1.eloChange > 0 ? '+' : ''}{match.deck1.eloChange} ELO
                        </div>
                      </div>

                      {/* VS */}
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-700 rounded-full">
                          <Swords className="w-8 h-8 text-red-500" />
                        </div>
                        {match.winnerId === match.deck1.id && (
                          <div className="mt-2 text-green-400 font-semibold text-sm">Victoire ←</div>
                        )}
                        {match.winnerId === match.deck2.id && (
                          <div className="mt-2 text-green-400 font-semibold text-sm">→ Victoire</div>
                        )}
                      </div>

                      {/* Deck 2 */}
                      <div className={`text-left ${match.winnerId === match.deck2.id ? 'opacity-100' : 'opacity-60'} ${!deck2Exists ? 'line-through' : ''}`}>
                        <div className={`font-semibold text-lg ${!deck2Exists ? 'text-gray-500' : ''}`}>
                          {match.deck2.name}
                        </div>
                        <div className={`text-sm ${!deck2Exists ? 'text-gray-600' : 'text-gray-400'}`}>
                          {match.deck2.hero}
                        </div>
                        <div className="mt-2">
                          <span className="text-xl font-bold">{match.deck2.oldElo}</span>
                          <span className="mx-2 text-gray-500">→</span>
                          <span className="text-xl font-bold">{match.deck2.newElo}</span>
                        </div>
                        <div className={`text-sm font-semibold ${match.deck2.eloChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {match.deck2.eloChange > 0 ? '+' : ''}{match.deck2.eloChange} ELO
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Contenu Gestion des Decks */}
      {activeTab === 'decks' && (
        <>
          {sortedDecks.length === 0 ? (
            <p className="p-6 text-gray-400 text-center">
              Aucun deck pour le moment. Ajoutez-en un pour commencer !
            </p>
          ) : (
            <div className="p-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sortedDecks.map((deck) => (
                  <DeckListItem
                    key={deck.id}
                    deck={deck}
                    heroes={heroes}
                    onUpdateDeck={onUpdateDeck}
                    onDeleteDeck={onDeleteDeck}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}