import { useState } from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';


// Custom Word List (pas de pagination nécessaire)
const CustomWordList = ({ onBack, selectedWords, setSelectedWords }) => {
  const [newWord, setNewWord] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredWords = selectedWords.filter(word => 
    word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addWord = () => {
    if (newWord.trim() && !selectedWords.includes(newWord.trim())) {
      setSelectedWords([...selectedWords, newWord.trim()]);
      setNewWord('');
    }
  };

  const removeWord = (word) => {
    setSelectedWords(selectedWords.filter(w => w !== word));
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
        <h2 className="text-2xl font-bold mb-4">Sélection personnalisée</h2>
        <p className="text-gray-600 mb-6">Ajoutez vos propres mots pour créer une liste personnalisée</p>

        <div className="flex gap-3 mb-6">
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addWord()}
            placeholder="Entrez un mot..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={addWord}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
          >
            Ajouter
          </button>
        </div>

        {selectedWords.length > 0 && (
          <div className="mb-6">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher dans votre liste..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        )}

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <p className="text-purple-800 font-medium">
            {selectedWords.length} mot(s) dans votre liste
            {searchTerm && ` • ${filteredWords.length} mot(s) affiché(s)`}
          </p>
        </div>

        {selectedWords.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredWords.length > 0 ? (
              filteredWords.map((word, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border-2 border-purple-200 bg-purple-50 flex justify-between items-center"
                >
                  <span className="text-purple-700 font-medium">{word}</span>
                  <button
                    onClick={() => removeWord(word)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    ✕
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-400">
                Aucun mot trouvé pour "{searchTerm}"
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Aucun mot ajouté. Commencez par ajouter des mots ci-dessus.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomWordList;