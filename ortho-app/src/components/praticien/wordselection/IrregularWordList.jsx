import { useState, useEffect } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { getIrregularWordsPaginated } from '../../../services/manulexService';

// Irregular Word List avec PAGINATION OPTIMISÉE (Load More)
const IrregularWordList = ({ onBack, selectedWords, setSelectedWords }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [words, setWords] = useState([]); // Liste cumulée
  const [loading, setLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState(null); // Curseur Firestore
  const [hasMore, setHasMore] = useState(false);

  // Recharger si la recherche change
  useEffect(() => {
    // On passe true pour dire "Reset complet"
    loadWords(true);
  }, [searchTerm]);

  const loadWords = async (isReset = false) => {
    if (loading) return;
    setLoading(true);
    
    try {
      // Si c'est un reset, curseur = null. Sinon on prend le dernier doc.
      const cursor = isReset ? null : lastDoc;
      const result = await getIrregularWordsPaginated(cursor, searchTerm);
      
      if (isReset) {
        setWords(result.words);
      } else {
        // On ajoute à la suite
        setWords(prev => [...prev, ...result.words]);
      }
      
      setLastDoc(result.lastVisible);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Erreur chargement mots irréguliers:', error);
    }
    setLoading(false);
  };

  const toggleWord = (word) => {
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter(w => w !== word));
    } else {
      setSelectedWords([...selectedWords, word]);
    }
  };

  return (
    <div>
      <button 
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800"
      >
        <ArrowRight className="w-4 h-4 rotate-180" />
        Retour
      </button>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Mots irréguliers</h2>
        <p className="text-gray-600 mb-4">Mots avec orthographe particulière ou irrégulière</p>

        {/* Barre de recherche */}
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un mot (commence par)..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Info barre */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4 flex justify-between items-center">
          <p className="text-orange-800 font-medium">
            {selectedWords.length} mot(s) sélectionné(s)
          </p>
          <span className="text-sm text-orange-600">
            Affichage de {words.length} mots
          </span>
        </div>

        {/* Grille de mots */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 min-h-[200px]">
          {words.length > 0 ? (
            words.map((wordData, index) => (
              <button
                key={`${wordData.id}-${index}`}
                onClick={() => toggleWord(wordData.word)}
                className={`p-3 rounded-lg border-2 transition text-left truncate ${
                  selectedWords.includes(wordData.word)
                    ? 'border-orange-600 bg-orange-50 text-orange-700 font-medium'
                    : 'border-gray-200 hover:border-orange-300 bg-white'
                }`}
                title={wordData.word}
              >
                {wordData.word}
              </button>
            ))
          ) : (
            !loading && (
              <div className="col-span-full text-center py-12 text-gray-400">
                {searchTerm 
                  ? `Aucun mot trouvé pour "${searchTerm}"` 
                  : 'Aucun mot.'}
              </div>
            )
          )}
        </div>

        {/* Zone de chargement et bouton "Charger plus" */}
        <div className="mt-8 text-center">
          {loading && (
            <div className="mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            </div>
          )}
          
          {!loading && hasMore && (
            <button
              onClick={() => loadWords(false)} // false = charger la suite
              className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition flex items-center gap-2 mx-auto"
            >
              Charger plus de mots
              <ChevronRight className="w-4 h-4 rotate-90" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default IrregularWordList;