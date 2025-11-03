// Utilitaire pour gérer IndexedDB pour l'app FaB ELO
const DB_NAME = 'FabEloTracker';
const DB_VERSION = 1;
const STORES = {
  DECKS: 'decks',
  MATCHES: 'matches'
};

class FabEloDBManager {
  constructor() {
    this.db = null;
  }

  // Initialiser la base de données
  async init() {
    console.log('🚀 Tentative d\'initialisation IndexedDB...');
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('❌ Erreur lors de l\'ouverture d\'IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialisé avec succès');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Créer le store pour les decks
        if (!db.objectStoreNames.contains(STORES.DECKS)) {
          const deckStore = db.createObjectStore(STORES.DECKS, { keyPath: 'id' });
          deckStore.createIndex('hero', 'hero', { unique: false });
          deckStore.createIndex('elo', 'elo', { unique: false });
        }

        // Créer le store pour les matchs
        if (!db.objectStoreNames.contains(STORES.MATCHES)) {
          const matchStore = db.createObjectStore(STORES.MATCHES, { keyPath: 'id' });
          matchStore.createIndex('date', 'date', { unique: false });
          matchStore.createIndex('deck1Id', 'deck1.id', { unique: false });
          matchStore.createIndex('deck2Id', 'deck2.id', { unique: false });
        }

        console.log('Stores IndexedDB créés');
      };
    });
  }

  // Sauvegarder les decks
  async saveDecks(decks) {
    if (!this.db) await this.init();

    const transaction = this.db.transaction([STORES.DECKS], 'readwrite');
    const store = transaction.objectStore(STORES.DECKS);

    // Vider le store et ajouter tous les decks
    await store.clear();
    
    const promises = decks.map(deck => {
      return new Promise((resolve, reject) => {
        const request = store.add(deck);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
    console.log(`${decks.length} decks sauvegardés dans IndexedDB`);
  }

  // Charger les decks
  async loadDecks() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.DECKS], 'readonly');
      const store = transaction.objectStore(STORES.DECKS);
      const request = store.getAll();

      request.onsuccess = () => {
        const decks = request.result || [];
        console.log(`${decks.length} decks chargés depuis IndexedDB`);
        resolve(decks);
      };

      request.onerror = () => {
        console.error('Erreur lors du chargement des decks:', request.error);
        reject(request.error);
      };
    });
  }

  // Sauvegarder les matchs
  async saveMatches(matches) {
    if (!this.db) await this.init();

    const transaction = this.db.transaction([STORES.MATCHES], 'readwrite');
    const store = transaction.objectStore(STORES.MATCHES);

    // Vider le store et ajouter tous les matchs
    await store.clear();
    
    const promises = matches.map(match => {
      return new Promise((resolve, reject) => {
        const request = store.add(match);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
    console.log(`${matches.length} matchs sauvegardés dans IndexedDB`);
  }

  // Charger les matchs
  async loadMatches() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORES.MATCHES], 'readonly');
      const store = transaction.objectStore(STORES.MATCHES);
      const request = store.getAll();

      request.onsuccess = () => {
        const matches = request.result || [];
        // Trier par date décroissante comme dans l'app
        matches.sort((a, b) => new Date(b.date) - new Date(a.date));
        console.log(`${matches.length} matchs chargés depuis IndexedDB`);
        resolve(matches);
      };

      request.onerror = () => {
        console.error('Erreur lors du chargement des matchs:', request.error);
        reject(request.error);
      };
    });
  }

  // Charger toutes les données
  async loadAllData() {
    console.log('📥 Chargement de toutes les données...');
    
    const [decks, matches] = await Promise.all([
      this.loadDecks(),
      this.loadMatches()
    ]);

    console.log('📊 Données chargées:', { decks: decks.length, matches: matches.length });
    return { decks, matches };
  }

  // Sauvegarder toutes les données
  async saveAllData(decks, matches) {
    await Promise.all([
      this.saveDecks(decks),
      this.saveMatches(matches)
    ]);
  }

  // Vider complètement la base
  async clearAllData() {
    if (!this.db) await this.init();

    const transaction = this.db.transaction([STORES.DECKS, STORES.MATCHES], 'readwrite');
    
    await Promise.all([
      transaction.objectStore(STORES.DECKS).clear(),
      transaction.objectStore(STORES.MATCHES).clear()
    ]);

    console.log('Toutes les données IndexedDB supprimées');
  }

  // Vérifier si IndexedDB est supporté
  isSupported() {
    const supported = 'indexedDB' in window && window.indexedDB !== null;
    console.log('🔍 IndexedDB supporté:', supported);
    
    if (!supported) {
      console.warn('Raisons possibles:');
      console.warn('- Navigation privée');
      console.warn('- Extensions bloquantes');
      console.warn('- Navigateur très ancien');
    }
    
    return supported;
  }
}

// Instance singleton
const dbManager = new FabEloDBManager();

export default dbManager;