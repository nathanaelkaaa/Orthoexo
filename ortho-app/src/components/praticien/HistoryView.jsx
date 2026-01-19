import { useState, useEffect } from 'react';
import { ArrowRight, BarChart3, Clock, RefreshCw, Brain, Layers } from 'lucide-react';

const HistoryView = ({ onBack }) => {
  const [history, setHistory] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const savedHistory = JSON.parse(localStorage.getItem('exerciseHistory') || '[]');
    setHistory(savedHistory);
  };

  const deleteExercise = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet exercice ?')) {
      const updatedHistory = history.filter(ex => ex.id !== id);
      setHistory(updatedHistory);
      localStorage.setItem('exerciseHistory', JSON.stringify(updatedHistory));
      if (selectedExercise?.id === id) {
        setSelectedExercise(null);
      }
    }
  };

  const clearHistory = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer tout l\'historique ?')) {
      setHistory([]);
      setSelectedExercise(null);
      localStorage.removeItem('exerciseHistory');
    }
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Rendu détaillée : anagram
  const renderAnagramDetails = (exercise) => (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-blue-800 font-medium">Type : Anagramme</p>
            <p className="text-blue-700 text-sm mt-1">
              Taux de réussite : {Math.round((exercise.score / exercise.total) * 100)}%
            </p>
          </div>
          <div className="text-right">
             <span className="text-3xl font-bold text-blue-600">{exercise.score}/{exercise.total}</span>
             <p className="text-xs text-blue-600 uppercase font-bold">Score</p>
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-4">Résultats détaillés</h3>
      <div className="space-y-3">
        {exercise.results.map((result, idx) => (
          <div 
            key={idx}
            className={`p-4 rounded-lg border-2 ${
              result.correct 
                ? 'bg-green-50 border-green-300' 
                : 'bg-red-50 border-red-300'
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-800">
                  Mot : {result.word}
                </p>
                <p className="text-gray-600 text-sm">
                  Réponse : {result.userAnswer || '(vide)'}
                </p>
              </div>
              <div className={`text-2xl ${result.correct ? 'text-green-600' : 'text-red-600'}`}>
                {result.correct ? '✓' : '✗'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  // Rendu détaillée : memory
  const renderMemoryDetails = (exercise) => {
    const stats = exercise.results.find(r => r.completed) || exercise.results[0] || {};
    
    return (
      <>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <RefreshCw className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-purple-700">{stats.moves || 0}</p>
            <p className="text-sm text-purple-800 font-medium uppercase">Coups joués</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-blue-700">{formatDuration(stats.duration)}</p>
            <p className="text-sm text-blue-800 font-medium uppercase">Temps total</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-gray-600" />
            Paires trouvées ({exercise.words.length / 2})
          </h3>
          <div className="flex flex-wrap gap-2">
            {[...new Set(exercise.words)].map((word, idx) => (
              <span key={idx} className="px-3 py-1 bg-white border border-gray-300 rounded-full text-gray-700 text-sm font-medium">
                {word}
              </span>
            ))}
          </div>
        </div>
      </>
    );
  };

  // Vue détaillée
  if (selectedExercise) {
    return (
      <div>
        <button 
          onClick={() => setSelectedExercise(null)}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Retour à l'historique
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8 animate-fade-in">
          <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                {selectedExercise.type === 'memory' ? <Brain className="w-6 h-6 text-purple-600"/> : <BarChart3 className="w-6 h-6 text-blue-600"/>}
                Détails de l'exercice
              </h2>
              <p className="text-gray-500 text-sm">{formatDate(selectedExercise.date)}</p>
            </div>
          </div>

          {selectedExercise.type === 'memory' 
            ? renderMemoryDetails(selectedExercise)
            : renderAnagramDetails(selectedExercise)
          }
        </div>
      </div>
    );
  }

  // Vue grid
  return (
    <div>
      <button 
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800"
      >
        <ArrowRight className="w-4 h-4 rotate-180" />
        Retour aux catégories
      </button>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Historique des exercices</h1>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="px-4 py-2 bg-rose-400 text-white rounded-lg hover:bg-rose-500 transition shadow-sm"
          >
            Tout effacer
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
          <BarChart3 className="w-24 h-24 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-600 mb-2">
            Aucun exercice dans l'historique
          </h3>
          <p className="text-gray-400">Les exercices complétés apparaîtront ici</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((exercise) => {
            const isMemory = exercise.type === 'memory';
            const memStats = isMemory ? (exercise.results.find(r => r.completed) || exercise.results[0] || {}) : null;

            return (
              <div 
                key={exercise.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition cursor-pointer border border-transparent hover:border-blue-100 group"
                onClick={() => setSelectedExercise(exercise)}
              >
                <div className="p-6">
                  {/* Header Carte */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {isMemory 
                          ? <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded uppercase font-bold">Memory</span>
                          : <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded uppercase font-bold">Anagramme</span>
                        }
                      </div>
                      <p className="text-gray-400 text-xs">{formatDate(exercise.date)}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteExercise(exercise.id);
                      }}
                      className="text-gray-300 hover:text-red-500 transition p-1 hover:bg-red-50 rounded"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Corps Carte */}
                  <div className={`rounded-lg p-4 text-white mb-4 shadow-sm ${
                    isMemory 
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-600' 
                      : 'bg-gradient-to-br from-blue-500 to-cyan-600'
                  }`}>
                    {isMemory ? (
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-2xl font-bold">{memStats.moves || '?'}</div>
                          <div className="text-xs opacity-80">Coups</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{formatDuration(memStats.duration)}</div>
                          <div className="text-xs opacity-80">Temps</div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-3xl font-bold">{exercise.score}/{exercise.total}</div>
                        <div className="text-sm opacity-90">
                          {Math.round((exercise.score / exercise.total) * 100)}% de réussite
                        </div>
                      </>
                    )}
                  </div>

                  {/* Footer Carte */}
                  <div className="text-sm text-gray-500 flex justify-between items-center">
                    <span>
                       {isMemory 
                         ? `${exercise.words.length / 2} paires` 
                         : `${exercise.words.length} mots`
                       }
                    </span>
                    <span className="text-blue-600 group-hover:translate-x-1 transition-transform text-xs font-bold">
                      Voir →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoryView;