import { Trophy, Clock, Brain } from 'lucide-react';

const SearchResult = ({ session, onReturnToStart }) => {
  const answers = session.patientAnswers || [];
  const totalQuestions = session.words.length;
  const correctCount = answers.filter(a => a.correct).length;

  // Calcul de la durée 
  let duration = 0;
  if (session.createdAt && answers.length > 0) {
    const startTime = new Date(session.createdAt);
    const lastAnswerTime = new Date(answers[answers.length - 1].timestamp);
    duration = Math.round((lastAnswerTime - startTime) / 1000);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl animate-fade-in">
        
        <div className="text-center py-8">
          <div className="inline-block p-6 rounded-full bg-yellow-100 mb-6">
            <Trophy className="w-16 h-16 text-yellow-600" />
          </div>
          
          <h3 className="text-3xl font-bold text-gray-800 mb-2">Exercice Terminé !</h3>
          <p className="text-gray-500 mb-8">Voici tes résultats pour la Recherche</p>
          
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
            {/* Carte Score (Thème Vert comme l'exercice) */}
            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
              <p className="text-green-800 text-sm mb-1 uppercase font-bold tracking-wider">Score</p>
              <div className="text-3xl font-black text-green-600 flex items-center justify-center gap-2">
                <Brain className="w-6 h-6" />
                {correctCount} / {totalQuestions}
              </div>
            </div>

            {/* Carte Temps (Thème Bleu standard) */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-blue-800 text-sm mb-1 uppercase font-bold tracking-wider">Temps</p>
              <div className="text-3xl font-black text-blue-600 flex items-center justify-center gap-2">
                <Clock className="w-6 h-6" />
                {duration}s
              </div>
            </div>
          </div>

          <button
            onClick={onReturnToStart}
            className="px-8 py-4 bg-green-600 text-white text-xl font-bold rounded-xl hover:bg-green-700 transition transform hover:scale-105 shadow-lg shadow-green-200"
          >
            Terminer l'exercice
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchResult;