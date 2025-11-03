import React, { useState, useEffect } from 'react';
import { Trophy, Upload, Download, QrCode } from 'lucide-react';
// import de heroes from a separate file or define them here
import HEROES from './Utils/Heroes.json';
import AddDeckForm from './Components/AddDeckForm';
import AddMatchForm from './Components/AddMatchForm';
import MainContent from './Components/MainContent';
import QRCodeModal from './Components/QRCodeModal';
import dbManager from './Utils/dbManager';
import LZString from 'lz-string';

// Heroes list for flesh and blood silver age format
const INITIAL_ELO = 1500;
const K_FACTOR = 32;

function calculateElo(winnerElo, loserElo) {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));
  
  const newWinnerElo = Math.round(winnerElo + K_FACTOR * (1 - expectedWinner));
  const newLoserElo = Math.round(loserElo + K_FACTOR * (0 - expectedLoser));
  
  return { newWinnerElo, newLoserElo };
}

// Fonction utilitaire pour calculer les ELO et deltas d'un match (nouveau et ancien format)
function getMatchDisplayData(match, decks) {
  // Nouveau format optimisé
  if (match.deck1Id && match.deck2Id) {
    const deck1 = decks.find(d => d.id === match.deck1Id);
    const deck2 = decks.find(d => d.id === match.deck2Id);
    
    const winner = match.winnerId === match.deck1Id ? 'deck1' : 'deck2';
    const { newWinnerElo, newLoserElo } = calculateElo(
      winner === 'deck1' ? match.deck1OldElo : match.deck2OldElo,
      winner === 'deck1' ? match.deck2OldElo : match.deck1OldElo
    );
    
    const deck1NewElo = winner === 'deck1' ? newWinnerElo : newLoserElo;
    const deck2NewElo = winner === 'deck2' ? newWinnerElo : newLoserElo;
    
    return {
      deck1: {
        id: match.deck1Id,
        name: deck1?.name || 'Deck supprimé',
        hero: deck1?.hero || 'Inconnu',
        oldElo: match.deck1OldElo,
        newElo: deck1NewElo,
        eloChange: deck1NewElo - match.deck1OldElo
      },
      deck2: {
        id: match.deck2Id,
        name: deck2?.name || 'Deck supprimé',
        hero: deck2?.hero || 'Inconnu',
        oldElo: match.deck2OldElo,
        newElo: deck2NewElo,
        eloChange: deck2NewElo - match.deck2OldElo
      },
      winnerId: match.winnerId,
      id: match.id,
      date: match.date
    };
  }
  
  // Ancien format (rétrocompatibilité)
  return {
    deck1: match.deck1,
    deck2: match.deck2,
    winnerId: match.winnerId,
    id: match.id,
    date: match.date
  };
}

export default function FabEloTracker() {
  const [decks, setDecks] = useState([]);
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('ranking');
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckHero, setNewDeckHero] = useState(HEROES[0]);
  const [deck1Id, setDeck1Id] = useState('');
  const [deck2Id, setDeck2Id] = useState('');
  const [winnerId, setWinnerId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [dbSupported, setDbSupported] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);

  // Charger les données au démarrage
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Démarrage du chargement des données...');
        
        // Vérifier s'il y a des données à importer via URL
        const importFromUrl = checkForUrlImport();
        if (importFromUrl) {
          const migratedData = migrateOldDataFormat(importFromUrl);
          setDecks(migratedData.decks);
          setMatches(migratedData.matches);
          
          // Sauvegarder aussi dans IndexedDB si supporté
          if (dbManager.isSupported()) {
            await dbManager.saveAllData(migratedData.decks, migratedData.matches);
            console.log('✅ Données importées via QR code, migrées et sauvegardées');
          }
          
          // Nettoyer l'URL
          window.history.replaceState({}, document.title, window.location.pathname);
          alert('Données importées avec succès via QR code !');
        } else if (dbManager.isSupported()) {
          console.log('✅ IndexedDB supporté, chargement...');
          const data = await dbManager.loadAllData();
          const migratedData = migrateOldDataFormat(data);
          setDecks(migratedData.decks);
          setMatches(migratedData.matches);
          console.log('✅ Données chargées depuis IndexedDB et migrées si nécessaire');
        } else {
          console.warn('❌ IndexedDB non supporté par ce navigateur');
          setDbSupported(false);
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des données:', error);
        console.error('Stack trace:', error.stack);
        setDbSupported(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Sauvegarder automatiquement dans IndexedDB à chaque changement
  useEffect(() => {
    if (!isLoading && dbSupported) {
      const saveData = async () => {
        try {
          await dbManager.saveAllData(decks, matches);
        } catch (error) {
          console.error('Erreur lors de la sauvegarde:', error);
        }
      };

      // Débounce pour éviter trop de sauvegardes
      const timeoutId = setTimeout(saveData, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [decks, matches, isLoading, dbSupported]);

  const addDeck = () => {
    if (!newDeckName.trim()) return;
    
    const newDeck = {
      id: Date.now().toString(),
      name: newDeckName.trim(),
      hero: newDeckHero,
      elo: INITIAL_ELO,
      wins: 0,
      losses: 0
    };
    
    setDecks([...decks, newDeck]);
    setNewDeckName('');
    setNewDeckHero(HEROES[0]);
  };

  const addResult = () => {
    if (!deck1Id || !deck2Id || !winnerId || deck1Id === deck2Id) return;
    
    const deck1 = decks.find(d => d.id === deck1Id);
    const deck2 = decks.find(d => d.id === deck2Id);
    
    if (!deck1 || !deck2) return;
    
    const winner = winnerId === deck1Id ? deck1 : deck2;
    const loser = winnerId === deck1Id ? deck2 : deck1;
    
    const { newWinnerElo, newLoserElo } = calculateElo(winner.elo, loser.elo);
    
    // Nouveau format optimisé : on ne stocke que l'essentiel
    const match = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      deck1Id: deck1.id,
      deck2Id: deck2.id,
      deck1OldElo: deck1.elo,
      deck2OldElo: deck2.elo,
      winnerId: winner.id
    };
    
    setMatches([match, ...matches]);
    
    setDecks(decks.map(deck => {
      if (deck.id === winner.id) {
        return { ...deck, elo: newWinnerElo, wins: deck.wins + 1 };
      }
      if (deck.id === loser.id) {
        return { ...deck, elo: newLoserElo, losses: deck.losses + 1 };
      }
      return deck;
    }));
    
    setDeck1Id('');
    setDeck2Id('');
    setWinnerId('');
  };

  const updateDeck = (deckId, updates) => {
    setDecks(decks.map(deck => 
      deck.id === deckId 
        ? { ...deck, ...updates }
        : deck
    ));
  };

  const deleteDeck = (deckId) => {
    // Supprimer uniquement le deck de la liste
    setDecks(decks.filter(deck => deck.id !== deckId));
    
    // Les matchs restent intacts dans l'historique
    // Les autres decks gardent leurs ELO actuels
    
    // Reset les sélections si le deck supprimé était sélectionné
    if (deck1Id === deckId) setDeck1Id('');
    if (deck2Id === deckId) setDeck2Id('');
    if (winnerId === deckId) setWinnerId('');
  };

  const reverseLastMatch = () => {
    if (matches.length === 0) {
      alert('Aucun match à annuler');
      return;
    }

    const lastMatch = matches[0]; // Le premier dans la liste (plus récent)
    
    if (!window.confirm(`Annuler le dernier match ?\n\nCela va restaurer les ELO d'avant le match et supprimer le match de l'historique.`)) {
      return;
    }

    // Récupérer les données du match pour restaurer les ELO
    const matchData = getMatchDisplayData(lastMatch, decks);
    
    // Trouver les decks impliqués
    const deck1 = decks.find(d => d.id === matchData.deck1.id);
    const deck2 = decks.find(d => d.id === matchData.deck2.id);
    
    if (!deck1 || !deck2) {
      alert('Impossible d\'annuler : un des decks a été supprimé');
      return;
    }

    // Restaurer les ELO et les stats
    setDecks(decks.map(deck => {
      if (deck.id === deck1.id) {
        const wasWinner = matchData.winnerId === deck1.id;
        return { 
          ...deck, 
          elo: matchData.deck1.oldElo,
          wins: wasWinner ? Math.max(0, deck.wins - 1) : deck.wins,
          losses: !wasWinner ? Math.max(0, deck.losses - 1) : deck.losses
        };
      }
      if (deck.id === deck2.id) {
        const wasWinner = matchData.winnerId === deck2.id;
        return { 
          ...deck, 
          elo: matchData.deck2.oldElo,
          wins: wasWinner ? Math.max(0, deck.wins - 1) : deck.wins,
          losses: !wasWinner ? Math.max(0, deck.losses - 1) : deck.losses
        };
      }
      return deck;
    }));

    // Supprimer le match de l'historique
    setMatches(matches.slice(1));
    
    console.log('✅ Dernier match annulé et ELO restaurés');
  };

  const exportData = () => {
    const data = { decks, matches };
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fab-elo-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        const migratedData = migrateOldDataFormat(importedData);
        
        setDecks(migratedData.decks || []);
        setMatches(migratedData.matches || []);
        
        // Sauvegarder aussi dans IndexedDB si supporté
        if (dbSupported) {
          await dbManager.saveAllData(migratedData.decks || [], migratedData.matches || []);
          console.log('Données importées, migrées et sauvegardées dans IndexedDB');
        }
        
        alert('Données importées avec succès !');
      } catch (error) {
        console.error('Erreur lors de l\'import:', error);
        alert('Erreur lors du chargement du fichier JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const sortedDecks = [...decks].sort((a, b) => b.elo - a.elo);

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const clearAllData = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer TOUTES les données (decks et matchs) ? Cette action est irréversible.')) {
      setDecks([]);
      setMatches([]);
      
      if (dbSupported) {
        try {
          await dbManager.clearAllData();
          console.log('Toutes les données supprimées');
        } catch (error) {
          console.error('Erreur lors de la suppression:', error);
        }
      }
    }
  };

  const checkForUrlImport = () => {
    try {
      const hash = window.location.hash;
      console.log('🔍 Hash détecté:', hash);
      
      // Nouveau format avec compression LZ
      if (hash.startsWith('#lz=')) {
        const compressed = hash.substring(4); // Enlever '#lz='
        console.log('📦 Données LZ compressées reçues, taille:', compressed.length);
        
        const jsonString = LZString.decompressFromEncodedURIComponent(compressed);
        if (!jsonString) {
          throw new Error('Échec de décompression LZ');
        }
        console.log('📄 JSON décompressé (LZ), taille:', jsonString.length);
        
        const ultraMinimalData = JSON.parse(jsonString);
        
        // Reconstituer le format normal depuis le format ultra-minimal
        const data = {
          decks: ultraMinimalData.d.map(d => ({
            id: d[0],
            name: d[1],
            hero: d[2],
            elo: d[3],
            wins: d[4],
            losses: d[5]
          })),
          matches: ultraMinimalData.m.map(m => ({
            id: m[0],
            date: m[1],
            deck1Id: m[2],
            deck2Id: m[3],
            deck1OldElo: m[4],
            deck2OldElo: m[5],
            winnerId: m[6]
          }))
        };
        
        console.log('📱 Données LZ parsées avec succès:', {
          decks: data.decks?.length || 0,
          matches: data.matches?.length || 0
        });
        
        return data;
      }
      
      // Ancien format (rétrocompatibilité)
      if (hash.startsWith('#import=')) {
        const compressed = hash.substring(8); // Enlever '#import='
        console.log('📦 Données base64 reçues (ancien format), taille:', compressed.length);
        
        const jsonString = decodeURIComponent(escape(atob(compressed)));
        console.log('📄 JSON décompressé (base64), taille:', jsonString.length);
        
        const data = JSON.parse(jsonString);
        console.log('📱 Données base64 parsées avec succès:', {
          decks: data.decks?.length || 0,
          matches: data.matches?.length || 0
        });
        
        // Validation basique des données
        if (!data.decks || !Array.isArray(data.decks)) {
          throw new Error('Format de données invalide: decks manquant');
        }
        if (!data.matches || !Array.isArray(data.matches)) {
          throw new Error('Format de données invalide: matches manquant');
        }
        
        return data;
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'import via URL:', error);
      console.error('Type d\'erreur:', error.name);
      console.error('Message:', error.message);
      alert(`Erreur lors de l'import des données via QR code: ${error.message}`);
    }
    return null;
  };

  const shareViaQRCode = () => {
    setShowQRModal(true);
  };

  // Fonction de migration des anciennes données vers le nouveau format
  const migrateOldDataFormat = (data) => {
    if (!data.matches || data.matches.length === 0) {
      return data; // Pas de matchs à migrer
    }

    // Vérifier si les données sont déjà au nouveau format
    const isOldFormat = data.matches.some(match => 
      match.deck1 && typeof match.deck1 === 'object' && match.deck1.id
    );

    if (!isOldFormat) {
      console.log('📊 Données déjà au nouveau format');
      return data; // Déjà au nouveau format
    }

    console.log('🔄 Migration des données de l\'ancien format...');
    
    const migratedMatches = data.matches.map(match => {
      // Si c'est déjà au nouveau format, on garde tel quel
      if (match.deck1Id && match.deck2Id) {
        return match;
      }

      // Migration de l'ancien format
      return {
        id: match.id,
        date: match.date,
        deck1Id: match.deck1.id,
        deck2Id: match.deck2.id,
        deck1OldElo: match.deck1.oldElo,
        deck2OldElo: match.deck2.oldElo,
        winnerId: match.winnerId
      };
    });

    console.log(`✅ ${migratedMatches.length} matchs migrés vers le nouveau format`);
    
    return {
      decks: data.decks,
      matches: migratedMatches
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-2 sm:p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-red-500 mb-2 flex items-center gap-2 sm:gap-3">
            <Trophy className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
            <span className="hidden sm:inline">Flesh and Blood ELO</span>
            <span className="sm:hidden">FaB ELO</span>
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-gray-400 text-sm sm:text-base">Suivez les performances de vos decks</p>
            <div className="flex items-center gap-2">
              {dbSupported ? (
                <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">
                  💾 <span className="hidden sm:inline">Sauvegarde auto</span><span className="sm:hidden">Auto</span>
                </span>
              ) : (
                <span className="text-xs text-orange-400 bg-orange-400/10 px-2 py-1 rounded">
                  ⚠️ <span className="hidden sm:inline">Sauvegarde manuelle uniquement</span><span className="sm:hidden">Manuel</span>
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-8">
          {/* Ajouter un deck */}
          <AddDeckForm
            newDeckName={newDeckName}
            setNewDeckName={setNewDeckName}
            newDeckHero={newDeckHero}
            setNewDeckHero={setNewDeckHero}
            heroes={HEROES}
            onAddDeck={addDeck}
          />

          {/* Ajouter un résultat */}
          <AddMatchForm
            deck1Id={deck1Id}
            setDeck1Id={setDeck1Id}
            deck2Id={deck2Id}
            setDeck2Id={setDeck2Id}
            winnerId={winnerId}
            setWinnerId={setWinnerId}
            decks={decks}
            onAddResult={addResult}
          />
        </div>

        {/* Boutons Import/Export */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex gap-2 sm:gap-4 mb-4 sm:mb-8">
          <button
            onClick={reverseLastMatch}
            disabled={matches.length === 0}
            className="flex items-center justify-center gap-1 sm:gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold px-2 py-2 sm:px-4 sm:py-2 lg:px-6 lg:py-2 rounded transition text-xs sm:text-sm lg:text-base"
            title="Annuler le dernier match et restaurer les ELO"
          >
            ↺ <span className="hidden sm:inline">Annuler dernier match</span><span className="sm:hidden">Annuler</span>
          </button>
          <button
            onClick={exportData}
            disabled={decks.length === 0}
            className="flex items-center justify-center gap-1 sm:gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold px-2 py-2 sm:px-4 sm:py-2 lg:px-6 lg:py-2 rounded transition text-xs sm:text-sm lg:text-base"
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Exporter JSON</span><span className="sm:hidden">Export</span>
          </button>
          <label className="flex items-center justify-center gap-1 sm:gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-2 py-2 sm:px-4 sm:py-2 lg:px-6 lg:py-2 rounded transition cursor-pointer text-xs sm:text-sm lg:text-base">
            <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Importer JSON</span><span className="sm:hidden">Import</span>
            <input
              type="file"
              accept=".json"
              onChange={importData}
              className="hidden"
            />
          </label>
          <button
            onClick={shareViaQRCode}
            disabled={decks.length === 0 && matches.length === 0}
            className="flex items-center justify-center gap-1 sm:gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold px-2 py-2 sm:px-4 sm:py-2 lg:px-6 lg:py-2 rounded transition text-xs sm:text-sm lg:text-base"
          >
            <QrCode className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Partager via QR</span><span className="sm:hidden">QR</span>
          </button>
          {dbSupported && (
            <button
              onClick={clearAllData}
              className="flex items-center justify-center gap-1 sm:gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-2 py-2 sm:px-4 sm:py-2 lg:px-6 lg:py-2 rounded transition text-xs sm:text-sm lg:text-base col-span-2 sm:col-span-1"
            >
              🗑️ <span className="hidden sm:inline">Vider tout</span><span className="sm:hidden">Reset</span>
            </button>
          )}
        </div>

        {/* Onglets */}
        <MainContent
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sortedDecks={sortedDecks}
          matches={matches}
          formatDate={formatDate}
          heroes={HEROES}
          onUpdateDeck={updateDeck}
          onDeleteDeck={deleteDeck}
          getMatchDisplayData={getMatchDisplayData}
        />

        {/* Modal QR Code */}
        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          data={{ decks, matches }}
        />
      </div>
    </div>
  );
}