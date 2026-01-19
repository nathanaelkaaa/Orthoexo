import { Trophy, Clock, RefreshCw } from 'lucide-react';

const MemoryResult = ({ session, onReturnToStart }) => {
  const answers = session.patientAnswers || [];
  
  // Objet stats finale
  const finalStats = answers.find(a => a.completed === true) || { moves: 0, duration: 0 };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl animate-fade-in">
        
        <div className="text-center py-8">
          <div className="inline-block p-6 rounded-full bg-yellow-100 mb-6">
            <Trophy className="w-16 h-16 text-yellow-600" />
          </div>
          
          <h3 className="text-3xl font-bold text-gray-800 mb-2">Exercice Terminé !</h3>
          <p className="text-gray-500 mb-8">Bravo, tu as trouvé toutes les paires.</p>
          
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
            {/* Carte Coups */}
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
              <p className="text-purple-800 text-sm mb-1 uppercase font-bold tracking-wider">Coups</p>
              <div className="text-3xl font-black text-purple-600 flex items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6" />
                {finalStats.moves}
              </div>
            </div>

            {/* Carte Temps */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-blue-800 text-sm mb-1 uppercase font-bold tracking-wider">Temps</p>
              <div className="text-3xl font-black text-blue-600 flex items-center justify-center gap-2">
                <Clock className="w-6 h-6" />
                {finalStats.duration}s
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

export default MemoryResult;