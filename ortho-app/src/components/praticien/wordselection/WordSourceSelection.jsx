import {BarChart3, MessageSquare, User} from 'lucide-react';

// Word Source Selection
const WordSourceSelection = ({ onSelectSource, selectedWords, onCreateExercise, onClearSelection }) => (
  <div>
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex justify-between items-center">
      <p className="text-blue-800 font-medium">
        Mots sélectionnés : {selectedWords.length}
      </p>
      <div className="flex gap-2">
        {selectedWords.length > 0 && (
          <button
            onClick={onClearSelection}
            className="px-4 py-2 bg-rose-400 text-white rounded-lg hover:bg-rose-500 transition text-sm"
          >
            Effacer
          </button>
        )}
        {selectedWords.length >= 3 && (
          <button
            onClick={onCreateExercise}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Créer un exercice →
          </button>
        )}
      </div>
    </div>

    <div className="grid md:grid-cols-3 gap-6">
      <div 
        onClick={() => onSelectSource('frequency')}
        className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition cursor-pointer group"
      >
        <BarChart3 className="w-12 h-12 text-green-600 mb-4 group-hover:scale-110 transition" />
        <h3 className="text-xl font-bold mb-2">Fréquence par niveau</h3>
        <p className="text-gray-600 text-sm">
          Mots classés par fréquence et niveau scolaire (Manulex)
        </p>
      </div>

      <div 
        onClick={() => onSelectSource('irregular')}
        className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition cursor-pointer group"
      >
        <MessageSquare className="w-12 h-12 text-orange-600 mb-4 group-hover:scale-110 transition" />
        <h3 className="text-xl font-bold mb-2">Mots irréguliers</h3>
        <p className="text-gray-600 text-sm">Liste de mots avec orthographe irrégulière</p>
      </div>

      <div 
        onClick={() => onSelectSource('custom')}
        className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition cursor-pointer group"
      >
        <User className="w-12 h-12 text-purple-600 mb-4 group-hover:scale-110 transition" />
        <h3 className="text-xl font-bold mb-2">Sélection personnalisée</h3>
        <p className="text-gray-600 text-sm">Ajoutez vos propres mots manuellement</p>
      </div>
    </div>
  </div>
);

export default WordSourceSelection;