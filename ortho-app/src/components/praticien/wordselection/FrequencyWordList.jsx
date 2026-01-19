import { useState, useEffect } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { getWordsByLevelPaginated } from '../../../services/manulexService';

// Frequency Word List avec PAGINATION OPTIMISÉE (Load More)
const FrequencyWordList = ({ onBack, selectedWords, setSelectedWords }) => {
  const [selectedLevel, setSelectedLevel] = useState('CP');
  const [searchTerm, setSearchTerm] = useState('');
  const [words, setWords] = useState([]); // Liste cumulée
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('frequency');
  const [lastDoc, setLastDoc] = useState(null); // Curseur Firestore
  const [hasMore, setHasMore] = useState(false);
  
  const levels = ['CP', 'CE1', 'CE2-CM2'];

  // Réinitialiser et charger quand les filtres changent
  useEffect(() => {
    // On passe null pour le curseur pour dire "repart du début"
    loadWords(true);
  }, [selectedLevel, sortBy, searchTerm]);

  const loadWords = async (isReset = false) => {
    if (loading) return;
    setLoading(true);
    
    try {
      // Si c'est un reset (nouveau filtre), on ne passe pas de curseur (null)
      // Sinon, on passe le lastDoc actuel
      const cursor = isReset ? null : lastDoc;
      
      const result = await getWordsByLevelPaginated(
        selectedLevel, 
        sortBy, 
        cursor,
        searchTerm
      );
      
      if (isReset) {
        setWords(result.words);
      } else {
        // On ajoute les nouveaux mots à la suite
        setWords(prev => [...prev, ...result.words]);
      }
      
      setLastDoc(result.lastVisible);
      setHasMore(result.hasMore);
      
    } catch (error) {
      console.error('Erreur chargement mots:', error);
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

      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Mots par fréquence et niveau scolaire</h2>
        
        {/* Filtres de niveau */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {levels.map(level => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedLevel === level 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        {/* Barre de recherche et Tri */}
        <div className="mb-4 flex gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un mot (commence par)..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg bg-white"
          >
            <option value="frequency">Par fréquence</option>
            <option value="alphabetical">Alphabétique</option>
          </select>
        </div>

        {/* Info barre */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex justify-between items-center">
          <p className="text-blue-800 font-medium">
            {selectedWords.length} mot(s) sélectionné(s)
          </p>
          <span className="text-sm text-blue-600">
            Affichage de {words.length} mots
          </span>
        </div>

        {/* Grille de mots */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 min-h-[200px]">
          {words.length > 0 ? (
            words.map((wordData, index) => (
              <button
                key={`${wordData.id}-${index}`} // Clé unique combinée
                onClick={() => toggleWord(wordData.word)}
                className={`p-3 rounded-lg border-2 transition text-left truncate ${
                  selectedWords.includes(wordData.word)
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 hover:border-blue-300 bg-white'
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
                  ? `Aucun mot commençant par "${searchTerm}"` 
                  : 'Aucun mot trouvé.'}
              </div>
            )
          )}
        </div>

        {/* Zone de chargement et bouton "Charger plus" */}
        <div className="mt-8 text-center">
          {loading && (
            <div className="mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          )}
          
          {!loading && hasMore && (
            <button
              onClick={() => loadWords(false)} // false = pas un reset, on charge la suite
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

export default FrequencyWordList;