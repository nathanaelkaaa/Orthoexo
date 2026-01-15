import React, { useState, useEffect } from 'react';
import { ArrowRight, BarChart3, MessageSquare, User, BookOpen, Play } from 'lucide-react';
import { createSession, deleteSession, observeSessionById } from '../../services/firestoreService';
import { getWordsByLevel, getIrregularWords } from '../../services/manulexService';
import AnagramExercise from '../exercises/AnagramExercise';
import PractitionerMonitor from './PractitionerMonitor';

const WordSelectionView = ({ currentUser, category, onBack }) => {
  const [wordView, setWordView] = useState('selection');
  const [selectedWords, setSelectedWords] = useState([]);
  const [activeSession, setActiveSession] = useState(null);

  // Charger les mots sauvegardés
  useEffect(() => {
    const savedWords = localStorage.getItem('selectedWords');
    if (savedWords) {
      try {
        setSelectedWords(JSON.parse(savedWords));
      } catch (error) {
        console.error('Erreur chargement mots sauvegardés:', error);
      }
    }
  }, []);

  // Sauvegarder les mots sélectionnés
  useEffect(() => {
    if (selectedWords.length > 0) {
      localStorage.setItem('selectedWords', JSON.stringify(selectedWords));
    }
  }, [selectedWords]);

  const handleCreateExercise = () => {
    if (selectedWords.length < 3) {
      alert('Veuillez sélectionner au moins 3 mots pour créer un exercice');
      return;
    }
    setWordView('exerciseType');
  };

  const handleLaunchForPatient = async () => {
    if (selectedWords.length < 1) return alert("Sélectionnez des mots.");
    
    try {
      const sessionId = await createSession(currentUser.uid, 'anagram', selectedWords);
      setActiveSession({ 
        id: sessionId, 
        type: 'anagram', 
        words: selectedWords, 
        patientAnswers: [] 
      });
      setWordView('monitor');
    } catch (e) {
      console.error(e);
      alert("Erreur : " + e.message);
    }
  };

  const handleClearSelection = () => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer tous les mots sélectionnés ?')) {
      setSelectedWords([]);
      localStorage.removeItem('selectedWords');
    }
  };

  const saveExerciseToHistory = (type, words, results) => {
    const exercise = {
      id: Date.now(),
      type: type,
      words: words,
      results: results,
      date: new Date().toISOString(),
      score: results.filter(r => r.correct).length,
      total: results.length
    };

    const history = JSON.parse(localStorage.getItem('exerciseHistory') || '[]');
    history.unshift(exercise);
    
    if (history.length > 50) {
      history.splice(50);
    }
    
    localStorage.setItem('exerciseHistory', JSON.stringify(history));
  };

  if (wordView === 'monitor' && activeSession) {
    return (
      <div>
        <button 
          onClick={() => setWordView('selection')} 
          className="mb-6 flex items-center gap-2 text-gray-600"
        >
          <ArrowRight className="w-4 h-4 rotate-180" /> Retour
        </button>
        <PractitionerMonitor 
          sessionData={activeSession} 
          onFinish={() => setWordView('selection')}
          saveExerciseToHistory={saveExerciseToHistory}
        />
      </div>
    );
  }

  return (
    <div>
      <button 
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800"
      >
        <ArrowRight className="w-4 h-4 rotate-180" />
        Retour aux catégories
      </button>

      <h1 className="text-3xl font-bold mb-8">Gestion des Mots</h1>

      {wordView === 'selection' && (
        <WordSourceSelection 
          onSelectSource={(source) => setWordView(source)}
          selectedWords={selectedWords}
          onCreateExercise={handleCreateExercise}
          onClearSelection={handleClearSelection}
        />
      )}

      {wordView === 'frequency' && (
        <FrequencyWordList 
          onBack={() => setWordView('selection')}
          selectedWords={selectedWords}
          setSelectedWords={setSelectedWords}
        />
      )}

      {wordView === 'irregular' && (
        <IrregularWordList 
          onBack={() => setWordView('selection')}
          selectedWords={selectedWords}
          setSelectedWords={setSelectedWords}
        />
      )}

      {wordView === 'custom' && (
        <CustomWordList 
          onBack={() => setWordView('selection')}
          selectedWords={selectedWords}
          setSelectedWords={setSelectedWords}
        />
      )}

      {wordView === 'exerciseType' && (
        <ExerciseTypeSelection
          onBack={() => setWordView('selection')}
          selectedWords={selectedWords}
          onSelectType={(type) => setWordView('exercise-' + type)}
          onLaunchForPatient={handleLaunchForPatient}
        />
      )}

      {wordView === 'exercise-anagram' && (
        <AnagramExercise
          selectedWords={selectedWords}
          onBack={() => setWordView('exerciseType')}
          onFinish={(results) => {
            saveExerciseToHistory('anagram', selectedWords, results);
            setWordView('selection');
          }}
        />
      )}
    </div>
  );
};

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
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
          >
            Effacer
          </button>
        )}
        {selectedWords.length >= 3 && (
          <button
            onClick={onCreateExercise}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
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

// Frequency Word List
const FrequencyWordList = ({ onBack, selectedWords, setSelectedWords }) => {
  const [selectedLevel, setSelectedLevel] = useState('CP');
  const [searchTerm, setSearchTerm] = useState('');
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('frequency');
  const [sortedWords, setSortedWords] = useState([]);
  
  const levels = ['CP', 'CE1', 'CE2-CM2'];

  useEffect(() => {
    loadWords();
  }, [selectedLevel]);

  useEffect(() => {
    applySorting();
  }, [words, sortBy]);

  const loadWords = async () => {
    setLoading(true);
    try {
      const fetchedWords = await getWordsByLevel(selectedLevel);
      setWords(fetchedWords);
    } catch (error) {
      console.error('Erreur chargement mots:', error);
    }
    setLoading(false);
  };

  const applySorting = () => {
    const uniqueWords = words.reduce((acc, current) => {
      const exists = acc.find(item => item.word.toLowerCase() === current.word.toLowerCase());
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);
    
    let sorted = [...uniqueWords];
    
    switch(sortBy) {
      case 'alphabetical':
        sorted.sort((a, b) => a.word.localeCompare(b.word));
        break;
      case 'frequency':
        sorted.sort((a, b) => (b.frequency || 0) - (a.frequency || 0));
        break;
      case 'random':
        sorted.sort(() => Math.random() - 0.5);
        break;
      default:
        break;
    }
    
    setSortedWords(sorted);
  };

  const filteredWords = sortedWords.filter(wordData => 
    wordData.word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleWord = (word) => {
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter(w => w !== word));
    } else {
      setSelectedWords([...selectedWords, word]);
    }
  };

  return (
    <div>
      <button 
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800"
      >
        <ArrowRight className="w-4 h-4 rotate-180" />
        Retour
      </button>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Mots par fréquence et niveau scolaire</h2>
        <p className="text-gray-600 mb-4">
          Sélectionnez un niveau scolaire pour voir les mots les plus fréquents (source: Manulex)
        </p>
        
        <div className="flex gap-2 mb-6 flex-wrap">
          {levels.map(level => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedLevel === level 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        <div className="mb-4 flex gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un mot..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="frequency">Par fréquence</option>
            <option value="alphabetical">Alphabétique</option>
            <option value="random">Aléatoire</option>
          </select>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-blue-800 font-medium">
            {selectedWords.length} mot(s) sélectionné(s) au total • {filteredWords.length} mot(s) affiché(s)
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des mots...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto">
            {filteredWords.length > 0 ? (
              filteredWords.map((wordData, index) => (
                <button
                  key={index}
                  onClick={() => toggleWord(wordData.word)}
                  className={`p-3 rounded-lg border-2 transition ${
                    selectedWords.includes(wordData.word)
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-200 hover:border-blue-300 bg-white'
                  }`}
                >
                  {wordData.word}
                </button>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-400">
                {words.length === 0 
                  ? 'Aucun mot dans la base de données. Importez d\'abord les données Manulex.' 
                  : `Aucun mot trouvé pour "${searchTerm}"`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Irregular Word List
const IrregularWordList = ({ onBack, selectedWords, setSelectedWords }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    setLoading(true);
    try {
      const fetchedWords = await getIrregularWords();
      const uniqueWords = fetchedWords.reduce((acc, current) => {
        const exists = acc.find(item => item.word.toLowerCase() === current.word.toLowerCase());
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);
      setWords(uniqueWords);
    } catch (error) {
      console.error('Erreur chargement mots irréguliers:', error);
    }
    setLoading(false);
  };

  const filteredWords = words.filter(wordData => 
    wordData.word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleWord = (word) => {
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter(w => w !== word));
    } else {
      setSelectedWords([...selectedWords, word]);
    }
  };

  return (
    <div>
      <button 
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800"
      >
        <ArrowRight className="w-4 h-4 rotate-180" />
        Retour
      </button>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Mots irréguliers</h2>
        <p className="text-gray-600 mb-4">Mots avec orthographe particulière ou irrégulière</p>

        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un mot..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
          <p className="text-orange-800 font-medium">
            {selectedWords.length} mot(s) sélectionné(s) au total • {filteredWords.length} mot(s) affiché(s)
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des mots...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredWords.length > 0 ? (
              filteredWords.map((wordData, index) => (
                <button
                  key={index}
                  onClick={() => toggleWord(wordData.word)}
                  className={`p-3 rounded-lg border-2 transition ${
                    selectedWords.includes(wordData.word)
                      ? 'border-orange-600 bg-orange-50 text-orange-700 font-medium'
                      : 'border-gray-200 hover:border-orange-300 bg-white'
                  }`}
                >
                  {wordData.word}
                </button>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-400">
                {words.length === 0 
                  ? 'Aucun mot irrégulier dans la base de données.' 
                  : `Aucun mot trouvé pour "${searchTerm}"`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Custom Word List
const CustomWordList = ({ onBack, selectedWords, setSelectedWords }) => {
  const [newWord, setNewWord] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredWords = selectedWords.filter(word => 
    word.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addWord = () => {
    if (newWord.trim() && !selectedWords.includes(newWord.trim())) {
      setSelectedWords([...selectedWords, newWord.trim()]);
      setNewWord('');
    }
  };

  const removeWord = (word) => {
    setSelectedWords(selectedWords.filter(w => w !== word));
  };

  return (
    <div>
      <button 
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800"
      >
        <ArrowRight className="w-4 h-4 rotate-180" />
        Retour
      </button>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Sélection personnalisée</h2>
        <p className="text-gray-600 mb-6">Ajoutez vos propres mots pour créer une liste personnalisée</p>

        <div className="flex gap-3 mb-6">
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addWord()}
            placeholder="Entrez un mot..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={addWord}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
          >
            Ajouter
          </button>
        </div>

        {selectedWords.length > 0 && (
          <div className="mb-6">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher dans votre liste..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        )}

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <p className="text-purple-800 font-medium">
            {selectedWords.length} mot(s) dans votre liste
            {searchTerm && ` • ${filteredWords.length} mot(s) affiché(s)`}
          </p>
        </div>

        {selectedWords.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredWords.length > 0 ? (
              filteredWords.map((word, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border-2 border-purple-200 bg-purple-50 flex justify-between items-center"
                >
                  <span className="text-purple-700 font-medium">{word}</span>
                  <button
                    onClick={() => removeWord(word)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    ✕
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-400">
                Aucun mot trouvé pour "{searchTerm}"
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Aucun mot ajouté. Commencez par ajouter des mots ci-dessus.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Exercise Type Selection
const ExerciseTypeSelection = ({ onBack, selectedWords, onSelectType, onLaunchForPatient }) => (
  <div>
    <button 
      onClick={onBack}
      className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800"
    >
      <ArrowRight className="w-4 h-4 rotate-180" />
      Retour à la sélection
    </button>

    <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
      <h2 className="text-2xl font-bold mb-4">Choisissez le type d'exercice</h2>
      <p className="text-gray-600 mb-2">Nombre de mots sélectionnés : {selectedWords.length}</p>
      <p className="text-gray-500 text-sm">10 exercices seront générés aléatoirement parmi vos mots</p>
    </div>

    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition cursor-pointer group relative">
        <div onClick={() => onSelectType('anagram')}>
          <MessageSquare className="w-16 h-16 text-blue-600 mb-4 group-hover:scale-110 transition" />
          <h3 className="text-xl font-bold mb-2">Anagramme</h3>
          <p className="text-gray-600 text-sm mb-4">Retrouvez le mot correct à partir des lettres mélangées</p>
        </div>

        {/* Clic pour lancer au patient */}
            <button 
             onClick={(e) => {
                e.stopPropagation();
                if (onLaunchForPatient) {
                onLaunchForPatient();
                }
             }}
            className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 mt-2 font-bold"
            >
                <Play className="w-4 h-4" /> Lancer pour le patient
            </button>
       </div>
    </div>
  </div>
);
export default WordSelectionView;