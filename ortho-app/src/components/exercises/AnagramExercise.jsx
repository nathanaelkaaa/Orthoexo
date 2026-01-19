import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowRight, Check, X } from 'lucide-react'; 
import { sendAnswer } from '../../services/firestoreService';

const AnagramExercise = ({ 
  session = null, 
  selectedWords = [], 
  isPatientMode = false,
  onBack,
  onFinish 
}) => {
  const [exercises, setExercises] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  
  // États de jeu
  const [questionFinished, setQuestionFinished] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  
  // Refs
  const finishTriggered = useRef(false);
  const hasLoaded = useRef(false);

  // Mélange
  const shuffleWord = useCallback((word) => {
    if (!word || word.length < 2) return word;
    const splitWord = word.split('');
    let shuffled = [...splitWord];
    let attempts = 0;
    do {
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      attempts++;
    } while (shuffled.join('') === word && attempts < 10);
    return shuffled.join('');
  }, []);

  // Initialisation
  useEffect(() => {
    if (hasLoaded.current) return;

    const initExercises = async () => {
      let wordsToUse = [];

      // Si mode patient, on utilise les mots de la session sinon mots sélectionnés (praticien)
      if (isPatientMode && session && session.words) {
        wordsToUse = session.words;
      } else if (!isPatientMode && selectedWords.length > 0) {
        wordsToUse = [...selectedWords]
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(10, selectedWords.length));
      }

      if (wordsToUse.length > 0) {
        const generated = wordsToUse.map(word => ({
          originalWord: word,
          scrambledWord: shuffleWord(word)
        }));
        
        hasLoaded.current = true;
        
        // Délai pour l'UX
        setTimeout(() => {
          setExercises(generated);
          setLoading(false);
        }, 500);
      }
    };

    initExercises();
  }, [isPatientMode, session, selectedWords, shuffleWord]);

  // Vérification réponse
  const checkAnswer = async () => {
    if (questionFinished) return; 

    const currentEx = exercises[currentIndex];
    const correct = userAnswer.toLowerCase().trim() === currentEx.originalWord.toLowerCase();
    
    setIsCorrect(correct);
    setQuestionFinished(true);
    
    // Envoi Firestore immédiat
    if (isPatientMode && session) {
      try {
        await sendAnswer(session.id, { 
          word: currentEx.originalWord, 
          userAnswer: userAnswer, 
          correct: correct, 
          timestamp: new Date().toISOString() 
        });
      } catch (error) {
        console.error("Erreur envoi réponse:", error);
      }
    }
  };

  // Exercise suivant ou Fin
  const nextExercise = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserAnswer('');
      setQuestionFinished(false);
    } else {
      if (finishTriggered.current) return;
      finishTriggered.current = true;
      onFinish(); 
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
        <h2 className="text-2xl font-bold mb-2">Préparation...</h2>
      </div>
    );
  }

  if (!exercises[currentIndex]) return <div className="text-center p-8">Erreur chargement</div>;

  const currentEx = exercises[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl">
        
        {/* Header Praticien uniquement */}
        {!isPatientMode && onBack && (
          <button onClick={onBack} className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800">
            <ArrowRight className="w-4 h-4 rotate-180" /> Quitter
          </button>
        )}

        {/* Barre progression */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Anagramme</h2>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
            {currentIndex + 1} / {exercises.length}
          </span>
        </div>

        {/* Mot Mélangé */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-10 mb-8 text-center shadow-inner">
          <p className="text-gray-500 mb-4 text-sm uppercase tracking-wide">Remets les lettres dans l'ordre</p>
          <p className="text-5xl font-black text-blue-600 tracking-[0.2em] uppercase drop-shadow-sm break-all">
            {currentEx.scrambledWord}
          </p>
        </div>

        {/* Zone de Jeu */}
        {!questionFinished ? (
          <div className="space-y-6">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && userAnswer && checkAnswer()}
              placeholder="Tapez votre réponse..."
              className="w-full text-center text-3xl px-6 py-4 border-b-4 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none bg-gray-50 transition uppercase"
              autoFocus
              autoComplete="off"
            />
            <button
              onClick={checkAnswer}
              disabled={!userAnswer.trim()}
              className="w-full py-4 bg-blue-600 text-white text-xl font-bold rounded-xl hover:bg-blue-700 transition transform active:scale-95 disabled:bg-gray-300 shadow-lg"
            >
              VALIDER
            </button>
          </div>
        ) : (
          /* Feedback */
          <div className="animate-fade-in">
            <div className={`p-6 rounded-xl mb-6 text-center border-2 ${
              isCorrect ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex justify-center mb-2">
                {isCorrect ? <Check className="w-12 h-12" /> : <X className="w-12 h-12" />}
              </div>
              <p className="text-2xl font-bold mb-2">{isCorrect ? 'Excellent !' : 'Oups...'}</p>
              {!isCorrect && (
                <p className="text-lg">Réponse : <span className="font-bold uppercase">{currentEx.originalWord}</span></p>
              )}
            </div>
            
            <button
              onClick={nextExercise}
              className={`w-full py-4 text-white text-xl font-bold rounded-xl transition transform active:scale-95 shadow-lg ${
                isCorrect ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
              autoFocus
            >
              {currentIndex < exercises.length - 1 ? 'Question Suivante →' : 'Terminer l\'exercice'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnagramExercise;