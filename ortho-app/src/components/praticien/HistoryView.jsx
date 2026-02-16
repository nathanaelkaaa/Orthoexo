import { useState, useEffect } from 'react';
import { 
  ArrowRight, BarChart3, Clock, RefreshCw, Brain, Layers, 
  MessageSquare, CheckCircle, XCircle, LayoutList, Search 
} from 'lucide-react';
import GAME_TYPE from '../../constants/GAME_TYPE';
import GAME_LABELS from '../../constants/GAME_LABELS';

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
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getGameConfig = (type) => {
    switch (type) {
      case GAME_TYPE.memory:
        return {
          label: GAME_LABELS.memory,
          badgeClass: 'bg-purple-100 text-purple-700',
          cardGradient: 'bg-gradient-to-br from-purple-500 to-indigo-600',
          Icon: Brain
        };
      case GAME_TYPE.hangman:
        return {
          label: GAME_LABELS.hangman,
          badgeClass: 'bg-orange-100 text-orange-700',
          cardGradient: 'bg-gradient-to-br from-orange-500 to-red-600',
          Icon: LayoutList
        };
      case GAME_TYPE.search:
        return {
          label: GAME_LABELS.search,
          badgeClass: 'bg-green-100 text-green-700',
          cardGradient: 'bg-gradient-to-br from-green-500 to-emerald-600',
          Icon: Search
        };
      case GAME_TYPE.anagram:
      default:
        return {
          label: GAME_LABELS.anagram,
          badgeClass: 'bg-blue-100 text-blue-700',
          cardGradient: 'bg-gradient-to-br from-blue-500 to-cyan-600',
          Icon: BarChart3
        };
    }
  };

  const renderCardStats = (exercise) => {
    if (exercise.type === GAME_TYPE.memory) {
      const stats = exercise.results.find(r => r.completed) || exercise.results[0] || {};
      return (
        <div className="flex justify-between items-end text-white">
          <div>
            <div className="text-2xl font-bold">{stats.moves || '?'}</div>
            <div className="text-xs opacity-80 uppercase font-bold">Coups</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{formatDuration(stats.duration)}</div>
            <div className="text-xs opacity-80 uppercase font-bold">Temps</div>
          </div>
        </div>
      );
    }

    return (
      <div className="text-white">
        <div className="text-3xl font-bold">{exercise.score}/{exercise.total}</div>
        <div className="text-sm opacity-90">
          {exercise.total > 0 ? Math.round((exercise.score / exercise.total) * 100) : 0}% de réussite
        </div>
      </div>
    );
  };

  const renderCardFooter = (exercise) => {
    if (exercise.type === GAME_TYPE.memory) {
      return `${exercise.words.length / 2} paires`;
    }
    return `${exercise.words.length} mots`;
  };

  const renderGenericDetailsList = (exercise) => {
    return (
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gray-600" />
          Détails des mots ({exercise.score}/{exercise.total})
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {exercise.results.map((result, idx) => (
            <div 
              key={idx} 
              className={`flex items-center justify-between p-3 rounded-lg border ${
                result.correct 
                  ? 'bg-green-50 border-green-200 shadow-sm' 
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div>
                <span className={`font-bold block ${result.correct ? 'text-gray-800' : 'text-red-700'}`}>
                  {result.word}
                </span>
                {/* Affiche la réponse utilisateur si c'est faux */}
                {!result.correct && result.userAnswer && (
                   <span className="text-xs text-gray-500">Réponse: {result.userAnswer}</span>
                )}
              </div>
              
              {result.correct ? (
                <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                  <span>OK</span>
                  <CheckCircle className="w-4 h-4" />
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600 text-sm font-medium">
                  <span>Raté</span>
                  <XCircle className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Vue Détail : Anagramme
  const renderAnagramDetails = (exercise) => (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex justify-between items-center">
        <div>
          <p className="text-blue-800 font-medium">Réussite globale</p>
          <p className="text-blue-700 text-sm mt-1 font-bold">
            {Math.round((exercise.score / exercise.total) * 100)}%
          </p>
        </div>
        <div className="text-right">
           <span className="text-3xl font-bold text-blue-600">{exercise.score}/{exercise.total}</span>
           <p className="text-xs text-blue-600 uppercase font-bold">Score</p>
        </div>
      </div>
      {renderGenericDetailsList(exercise)}
    </>
  );

  // Vue Détail : Recherche 
  const renderSearchDetails = (exercise) => (
    <>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex justify-between items-center">
        <div>
          <p className="text-green-800 font-medium">Réussite globale</p>
          <p className="text-green-700 text-sm mt-1 font-bold">
            {Math.round((exercise.score / exercise.total) * 100)}%
          </p>
        </div>
        <div className="text-right">
           <span className="text-3xl font-bold text-green-600">{exercise.score}/{exercise.total}</span>
           <p className="text-xs text-green-600 uppercase font-bold">Score</p>
        </div>
      </div>
      {renderGenericDetailsList(exercise)}
    </>
  );

  // Vue Détail : Memory
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

  // Vue Détail : Pendu
  const renderHangmanDetails = (exercise) => {
    const results = exercise.results || [];
    let durationLabel = "--:--";
    if (results.length > 0 && exercise.date) {
      const startTime = new Date(exercise.date).getTime();
      const lastAnswerTime = new Date(results[results.length - 1].timestamp).getTime();
      const durationSec = Math.floor((lastAnswerTime - startTime) / 1000);
      const mins = Math.floor(durationSec / 60);
      const secs = durationSec % 60;
      durationLabel = `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    const successRate = Math.round((exercise.score / exercise.total) * 100);

    return (
      <>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className={`border rounded-lg p-4 text-center ${successRate >= 50 ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
            <BarChart3 className={`w-8 h-8 mx-auto mb-2 ${successRate >= 50 ? 'text-green-600' : 'text-orange-600'}`} />
            <p className={`text-3xl font-bold ${successRate >= 50 ? 'text-green-700' : 'text-orange-700'}`}>{successRate}%</p>
            <p className={`text-sm font-medium uppercase ${successRate >= 50 ? 'text-green-800' : 'text-orange-800'}`}>Réussite</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-3xl font-bold text-blue-700">{durationLabel}</p>
            <p className="text-sm text-blue-800 font-medium uppercase">Durée estimée</p>
          </div>
        </div>
        {renderGenericDetailsList(exercise)}
      </>
    );
  };

  // --- VUE PRINCIPALE ---

  if (selectedExercise) {
    const config = getGameConfig(selectedExercise.type);
    const DetailIcon = config.Icon;

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
                <DetailIcon className="w-6 h-6 text-gray-700"/>
                Détails : {config.label}
              </h2>
              <p className="text-gray-500 text-sm">{formatDate(selectedExercise.date)}</p>
            </div>
          </div>

          {/* Router des détails */}
          {(() => {
            switch (selectedExercise.type) {
              case GAME_TYPE.memory: return renderMemoryDetails(selectedExercise);
              case GAME_TYPE.hangman: return renderHangmanDetails(selectedExercise);
              case GAME_TYPE.search: return renderSearchDetails(selectedExercise); // Ajout
              default: return renderAnagramDetails(selectedExercise);
            }
          })()}
        </div>
      </div>
    );
  }

  // Vue Grille
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
            const config = getGameConfig(exercise.type);

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
                        <span className={`${config.badgeClass} text-xs px-2 py-0.5 rounded uppercase font-bold`}>
                          {config.label}
                        </span>
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
                  <div className={`rounded-lg p-4 shadow-sm mb-4 ${config.cardGradient}`}>
                    {renderCardStats(exercise)}
                  </div>

                  {/* Footer Carte */}
                  <div className="text-sm text-gray-500 flex justify-between items-center">
                    <span>
                       {renderCardFooter(exercise)}
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