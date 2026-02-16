import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Check, X } from 'lucide-react'; 
import { sendAnswer } from '../../services/firestoreService';

const HangmanExercise = ({ 
  session = null, 
  selectedWords = [], 
  isPatientMode = false,
  onBack,
  onFinish 
}) => {
  const [exercises, setExercises] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [guessedLetters, setGuessedLetters] = useState(new Set());
  const [wrongCount, setWrongCount] = useState(0);

  const MAX_ERRORS = 8; 

  const [questionFinished, setQuestionFinished] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const finishTriggered = useRef(false);
  const hasLoaded = useRef(false);

  const normalize = (char) => {
    return char.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  };

  useEffect(() => {
    if (hasLoaded.current) return;

    const initExercises = async () => {
      let wordsToUse = [];

      if (isPatientMode && session && session.words) {
        wordsToUse = session.words;
      } else if (!isPatientMode && selectedWords.length > 0) {
        wordsToUse = [...selectedWords]
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(10, selectedWords.length));
      }

      if (wordsToUse.length > 0) {
        const generated = wordsToUse.map(word => ({
          originalWord: word.toUpperCase(),
          cleanWord: normalize(word)
        }));
        
        hasLoaded.current = true;
        
        setTimeout(() => {
          setExercises(generated);
          setLoading(false);
        }, 500);
      }
    };

    initExercises();
  }, [isPatientMode, session, selectedWords]);

  const handleGuess = (letter) => {
    if (questionFinished || guessedLetters.has(letter)) return;

    const currentEx = exercises[currentIndex];
    const newGuessed = new Set(guessedLetters);
    newGuessed.add(letter);
    setGuessedLetters(newGuessed);

    if (!currentEx.cleanWord.includes(letter)) {
      const newWrongCount = wrongCount + 1;
      setWrongCount(newWrongCount);
      
      if (newWrongCount >= MAX_ERRORS) {
        finalizeRound(false);
      }
    } else {
      const isWon = currentEx.cleanWord.split('').every(char => newGuessed.has(char));
      if (isWon) {
        finalizeRound(true);
      }
    }
  };

  const finalizeRound = async (success) => {
    setIsCorrect(success);
    setQuestionFinished(true);

    const currentEx = exercises[currentIndex];

    if (isPatientMode && session) {
      try {
        await sendAnswer(session.id, { 
          word: currentEx.originalWord, 
          userAnswer: success ? currentEx.originalWord : "Non trouvé",
          correct: success, 
          timestamp: new Date().toISOString() 
        });
      } catch (error) {
        console.error("Erreur envoi réponse:", error);
      }
    }
  };

  const nextExercise = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setGuessedLetters(new Set());
      setWrongCount(0);
      setQuestionFinished(false);
    } else {
      if (finishTriggered.current) return;
      finishTriggered.current = true;
      onFinish(); 
    }
  };

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const renderHangman = () => {
    const parts = [
      <line key="base" x1="10" y1="95" x2="90" y2="95" stroke="black" strokeWidth="4" />, // 0: Base
      <line key="pole" x1="50" y1="95" x2="50" y2="10" stroke="black" strokeWidth="4" />, // 1: Poteau
      <line key="top" x1="50" y1="10" x2="110" y2="10" stroke="black" strokeWidth="4" />, // 2: Haut
      <line key="rope" x1="110" y1="10" x2="110" y2="30" stroke="black" strokeWidth="2" />, // 3: Corde
      <circle key="head" cx="110" cy="40" r="10" stroke="black" strokeWidth="2" fill="none" />, // 4: Tête
      <line key="body" x1="110" y1="50" x2="110" y2="75" stroke="black" strokeWidth="2" />, // 5: Corps
      <line key="arms" x1="95" y1="60" x2="125" y2="60" stroke="black" strokeWidth="2" />, // 6: Bras
      <line key="leg-l" x1="110" y1="75" x2="95" y2="95" stroke="black" strokeWidth="2" />, // 7: Jambe Gauche
      <line key="leg-r" x1="110" y1="75" x2="125" y2="95" stroke="black" strokeWidth="2" /> // 8: Jambe Droite
    ];

    return (
      <svg viewBox="0 0 140 110" className="w-full h-full">
        {parts.slice(0, wrongCount + 1)} 
      </svg>
    );
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
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-4xl flex flex-col md:flex-row gap-8">
        
        {/* Colonne Gauche */}
        <div className="w-full md:w-1/3 flex flex-col">
          {!isPatientMode && onBack && (
            <button onClick={onBack} className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800 self-start">
              <ArrowRight className="w-4 h-4 rotate-180" /> Quitter
            </button>
          )}
          
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Le Pendu</h2>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
              {currentIndex + 1} / {exercises.length}
            </span>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex-1 flex items-center justify-center min-h-[200px]">
            <div className="w-48 h-48">
              {renderHangman()}
            </div>
          </div>
        </div>

        {/* Colonne Droite */}
        <div className="w-full md:w-2/3 flex flex-col justify-between">
          
          {/* Mot à deviner */}
          <div className="mb-8 text-center mt-8 md:mt-0">
            <div className="flex flex-wrap justify-center gap-2">
              {currentEx.originalWord.split('').map((char, idx) => {
                const cleanChar = normalize(char);
                const isFound = guessedLetters.has(cleanChar) || questionFinished;
                const colorClass = questionFinished && !isCorrect && !guessedLetters.has(cleanChar) 
                  ? "text-red-500" 
                  : "text-gray-800";

                return (
                  <div key={idx} className="flex flex-col items-center gap-1 w-10">
                    <span className={`text-3xl font-black ${colorClass}`}>
                      {isFound ? char : ""}
                    </span>
                    <div className="w-full h-1 bg-gray-800 rounded"></div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clavier */}
          {!questionFinished ? (
            <div className="grid grid-cols-7 gap-2">
              {alphabet.map((letter) => {
                const status = guessedLetters.has(letter) 
                  ? (currentEx.cleanWord.includes(letter) ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-400 border-gray-200')
                  : 'bg-white hover:bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-400 shadow-sm';
                
                return (
                  <button
                    key={letter}
                    onClick={() => handleGuess(letter)}
                    disabled={guessedLetters.has(letter)}
                    className={`h-12 rounded-lg font-bold text-lg border-2 transition ${status}`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className={`p-6 rounded-xl mb-6 text-center border-2 ${
                isCorrect ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex justify-center mb-2">
                  {isCorrect ? <Check className="w-12 h-12" /> : <X className="w-12 h-12" />}
                </div>
                <p className="text-2xl font-bold mb-2">{isCorrect ? 'Bravo !' : 'Pendu !'}</p>
                {!isCorrect && (
                  <p className="text-lg">Le mot était : <span className="font-bold uppercase">{currentEx.originalWord}</span></p>
                )}
              </div>
              
              <button
                onClick={nextExercise}
                className={`w-full py-4 text-white text-xl font-bold rounded-xl transition transform active:scale-95 shadow-lg ${
                  isCorrect ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
                autoFocus
              >
                {currentIndex < exercises.length - 1 ? 'Mot Suivant →' : 'Terminer l\'exercice'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HangmanExercise;