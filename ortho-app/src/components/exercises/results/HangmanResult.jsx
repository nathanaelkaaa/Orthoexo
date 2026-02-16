import { Trophy, Clock, Brain, AlertTriangle } from 'lucide-react';

const HangmanResult = ({ session, onReturnToStart }) => {
  const answers = session.patientAnswers || [];
  const totalQuestions = session.words.length;
  const correctCount = answers.filter(a => a.correct).length;

  let duration = 0;
  if (session.createdAt && answers.length > 0) {
    const startTime = new Date(session.createdAt);
    const lastAnswerTime = new Date(answers[answers.length - 1].timestamp);
    duration = Math.round((lastAnswerTime - startTime) / 1000);
  }
  
  const successRate = Math.round((correctCount / totalQuestions) * 100);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl animate-fade-in">
        
        <div className="text-center py-8">
          <div className="inline-block p-6 rounded-full bg-yellow-100 mb-6">
            <Trophy className="w-16 h-16 text-yellow-600" />
          </div>
          
          <h3 className="text-3xl font-bold text-gray-800 mb-2">Partie Terminée !</h3>
          <p className="text-gray-500 mb-8">Voici ton bilan pour le Pendu</p>
          
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
            {/* Carte Score */}
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
              <p className="text-purple-800 text-sm mb-1 uppercase font-bold tracking-wider">Mots Trouvés</p>
              <div className="text-3xl font-black text-purple-600 flex items-center justify-center gap-2">
                <Brain className="w-6 h-6" />
                {correctCount} / {totalQuestions}
              </div>
            </div>

            {/* Carte Temps */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-blue-800 text-sm mb-1 uppercase font-bold tracking-wider">Temps Total</p>
              <div className="text-3xl font-black text-blue-600 flex items-center justify-center gap-2">
                <Clock className="w-6 h-6" />
                {duration}s
              </div>
            </div>
          </div>

          <button
            onClick={onReturnToStart}
            className="px-8 py-4 bg-purple-600 text-white text-xl font-bold rounded-xl hover:bg-purple-700 transition transform hover:scale-105 shadow-lg shadow-purple-200"
          >
            Terminer l'exercice
          </button>
        </div>
      </div>
    </div>
  );
};

export default HangmanResult;