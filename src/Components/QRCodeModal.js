import React, { useState, useRef } from 'react';
import { QrCode, X, Download, Smartphone } from 'lucide-react';
import QRCode from 'qrcode';
import LZString from 'lz-string';

export default function QRCodeModal({ isOpen, onClose, data }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef();

  const generateQRCode = async () => {
    if (!data || (!data.decks?.length && !data.matches?.length)) {
      alert('Aucune donnée à partager');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Optimiser encore plus les données avec le nouveau format ultra-compact
      const ultraMinimalData = {
        d: data.decks.map(deck => [
          deck.id,
          deck.name,
          deck.hero,
          deck.elo,
          deck.wins,
          deck.losses
        ]),
        m: data.matches.map(match => [
          match.id,
          match.date,
          match.deck1Id || match.deck1?.id, // Support ancien format
          match.deck2Id || match.deck2?.id, // Support ancien format
          match.deck1OldElo || match.deck1?.oldElo, // Support ancien format
          match.deck2OldElo || match.deck2?.oldElo, // Support ancien format
          match.winnerId
        ])
      };

      const jsonString = JSON.stringify(ultraMinimalData);
      console.log('📊 Taille JSON originale:', jsonString.length, 'caractères');
      
      // Compression LZ avec base64 optimisé pour URLs
      const compressed = LZString.compressToEncodedURIComponent(jsonString);
      console.log('📦 Taille après compression LZ:', compressed.length, 'caractères');
      console.log('📈 Taux de compression:', Math.round((1 - compressed.length / jsonString.length) * 100) + '%');
      
      // Vérifier la taille finale (limite plus haute avec LZ compression)
      if (compressed.length > 2000) {
        const reduction = Math.round((1 - compressed.length / jsonString.length) * 100);
        alert(`Données encore trop volumineuses après compression (${compressed.length} caractères, -${reduction}%).\n\nSuggestions:\n- Utilisez l'export JSON classique\n- Partagez moins de matchs à la fois\n- Utilisez des noms de decks plus courts`);
        return;
      }
      
      // Créer une URL pour recevoir les données
      const shareUrl = `${window.location.origin}${window.location.pathname}#lz=${compressed}`;
      console.log('🔗 URL générée (LZ):', shareUrl.substring(0, 100) + '...');
      
      // Générer le QR code avec des paramètres optimisés pour la compression
      const qrCodeDataUrl = await QRCode.toDataURL(shareUrl, {
        width: 400, // Augmenter la taille pour une meilleure lisibilité
        margin: 2,
        errorCorrectionLevel: 'L', // Niveau bas car on a moins de données
        type: 'image/png',
        quality: 0.92,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      console.log('✅ QR code généré avec succès (compression LZ)');
      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error('❌ Erreur lors de la génération du QR code:', error);
      console.error('Détails de l\'erreur:', error.message);
      alert(`Erreur lors de la génération du QR code: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `fab-elo-qr-${new Date().toISOString().split('T')[0]}.png`;
    link.click();
  };

  React.useEffect(() => {
    if (isOpen && data) {
      generateQRCode();
    } else {
      setQrCodeUrl('');
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 sm:p-6 max-w-md w-full max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-100 flex items-center gap-2">
            <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Partager via QR Code</span><span className="sm:hidden">QR Code</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="text-center">
          {isGenerating ? (
            <div className="py-8 sm:py-12">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-red-500 mx-auto mb-3 sm:mb-4"></div>
              <p className="text-gray-400 text-sm sm:text-base">Génération du QR code...</p>
            </div>
          ) : qrCodeUrl ? (
            <div>
              <div className="bg-white p-2 sm:p-4 rounded-lg inline-block mb-3 sm:mb-4">
                <img src={qrCodeUrl} alt="QR Code" className="block w-full max-w-64" />
              </div>
              
              <div className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4 flex items-center justify-center gap-1">
                <Smartphone className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Scannez avec votre téléphone pour importer les données</span>
                <span className="sm:hidden">Scannez pour importer</span>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={downloadQRCode}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded transition mx-auto text-sm sm:text-base"
                >
                  <Download className="w-4 h-4" />
                  Télécharger le QR code
                </button>
                
                <div className="text-xs text-gray-500">
                  {data.decks?.length || 0} deck(s) • {data.matches?.length || 0} match(s)
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-gray-400">
              Erreur lors de la génération du QR code
            </div>
          )}
        </div>
      </div>
    </div>
  );
}