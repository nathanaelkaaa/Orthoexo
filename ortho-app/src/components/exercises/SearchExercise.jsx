import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';
import { sendAnswer } from '../../services/firestoreService';

const SearchExercise = ({ 
  session = null, 
  selectedWords = [], 
  isPatientMode = false,
  onBack,
  onFinish 
}) => {
  const [exercises, setExercises] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // États de jeu
  const [questionFinished, setQuestionFinished] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [clickedWordIndex, setClickedWordIndex] = useState(null);
  
  const hasLoaded = useRef(false);

  // Liste de mots de remplissage classés par taille
  const FILLER_WORDS = {
    petit: [
      'le', 'la', 'un', 'je', 'tu', 'il', 'de', 'et', 'en', 'on',
      'ne', 'se', 'ce', 'me', 'te', 'du', 'au', 'ou', 'si', 'sa',
      'ma', 'ta', 'ca', 'pa', 'va', 'as', 'es', 'os', 'us', 'vu',
      'lu', 'mu', 'bu', 'eu', 'su', 'pu', 'ai', 'eh', 'oh', 'ha'
    ],
    moyen: [
      'avec', 'pour', 'dans', 'sans', 'vous', 'nous', 'leur', 'tout',
      'bien', 'plus', 'sans', 'sous', 'donc', 'puis', 'mais', 'chez',
      'vers', 'elle', 'être', 'avoir', 'faire', 'dire', 'aller', 'voir',
      'savoir', 'venir', 'vouloir', 'devoir', 'falloir', 'tenir', 'mettre',
      'porter', 'donner', 'passer', 'lever', 'partir', 'servir', 'sentir',
      'dormir', 'suivre', 'vivre', 'écrire', 'lire', 'croire', 'boire',
      'manger', 'chanter', 'danser', 'marcher', 'courir', 'sauter', 'tomber'
    ],
    long: [
      'respectueusement', 'extraordinaire', 'merveilleusement', 'formidablement',
      'considérablement', 'particulièrement', 'généralement', 'absolument',
      'complètement', 'totalement', 'entièrement', 'parfaitement', 'vraiment',
      'certainement', 'probablement', 'évidemment', 'naturellement', 'heureusement',
      'malheureusement', 'difficilement', 'facilement', 'rapidement', 'lentement',
      'simplement', 'uniquement', 'seulement', 'notamment', 'également',
      'principalement', 'essentiellement', 'effectivement', 'actuellement',
      'récemment', 'précédemment', 'anciennement', 'nouvellement', 'dernièrement'
    ]
  };

  // Palette de couleurs variées
  const colors = [
    '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', 
    '#9B59B6', '#1ABC9C', '#E67E22', '#34495E',
    '#C0392B', '#16A085', '#D35400', '#8E44AD',
    '#27AE60', '#2980B9', '#F1C40F', '#95A5A6'
  ];

  // Polices variées
  const fonts = [
    'Arial, sans-serif',
    'Georgia, serif',
    'Verdana, sans-serif',
    'Tahoma, sans-serif',
    'Times New Roman, serif',
    'Courier New, monospace'
  ];

  // Générer un style visuel aléatoire pour un mot
  const generateWordStyle = useCallback(() => {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const fontFamily = fonts[Math.floor(Math.random() * fonts.length)];
    const fontWeight = Math.random() > 0.5 ? 700 : Math.random() > 0.5 ? 600 : 400;
    
    return {
      color: color,
      fontWeight: fontWeight,
      fontFamily: fontFamily
    };
  }, []);

  // Détermine la catégorie de taille appropriée pour un rectangle
  const getWordCategoryForRectangle = useCallback((width, height) => {
    const ratio = width / height;
    const area = width * height;
    
    if (ratio > 3 || ratio < 0.33) {
      return 'long';
    }
    else if (ratio >= 0.5 && ratio <= 2 && area > 3000) {
      return 'moyen';
    }
    else if (area < 3000) {
      return 'petit';
    }
    else {
      return 'moyen';
    }
  }, []);

  // Sélectionne un mot aléatoire dans une catégorie
  const getRandomWordFromCategory = useCallback((category, usedWords = []) => {
    const availableWords = FILLER_WORDS[category].filter(w => !usedWords.includes(w));
    if (availableWords.length === 0) {
      return FILLER_WORDS[category][Math.floor(Math.random() * FILLER_WORDS[category].length)];
    }
    return availableWords[Math.floor(Math.random() * availableWords.length)];
  }, []);

  // Crée une grille de base puis fusionne TOUTES les cellules pour créer des rectangles
  const createGridBasedRectangles = useCallback((gridCols = 15, gridRows = 10, containerWidth = 900, containerHeight = 500) => {
    const cellWidth = containerWidth / gridCols;
    const cellHeight = containerHeight / gridRows;

    const grid = Array(gridRows).fill(null).map(() => 
      Array(gridCols).fill(null).map(() => ({ merged: false, rectangleId: null }))
    );
    
    const rectangles = [];
    let rectangleIdCounter = 0;

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {

        if (grid[row][col].merged) continue;

        const isHorizontal = Math.random() > 0.5;
        let maxWidth, maxHeight;
        
        if (isHorizontal) {
          maxWidth = Math.min(gridCols - col, Math.floor(Math.random() * 5) + 3);
          maxHeight = Math.min(gridRows - row, Math.floor(Math.random() * 2) + 1);
        } else {
          maxWidth = Math.min(gridCols - col, Math.floor(Math.random() * 2) + 1);
          maxHeight = Math.min(gridRows - row, Math.floor(Math.random() * 4) + 3);
        }
        
        let rectWidth = 1;
        let rectHeight = 1;
        
        for (let w = 1; w <= maxWidth; w++) {
          let canExtend = true;
          for (let h = 0; h < rectHeight; h++) {
            if (col + w > gridCols || (col + w - 1 < gridCols && row + h < gridRows && grid[row + h][col + w - 1].merged)) {
              canExtend = false;
              break;
            }
          }
          if (canExtend && col + w <= gridCols) rectWidth = w;
          else break;
        }
        
        for (let h = 1; h <= maxHeight; h++) {
          let canExtend = true;
          for (let w = 0; w < rectWidth; w++) {
            if (row + h > gridRows || (row + h - 1 < gridRows && col + w < gridCols && grid[row + h - 1][col + w].merged)) {
              canExtend = false;
              break;
            }
          }
          if (canExtend && row + h <= gridRows) rectHeight = h;
          else break;
        }
        
        for (let r = 0; r < rectHeight; r++) {
          for (let c = 0; c < rectWidth; c++) {
            if (row + r < gridRows && col + c < gridCols) {
              grid[row + r][col + c].merged = true;
              grid[row + r][col + c].rectangleId = rectangleIdCounter;
            }
          }
        }
        
        const rectWidthPx = rectWidth * cellWidth;
        const rectHeightPx = rectHeight * cellHeight;
        
        rectangles.push({
          x: col * cellWidth,
          y: row * cellHeight,
          width: rectWidthPx,
          height: rectHeightPx,
          id: rectangleIdCounter,
          needsRotation: rectHeightPx > rectWidthPx 
        });
        
        rectangleIdCounter++;
      }
    }
    
    console.log('Rectangles générés:', rectangles.length);
    return rectangles;
  }, []);

  // Mélanger
  const shuffleArray = useCallback((array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // Créer le nuage de mots avec grille fusionnée
  const createWordCloud = useCallback((targetWord, containerWidth = 900, containerHeight = 500) => {
    let boxes = createGridBasedRectangles(15, 10, containerWidth, containerHeight);
    boxes = shuffleArray(boxes);
    const usedWords = [targetWord];

    const wordCloud = boxes.map((box, index) => {
      const style = generateWordStyle();
      const category = getWordCategoryForRectangle(box.width, box.height);
      let word;
      if (index === 0) {
        word = targetWord;
      } else {
        word = getRandomWordFromCategory(category, usedWords);
        usedWords.push(word);
      }
      
      return {
        text: word,
        id: box.id + '_' + Math.random().toString(36).substr(2, 9),
        style: style,
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        needsRotation: box.needsRotation
      };
    });
    
    return shuffleArray(wordCloud);
  }, [createGridBasedRectangles, shuffleArray, generateWordStyle, getWordCategoryForRectangle, getRandomWordFromCategory]);

  // Initialisation
  useEffect(() => {
    if (hasLoaded.current) return;

    const initExercises = async () => {
      let wordsToUse = [];

      if (isPatientMode && session && session.words) {
        wordsToUse = session.words;
      } else if (!isPatientMode && selectedWords.length > 0) {
        const shuffled = [...selectedWords].sort(() => Math.random() - 0.5);
        wordsToUse = shuffled.slice(0, Math.min(10, selectedWords.length));
      }

      if (wordsToUse.length > 0) {
        const generated = wordsToUse.map(targetWord => {
          const cloud = createWordCloud(targetWord);
          return {
            correctWord: targetWord,
            cloud: cloud
          };
        });
        
        hasLoaded.current = true;
        
        setTimeout(() => {
          setExercises(generated);
          setLoading(false);
        }, 500);
      }
    };

    initExercises();
  }, [isPatientMode, session, selectedWords, createWordCloud]);

  // Vérification réponse
  const checkAnswer = async (chosenWordObj, indexInCloud) => {
    if (questionFinished) return;

    const currentEx = exercises[currentIndex];
    const correct = chosenWordObj.text.toLowerCase() === currentEx.correctWord.toLowerCase();
    
    setClickedWordIndex(indexInCloud);
    setIsCorrect(correct);
    setQuestionFinished(true);
    
    if (isPatientMode && session) {
      try {
        await sendAnswer(session.id, { 
          word: currentEx.correctWord, 
          userAnswer: chosenWordObj.text, 
          correct: correct, 
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
      setClickedWordIndex(null);
      setQuestionFinished(false);
    } else {
      onFinish();
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
        <h2 className="text-2xl font-bold mb-2">Génération du nuage...</h2>
      </div>
    );
  }

  if (!exercises[currentIndex]) return <div className="text-center p-8">Erreur chargement</div>;

  const currentEx = exercises[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* Header */}
      {!isPatientMode && onBack && (
        <div className="p-4 bg-white shadow-sm">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
            <ArrowRight className="w-4 h-4 rotate-180" /> Quitter
          </button>
        </div>
      )}

      {/* ZONE NUAGE */}
      <div className="flex-1 overflow-hidden relative p-8 flex items-center justify-center">
        <div 
          className="relative bg-white rounded-2xl shadow-xl overflow-hidden"
          style={{ width: '900px', height: '500px' }}
        >
          {currentEx.cloud.map((item, idx) => {
            let opacity = 1;
            let highlightStyle = {};
            
            if (questionFinished) {
              const isCorrectWord = item.text.toLowerCase() === currentEx.correctWord.toLowerCase();
              const isClickedWord = idx === clickedWordIndex;
              
              if (isCorrectWord) {
                highlightStyle = { backgroundColor: '#dcfce7', borderColor: '#22c55e', borderWidth: '3px', zIndex: 100, boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)' };
              } else if (isClickedWord && !isCorrect) {
                highlightStyle = { backgroundColor: '#fee2e2', borderColor: '#ef4444', borderWidth: '3px', zIndex: 90 };
              } else {
                opacity = 0.2;
              }
            }

            const baseFontSize = 20; 
            const estimatedTextWidth = item.text.length * baseFontSize * 0.6;
            const estimatedTextHeight = baseFontSize;
            const targetWidth = item.needsRotation ? item.height : item.width;
            const targetHeight = item.needsRotation ? item.width : item.height;
            const scaleX = (targetWidth / estimatedTextWidth) * 0.90; 
            const scaleY = (targetHeight / estimatedTextHeight) * 0.85;

            return (
              <button
                key={item.id}
                onClick={() => checkAnswer(item, idx)}
                disabled={questionFinished}
                className="absolute transition-all duration-200 cursor-pointer select-none overflow-hidden hover:brightness-95 active:scale-95"
                style={{
                  left: `${item.x}px`,
                  top: `${item.y}px`,
                  width: `${item.width}px`,
                  height: `${item.height}px`,
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  opacity: opacity,
                  ...highlightStyle
                }}
              >
                <span
                  style={{
                    display: 'block',
                    color: item.style.color,
                    fontFamily: item.style.fontFamily,
                    fontSize: `${baseFontSize}px`,
                    fontWeight: 'bold',
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    transform: item.needsRotation 
                      ? `rotate(90deg) scale(${scaleX}, ${scaleY})` 
                      : `scale(${scaleX}, ${scaleY})`,
                    
                    transformOrigin: 'center center',
                    width: 'auto',
                    height: 'auto'
                  }}
                >
                  {item.text}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FOOTER */}
      <div className="bg-white border-t-4 border-blue-500 p-4 shadow-lg z-20">
        <div className="container mx-auto max-w-4xl flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Info Progression */}
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm font-bold">
            Mot {currentIndex + 1} / {exercises.length}
          </div>

          {/* Le mot à trouver ou feedback */}
          <div className="flex-1 w-full md:w-auto text-center">
            {questionFinished ? (
              <div className={`text-2xl font-bold flex items-center justify-center gap-3 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                {isCorrect ? (
                  <>
                    <Check className="w-10 h-10" /> Excellent !
                  </>
                ) : (
                  <>
                    <X className="w-10 h-10" /> Dommage...
                  </>
                )}
              </div>
            ) : (
              <div className="bg-white border-4 border-black rounded-xl py-4 px-10 shadow-md inline-block">
                <span className="text-3xl font-bold text-black">{currentEx.correctWord}</span>
              </div>
            )}
          </div>

          {/* Bouton Suivant */}
          <div className="w-full md:w-auto flex justify-end">
            {questionFinished && (
              <button
                onClick={nextExercise}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg"
              >
                {currentIndex < exercises.length - 1 ? 'Suivant' : 'Terminer'} <ArrowRight className="w-5 h-5" />
              </button>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchExercise;