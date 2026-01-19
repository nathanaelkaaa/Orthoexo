import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, RefreshCw, Trophy } from 'lucide-react';
import { sendAnswer } from '../../services/firestoreService';

const MemoryExercise = ({ 
  session = null, 
  selectedWords = [], 
  isPatientMode = false,
  onBack,
  onFinish 
}) => {
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [startTime, setStartTime] = useState(null);
  
  // Refs pour la sécurité
  const gameInitialized = useRef(false);
  const finishTriggered = useRef(false);

  const PAIRS_COUNT = 6;

  useEffect(() => {
    if (gameInitialized.current) return;

    let wordsToUse = [];
    if (isPatientMode && session && session.words) {
      wordsToUse = session.words;
    } else {
      wordsToUse = selectedWords;
    }

    if (!wordsToUse || wordsToUse.length === 0) return;

    gameInitialized.current = true;

    const shuffleArray = (array) => {
      const newArray = [...array];
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
      }
      return newArray;
    };

    const sliceWords = wordsToUse
      .sort(() => Math.random() - 0.5)
      .slice(0, PAIRS_COUNT);

    const memoryCards = [...sliceWords, ...sliceWords].map((word, index) => ({
      id: index,
      word: word,
      isFlipped: false,
      isMatched: false
    }));

    setCards(shuffleArray(memoryCards));
    setStartTime(new Date());
    setLoading(false);

  }, [isPatientMode, session, selectedWords]);


  const handleCardClick = (index) => {
    // Si finishTriggered est true, on bloque toute interaction
    if (finishTriggered.current || isLocked || cards[index].isMatched || flippedCards.includes(index)) {
      return;
    }

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      checkForMatch(newFlipped, newCards);
    }
  };

  const checkForMatch = (currentFlipped, currentCards) => {
    setIsLocked(true);
    const [firstIndex, secondIndex] = currentFlipped;
    const card1 = currentCards[firstIndex];
    const card2 = currentCards[secondIndex];

    if (card1.word === card2.word) {
      const updatedCards = [...currentCards];
      updatedCards[firstIndex].isMatched = true;
      updatedCards[secondIndex].isMatched = true;
      
      setCards(updatedCards);
      setMatchedPairs(prev => [...prev, card1.word]);
      setFlippedCards([]);
      setIsLocked(false);

      const allMatched = updatedCards.every(c => c.isMatched);
      if (allMatched) {
        // Ajout de +1 car le state moves n'est pas encore mis à jour dans ce cycle
        handleGameEnd(moves + 1);
      }
    } else {
      setTimeout(() => {
        if (!gameInitialized.current) return; 

        const resetCards = [...currentCards];
        resetCards[firstIndex].isFlipped = false;
        resetCards[secondIndex].isFlipped = false;
        
        setCards(resetCards);
        setFlippedCards([]);
        setIsLocked(false);
      }, 1000);
    }
  };

  const handleGameEnd = async (finalMoves) => {
    if (finishTriggered.current) return;
    finishTriggered.current = true; // Verrouillage immédiat

    const endTime = new Date();
    const duration = startTime ? Math.round((endTime - startTime) / 1000) : 0;

    if (isPatientMode && session) {
      try {
        // On envoie les stats finales
        await sendAnswer(session.id, { 
          gameType: 'memory',
          completed: true, // Marqueur important pour MemoryResult
          moves: finalMoves,
          duration: duration,
          timestamp: new Date().toISOString() 
        });
        
        console.log("Memory terminé, verrouillage de la session...");
        // On déclenche la fermeture sécurisée
        onFinish(); 
      } catch (error) {
        console.error("Erreur envoi réponse:", error);
      }
    } else {
      // Mode Test Praticien
      onFinish();
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-6"></div>
        <h2 className="text-2xl font-bold mb-2">Préparation du jeu...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-4xl">
        
        {/* Header avec bouton quitter (Praticien ou avant la fin) */}
        {!isPatientMode && onBack && (
          <button 
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Quitter l'exercice
          </button>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Memory</h2>
            <p className="text-gray-500 text-sm">Trouvez les paires de mots identiques</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-purple-50 text-purple-800 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              {moves} Coups
            </div>
            <div className="bg-green-50 text-green-800 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              {matchedPairs.length} / {PAIRS_COUNT}
            </div>
          </div>
        </div>

        {/* Grille de Memory */}
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4 auto-rows-fr">
          {cards.map((card, index) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(index)}
              className={`
                aspect-[4/3] rounded-xl flex items-center justify-center text-center cursor-pointer transition-all duration-500 transform perspective-1000 shadow-sm hover:shadow-md
                ${card.isFlipped || card.isMatched 
                  ? 'bg-white border-2 border-purple-600 rotate-y-180' 
                  : 'bg-purple-600 border-2 border-purple-700 hover:bg-purple-700'}
                ${card.isMatched ? 'opacity-50 ring-2 ring-green-400 border-green-400' : ''}
              `}
            >
              <div className="p-2 w-full h-full flex items-center justify-center">
                {card.isFlipped || card.isMatched ? (
                  <span className="text-lg md:text-xl font-bold text-purple-900 select-none break-all">
                    {card.word}
                  </span>
                ) : (
                  <div className="w-8 h-8 md:w-12 md:h-12 border-2 border-white/30 rounded-full flex items-center justify-center">
                    <span className="text-white/50 font-bold text-xl">?</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default MemoryExercise;