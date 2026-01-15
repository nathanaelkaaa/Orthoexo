import React, { useState, useEffect } from 'react';
import { User, Brain, ArrowRight, MessageSquare, Users, BarChart3, BookOpen, LogOut, Upload, Play, Check, X } from 'lucide-react';
import { registerUser, loginUser, logoutUser, observeAuthState } from './services/authService';
import { addPractitioner, createSession, listenForActiveSession, sendAnswer, updateSessionStatus, observeSessionById, clearUserSessions,deleteSession  } from './services/firestoreService';
import { getWordsByLevel, getIrregularWords, searchWordsInFirestore } from './services/manulexService';

const OrthoApp = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [userType, setUserType] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Observer l'état de connexion
  useEffect(() => {
    const unsubscribe = observeAuthState((user) => {
      setCurrentUser(user);
      setLoading(false);
      if (user && currentPage === 'login') {
        setCurrentPage('home');
      }
    });

    return () => unsubscribe();
  }, []);

  // Landing Page
  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Brain className="w-8 h-8 text-blue-600" />
          <span className="text-2xl font-bold text-gray-800">OrthoExercice</span>
        </div>
        <button 
          onClick={() => setCurrentPage('login')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Connexion
        </button>
      </header>

      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Révolutionnez vos séances d'orthophonie
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Créez des exercices personnalisés en quelques clics et suivez la progression de vos patients en temps réel
        </p>
        <button 
          onClick={() => setCurrentPage('login')}
          className="px-8 py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
        >
          Commencer maintenant <ArrowRight className="w-5 h-5" />
        </button>
      </section>

      <section className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition">
            <MessageSquare className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold mb-3">Exercices Personnalisés</h3>
            <p className="text-gray-600">Générez automatiquement des exercices adaptés à chaque patient selon vos critères</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition">
            <BarChart3 className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-bold mb-3">Suivi en Temps Réel</h3>
            <p className="text-gray-600">Visualisez la progression et les performances de vos patients instantanément</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition">
            <BookOpen className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-xl font-bold mb-3">Interface Tactile</h3>
            <p className="text-gray-600">Une expérience optimisée pour tablette, simple et intuitive pour les patients</p>
          </div>
        </div>
      </section>
    </div>
  );

  // Login/Register Page
  const LoginPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: ''
    });
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
      setFormError('');
      setIsSubmitting(true);

      try {
        if (isLogin) {
          // Connexion
          const user = await loginUser(formData.email, formData.password);
          console.log('Utilisateur connecté:', user);
          setCurrentPage('home');
        } else {
          // Inscription
          const user = await registerUser(formData.email, formData.password);
          
          // Créer le profil praticien dans Firestore
          await addPractitioner({
            uid: user.uid,
            name: formData.name,
            email: formData.email,
            patients: []
          });
          
          console.log('Utilisateur créé:', user);
          setCurrentPage('home');
        }
      } catch (err) {
        console.error('Erreur:', err);
        
        // Messages d'erreur en français
        switch (err.code) {
          case 'auth/email-already-in-use':
            setFormError('Cet email est déjà utilisé');
            break;
          case 'auth/invalid-email':
            setFormError('Email invalide');
            break;
          case 'auth/weak-password':
            setFormError('Le mot de passe doit contenir au moins 6 caractères');
            break;
          case 'auth/user-not-found':
            setFormError('Aucun compte trouvé avec cet email');
            break;
          case 'auth/wrong-password':
            setFormError('Mot de passe incorrect');
            break;
          case 'auth/invalid-credential':
            setFormError('Email ou mot de passe incorrect');
            break;
          default:
            setFormError('Une erreur est survenue. Veuillez réessayer.');
        }
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-6">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-center mb-8">
            <Brain className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-center mb-8">
            {isLogin ? 'Connexion' : 'Créer un compte'}
          </h2>
          
          {formError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {formError}
            </div>
          )}

          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2">Nom complet</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Jean Dupont"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="exemple@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Mot de passe</label>
              <input 
                type="password" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Chargement...' : (isLogin ? 'Se connecter' : "S'inscrire")}
            </button>
          </div>

          <div className="mt-6 text-center">
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setFormError('');
              }}
              className="text-blue-600 hover:underline"
            >
              {isLogin ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
            </button>
          </div>

          <button 
            onClick={() => setCurrentPage('landing')}
            className="mt-4 text-gray-500 hover:text-gray-700 text-sm w-full"
          >
            ← Retour
          </button>
        </div>
      </div>
    );
  };

  // Home Page - User Type Selection
  const HomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Brain className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold">OrthoExercice</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">{currentUser?.email}</span>
          <button 
            onClick={async () => {
              await logoutUser();
              setCurrentPage('landing');
              setUserType(null);
            }}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center px-6" style={{minHeight: 'calc(100vh - 100px)'}}>
        <div className="max-w-4xl w-full">
          <h1 className="text-4xl font-bold text-center mb-12">Choisissez votre profil</h1>
          <div className="grid md:grid-cols-2 gap-8">
            <div 
              onClick={() => {
                setUserType('praticien');
                setCurrentPage('praticien');
              }}
              className="bg-white p-10 rounded-2xl shadow-xl hover:shadow-2xl transition cursor-pointer group"
            >
              <User className="w-16 h-16 text-blue-600 mb-6 mx-auto group-hover:scale-110 transition" />
              <h2 className="text-2xl font-bold text-center mb-4">Praticien</h2>
              <p className="text-gray-600 text-center mb-6">
                Créez des exercices, suivez vos patients et analysez leur progression
              </p>
              <div className="flex justify-center">
                <ArrowRight className="w-6 h-6 text-blue-600 group-hover:translate-x-2 transition" />
              </div>
            </div>

            <div 
              onClick={() => {
                setUserType('patient');
                setCurrentPage('patient');
              }}
              className="bg-white p-10 rounded-2xl shadow-xl hover:shadow-2xl transition cursor-pointer group"
            >
              <Users className="w-16 h-16 text-purple-600 mb-6 mx-auto group-hover:scale-110 transition" />
              <h2 className="text-2xl font-bold text-center mb-4">Patient</h2>
              <p className="text-gray-600 text-center mb-6">
                Accédez à vos exercices personnalisés et progressez à votre rythme
              </p>
              <div className="flex justify-center">
                <ArrowRight className="w-6 h-6 text-purple-600 group-hover:translate-x-2 transition" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  // Praticien Monitor
  const PractitionerMonitor = ({ sessionData, onFinish, saveExerciseToHistory }) => {
    const [liveData, setLiveData] = useState(sessionData);

    useEffect(() => {
      // Met à jour les données en temps réel quand le patient répond
      const unsubscribe = observeSessionById(sessionData.id, (data) => setLiveData(data));
      return () => unsubscribe();
    }, [sessionData.id]);

    const answers = liveData.patientAnswers || [];
    const isFinished = answers.length >= liveData.words.length;

    const handleFinishAndSave = async () => {
      // Sauvegarde dans l'historique local du praticien
      saveExerciseToHistory(liveData.type, liveData.words, answers);
      await deleteSession(liveData.id);
      onFinish();
    };

    return (
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            Suivi Patient en Direct
          </h2>
          <div className="text-gray-500">Progression : {answers.length} / {liveData.words.length}</div>
        </div>
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-bold mb-4">Mots et Réponses</h3>
            <ul className="space-y-2">
              {liveData.words.map((word, idx) => {
                const answer = answers[idx];
                const statusColor = answer ? (answer.correct ? "text-green-600 font-bold" : "text-red-600 font-bold") : "text-gray-400";
                return (
                  <li key={idx} className={`flex items-center justify-between p-3 bg-gray-50 rounded ${statusColor}`}>
                    <span>{word}</span>
                    <span className="flex items-center gap-2">
                      {answer ? answer.userAnswer : "..."} {answer && (answer.correct ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="bg-blue-50 p-6 rounded-xl flex flex-col justify-center text-center">
            <h3 className="text-xl font-bold mb-2">Note actuelle</h3>
            <div className="text-5xl font-bold text-blue-600 mb-2">{answers.filter(a => a.correct).length} / {answers.length}</div>
            {isFinished ? (
              <button onClick={handleFinishAndSave} className="mt-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold">Terminer & Sauvegarder</button>
            ) : (
              <p className="text-gray-500 mt-4">Le patient est en train de répondre...</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Praticien Page
  const PraticienPage = () => {
    const [praticienView, setPraticienView] = useState('categories');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showImporter, setShowImporter] = useState(false);

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Brain className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold">Espace Praticien</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowImporter(!showImporter)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                <Upload className="w-4 h-4" />
                Importer Manulex
              </button>
              <span className="text-gray-600">{currentUser?.email}</span>
              <button 
                onClick={() => setCurrentPage('home')}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Retour
              </button>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-6 py-8">
          {showImporter && (
            <div className="mb-8">
              <ManulexImporter onComplete={() => setShowImporter(false)} />
            </div>
          )}

          {praticienView === 'categories' && (
            <CategoriesView 
              onSelectCategory={(cat) => {
                if (cat === 'historique') {
                  setPraticienView('history');
                } else {
                  setSelectedCategory(cat);
                  setPraticienView('wordSelection');
                }
              }} 
            />
          )}
          
          {praticienView === 'wordSelection' && (
            <WordSelectionView 
              category={selectedCategory}
              onBack={() => setPraticienView('categories')}
            />
          )}

          {praticienView === 'history' && (
            <HistoryView 
              onBack={() => setPraticienView('categories')}
            />
          )}
        </div>
      </div>
    );
  };

  // Manulex Importer Component
  const ManulexImporter = ({ onComplete }) => {
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [stats, setStats] = useState(null);
    const [clearing, setClearing] = useState(false);
    const [progressPercent, setProgressPercent] = useState(0);

    const handleClearDatabase = async () => {
      if (!window.confirm('⚠️ Êtes-vous sûr de vouloir supprimer TOUS les mots de la base de données ? Cette action est irréversible.')) {
        return;
      }

      setClearing(true);
      setError('');
      setProgress('Suppression de la base de données...');
      setProgressPercent(0);

      try {
        const { clearAllWords } = await import('./services/manulexService');
        const result = await clearAllWords((current, total) => {
          const percent = Math.round((current / total) * 100);
          setProgressPercent(percent);
          setProgress(`Suppression : ${current}/${total} mots...`);
        });
        setProgress('');
        setProgressPercent(0);
        alert(`✅ ${result.count} mots supprimés avec succès !`);
        setClearing(false);
      } catch (err) {
        console.error('Erreur suppression:', err);
        setError('Erreur lors de la suppression : ' + err.message);
        setClearing(false);
        setProgressPercent(0);
      }
    };

    const handleFileUpload = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      setImporting(true);
      setError('');
      setProgress('Lecture du fichier...');
      setStats(null);
      setProgressPercent(0);

      try {
        const { parseManulexFile, transformManulexData, importWordsToFirestoreWithoutDuplicates } = await import('./services/manulexService');
        
        setProgressPercent(10);
        const rawData = await parseManulexFile(file);
        setProgress(`${rawData.length} entrées trouvées. Transformation...`);
        
        setProgressPercent(20);
        const transformedData = transformManulexData(rawData);
        setProgress(`${transformedData.length} mots valides. Vérification des doublons...`);
        
        setProgressPercent(30);
        const result = await importWordsToFirestoreWithoutDuplicates(
          transformedData,
          (current, total) => {
            const importProgress = 30 + Math.round((current / total) * 70);
            setProgressPercent(importProgress);
            setProgress(`Import en cours : ${current}/${total} mots traités...`);
          }
        );
        
        setProgress('');
        setProgressPercent(100);
        setSuccess(true);
        setStats(result);
        setImporting(false);
        
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 3000);
      } catch (err) {
        console.error('Erreur import:', err);
        setError('Erreur lors de l\'import : ' + err.message);
        setImporting(false);
        setProgressPercent(0);
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Importer la base Manulex</h2>
        <p className="text-gray-600 mb-6">
          Téléchargez d'abord le fichier Excel depuis{' '}
          <a 
            href="http://www.manulex.org/docs/fr/Manulex.xls" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            manulex.org
          </a>
          , puis importez-le ici. Le système détecte et ignore automatiquement les doublons.
        </p>

        {!success && !importing && !clearing && (
          <>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition mb-4">
              <Upload className="w-12 h-12 text-gray-400 mb-2" />
              <span className="text-gray-600">Cliquez pour sélectionner le fichier Manulex.xls</span>
              <input 
                type="file" 
                accept=".xls,.xlsx" 
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            
            <button
              onClick={handleClearDatabase}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
            >
              🗑️ Vider la base de données
            </button>
          </>
        )}

        {(importing || clearing) && (
          <div className="py-8">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <p className="text-gray-600 font-medium">{progress}</p>
                <span className="text-gray-600 font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-600 h-4 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <MessageSquare className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && stats && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <BookOpen className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-green-800 font-medium">Import terminé !</p>
                <div className="text-green-700 text-sm mt-2 space-y-1">
                  <p>✅ {stats.imported} nouveaux mots importés</p>
                  <p>⚠️ {stats.duplicates} doublons ignorés</p>
                  <p>📊 Total dans la base : {stats.total} mots</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Categories View
  const CategoriesView = ({ onSelectCategory }) => (
    <div>
      <h1 className="text-3xl font-bold mb-8">Sélectionnez une catégorie</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          onClick={() => onSelectCategory('mots')}
          className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition cursor-pointer group"
        >
          <BookOpen className="w-16 h-16 text-blue-600 mb-4 group-hover:scale-110 transition" />
          <h2 className="text-2xl font-bold mb-2">Mots</h2>
          <p className="text-gray-600">Gérez votre banque de mots pour créer des exercices personnalisés</p>
        </div>

        <div 
          onClick={() => onSelectCategory('historique')}
          className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition cursor-pointer group"
        >
          <BarChart3 className="w-16 h-16 text-purple-600 mb-4 group-hover:scale-110 transition" />
          <h2 className="text-2xl font-bold mb-2">Historique</h2>
          <p className="text-gray-600">Consultez les exercices passés et les résultats des patients</p>
        </div>
      </div>
    </div>
  );

  // Word Selection View
  const WordSelectionView = ({ category, onBack }) => {
    const [wordView, setWordView] = useState('selection');
    const [selectedWords, setSelectedWords] = useState([]);
    const [activeSession, setActiveSession] = useState(null);

    // Charger les mots sauvegardés au démarrage
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

    // Sauvegarder les mots sélectionnés à chaque changement
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
      console.log("Tentative de lancement..."); // DEBUG
      if (selectedWords.length < 1) return alert("Sélectionnez des mots.");
      
      try {
        console.log("Création de session pour", currentUser.uid); // DEBUG
        const sessionId = await createSession(currentUser.uid, 'anagram', selectedWords);
        setActiveSession({ id: sessionId, type: 'anagram', words: selectedWords, patientAnswers: [] });
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

    if (wordView === 'monitor' && activeSession) {
      return (
        <div>
           <button onClick={() => setWordView('selection')} className="mb-6 flex items-center gap-2 text-gray-600"><ArrowRight className="w-4 h-4 rotate-180" /> Retour</button>
           <PractitionerMonitor 
             sessionData={activeSession} 
             onFinish={() => setWordView('selection')}
             saveExerciseToHistory={saveExerciseToHistory} // Assurez-vous que cette fonction est accessible ici ou passée en prop
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
              // Sauvegarder l'exercice dans l'historique
              saveExerciseToHistory('anagram', selectedWords, results);
              setWordView('selection');
            }}
          />
        )}
      </div>
    );
  };

  // Fonction pour sauvegarder l'exercice dans l'historique
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
    history.unshift(exercise); // Ajouter au début
    
    // Garder seulement les 50 derniers exercices
    if (history.length > 50) {
      history.splice(50);
    }
    
    localStorage.setItem('exerciseHistory', JSON.stringify(history));
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
          <p className="text-gray-600 text-sm">Mots classés par fréquence et niveau scolaire (Manulex)</p>
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
      // Supprimer les doublons avant de trier
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
          <p className="text-gray-600 mb-4">Sélectionnez un niveau scolaire pour voir les mots les plus fréquents (source: Manulex)</p>
          
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
                  {words.length === 0 ? 'Aucun mot dans la base de données. Importez d\'abord les données Manulex.' : `Aucun mot trouvé pour "${searchTerm}"`}
                </div>
              )}
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
          
          {/* Clic pour faire l'exercice soi-même (Praticien) */}
          <div onClick={() => onSelectType('anagram')}>
            <MessageSquare className="w-16 h-16 text-blue-600 mb-4 group-hover:scale-110 transition" />
            <h3 className="text-xl font-bold mb-2">Anagramme</h3>
            <p className="text-gray-600 text-sm mb-4">Retrouvez le mot correct à partir des lettres mélangées</p>
          </div>
          
          {/* Clic pour lancer au patient */}
          <button 
            onClick={(e) => {
              e.stopPropagation(); // Empêche de lancer l'exercice local en même temps
              if (onLaunchForPatient) {
                onLaunchForPatient();
              } else {
                console.error("Fonction onLaunchForPatient manquante");
              }
            }}
            className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 mt-2 font-bold z-10 relative"
          >
            <Play className="w-4 h-4" /> Lancer pour le patient
          </button>

        </div>
      </div>
    </div>
  );

  // Anagram Exercise Component
  const AnagramExercise = ({ selectedWords, onBack, onFinish }) => {
    const [exercises, setExercises] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    useEffect(() => {
      generateExercises();
    }, []);

    const shuffleWord = (word) => {
      const letters = word.split('');
      for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
      }
      const shuffled = letters.join('');
      return shuffled === word ? shuffleWord(word) : shuffled;
    };

    const generateExercises = () => {
      setLoading(true);
      setTimeout(() => {
        const shuffled = [...selectedWords].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(10, selectedWords.length));
        const generated = selected.map(word => ({
          originalWord: word,
          scrambledWord: shuffleWord(word)
        }));
        setExercises(generated);
        setLoading(false);
      }, 1500);
    };

    const checkAnswer = () => {
      const correct = userAnswer.toLowerCase().trim() === exercises[currentIndex].originalWord.toLowerCase();
      setIsCorrect(correct);
      setShowResult(true);
      const newResult = { word: exercises[currentIndex].originalWord, userAnswer, correct };
      setResults([...results, newResult]);
    };

    const nextExercise = () => {
      if (currentIndex < exercises.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setUserAnswer('');
        setShowResult(false);
      } else {
        // Fin des exercices - retourner tous les résultats
        onFinish([...results, { word: exercises[currentIndex].originalWord, userAnswer, correct: isCorrect }]);
      }
    };

    if (loading) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold mb-2">Génération des exercices...</h2>
          <p className="text-gray-600">Préparation de 10 anagrammes</p>
        </div>
      );
    }

    const currentExercise = exercises[currentIndex];

    return (
      <div>
        <button 
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Quitter l'exercice
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Exercice Anagramme</h2>
            <span className="text-gray-600 font-medium">Question {currentIndex + 1}/{exercises.length}</span>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8 mb-6 text-center">
            <p className="text-gray-600 mb-4">Retrouvez le mot correct :</p>
            <p className="text-4xl font-bold text-blue-600 tracking-widest">{currentExercise.scrambledWord}</p>
          </div>

          {!showResult ? (
            <div className="space-y-4">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && userAnswer && checkAnswer()}
                placeholder="Tapez votre réponse..."
                className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <button
                onClick={checkAnswer}
                disabled={!userAnswer.trim()}
                className="w-full py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Valider
              </button>
            </div>
          ) : (
            <div>
              <div className={`p-6 rounded-xl mb-4 ${isCorrect ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
                <p className={`text-xl font-bold mb-2 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  {isCorrect ? '✓ Correct !' : '✗ Incorrect'}
                </p>
                {!isCorrect && (
                  <p className="text-gray-700">
                    La bonne réponse était : <span className="font-bold">{currentExercise.originalWord}</span>
                  </p>
                )}
              </div>
              <button
                onClick={nextExercise}
                className="w-full py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 transition font-medium"
              >
                {currentIndex < exercises.length - 1 ? 'Exercice suivant →' : 'Terminer'}
              </button>
            </div>
          )}

          <div className="mt-6 flex gap-2 justify-center">
            {exercises.map((_, idx) => (
              <div
                key={idx}
                className={`w-3 h-3 rounded-full ${
                  idx < currentIndex 
                    ? (results[idx]?.correct ? 'bg-green-500' : 'bg-red-500')
                    : idx === currentIndex 
                    ? 'bg-blue-600' 
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Irregular Word List
  const IrregularWordList = ({ onBack, selectedWords, setSelectedWords }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [words, setWords] = useState([]);
    const [loading, setLoading] = useState(true);

    // Charger les mots irréguliers depuis Firebase
    useEffect(() => {
      loadWords();
    }, []);

    const loadWords = async () => {
      setLoading(true);
      try {
        const fetchedWords = await getIrregularWords();
        // Supprimer les doublons basés sur le mot
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
                  {words.length === 0 ? 'Aucun mot irrégulier dans la base de données.' : `Aucun mot trouvé pour "${searchTerm}"`}
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
              {selectedWords.length} mot(s) dans votre liste{searchTerm && ` • ${filteredWords.length} mot(s) affiché(s)`}
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

  // History View Component
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

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Détails de l'exercice</h2>
                <p className="text-gray-600">{formatDate(selectedExercise.date)}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">{selectedExercise.score}/{selectedExercise.total}</div>
                <div className="text-gray-600">Score</div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 font-medium">
                Type : <span className="capitalize">{selectedExercise.type}</span>
              </p>
              <p className="text-blue-700 text-sm mt-1">
                Taux de réussite : {Math.round((selectedExercise.score / selectedExercise.total) * 100)}%
              </p>
            </div>

            <h3 className="text-xl font-bold mb-4">Résultats détaillés</h3>
            <div className="space-y-3">
              {selectedExercise.results.map((result, idx) => (
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
          </div>
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

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Historique des exercices</h1>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Tout effacer
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <BarChart3 className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">Aucun exercice dans l'historique</h3>
            <p className="text-gray-500">Les exercices complétés apparaîtront ici</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((exercise) => (
              <div 
                key={exercise.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition cursor-pointer"
                onClick={() => setSelectedExercise(exercise)}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-1 capitalize">{exercise.type}</h3>
                      <p className="text-gray-500 text-sm">{formatDate(exercise.date)}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteExercise(exercise.id);
                      }}
                      className="text-gray-400 hover:text-red-600 transition"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white mb-4">
                    <div className="text-3xl font-bold">{exercise.score}/{exercise.total}</div>
                    <div className="text-sm opacity-90">
                      {Math.round((exercise.score / exercise.total) * 100)}% de réussite
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    <p>{exercise.words.length} mots utilisés</p>
                    <p className="mt-1">Cliquez pour voir les détails</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Patient Page
  const PatientPage = () => {
    const [status, setStatus] = useState('searching');
    const [session, setSession] = useState(null);
    
    // États pour gérer l'exercice comme le Praticien
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [localResults, setLocalResults] = useState([]); // Pour afficher les points en bas
    const [scrambledWord, setScrambledWord] = useState('');

    // Écouter la session
    useEffect(() => {
      const unsubscribe = listenForActiveSession(currentUser.uid, (sessionData) => {
        if (sessionData) {
          setSession(sessionData);
          
          // LOGIQUE MODIFIÉE ICI :
          if (sessionData.status === 'finished') {
            setStatus('result');
          } else if (sessionData.status === 'active') {
            setStatus('active'); // L'exercice est lancé
          } else if (sessionData.status === 'waiting') {
            setStatus('waiting'); // On affiche l'écran de "Prêt ?"
          }
        } else {
          setSession(null); 
          setStatus('searching');
        }
      });
      return () => unsubscribe();
    }, []);

    // Mélanger le mot quand on change d'index
    useEffect(() => {
      if (session && session.words[currentWordIndex]) {
        const word = session.words[currentWordIndex];
        setScrambledWord(word.split('').sort(() => Math.random() - 0.5).join(''));
      }
    }, [session, currentWordIndex]);

    // Fonction pour démarrer l'exercice
    const handleStartExercise = async () => {
      if (!session) return;
      try {
        // On passe la session en 'active' dans Firestore
        await updateSessionStatus(session.id, 'active');
        // Le useEffect ci-dessus détectera le changement et passera setStatus('active') automatiquement
      } catch (error) {
        console.error("Erreur lancement:", error);
      }
    };


    // Validation (Identique à AnagramExercise)
    const checkAnswer = async () => {
      const currentWord = session.words[currentWordIndex];
      const correct = userAnswer.toLowerCase().trim() === currentWord.toLowerCase();
      
      setIsCorrect(correct);
      setShowResult(true);
      
      // On sauvegarde le résultat local pour les points en bas
      const newResult = { word: currentWord, userAnswer, correct };
      setLocalResults([...localResults, newResult]);

      // Envoi à Firestore
      await sendAnswer(session.id, { 
        word: currentWord, 
        userAnswer: userAnswer, 
        correct: correct, 
        timestamp: new Date().toISOString() 
      });
    };

    // Passage au suivant (Identique à AnagramExercise)
    const nextExercise = () => {
      if (currentWordIndex < session.words.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
        setUserAnswer('');
        setShowResult(false);
      } else {
        setStatus('waiting_finish');
      }
    };

    // Supprimer toutes les sessions en court
    const handleDebugClear = async () => {
      if (window.confirm("DEBUG: Voulez-vous vraiment supprimer TOUTES les sessions en cours ? Cela réinitialisera l'état.")) {
        await clearUserSessions(currentUser.uid);
        setSession(null);
        setStatus('searching');
        alert("Sessions nettoyées !");
      }
    };

    // Retour à la page patient
    const handleReturnToStart = () => {
      setSession(null);
      setStatus('searching');
      setCurrentPage('patient'); 
    };

    // --- VUES ---

    
    // 1. Recherche en cours
    if (status === 'searching') {
      return (
        <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="animate-bounce mb-6"><Brain className="w-20 h-20 text-blue-600" /></div>
          <h2 className="text-2xl font-bold mb-4">En attente du praticien...</h2>
          <p className="text-gray-600">Connecté en tant que patient</p>
          <button 
            onClick={handleDebugClear}
            className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm border border-red-200 hover:bg-red-200 transition"
          >
            🗑️ DEBUG : Réinitialiser les sessions
          </button>
        </div>
      );
    }

    // 2. Session trouvé / Lancé l'exercice
    if (status === 'waiting' && session) {
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10 text-center border-2 border-blue-50">
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Play className="w-10 h-10 text-blue-600 ml-1" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Séance Prête !</h2>
            <p className="text-gray-500 mb-8">Le praticien a préparé un exercice pour toi.</p>
            
            <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 font-medium">Type d'exercice :</span>
                <span className="font-bold text-blue-600 capitalize">{session.type}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Nombre de questions :</span>
                <span className="font-bold text-blue-600">{session.words.length}</span>
              </div>
            </div>

            <button 
              onClick={handleStartExercise}
              className="w-full py-4 bg-blue-600 text-white rounded-xl text-xl font-bold hover:bg-blue-700 transition transform hover:scale-105 shadow-lg"
            >
              Commencer l'exercice
            </button>
          </div>
        </div>
      );
    }
    
    // 3.  Exercice (Anagram)
    if (status === 'active' && session) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Exercice Anagramme</h2>
              <span className="text-gray-600 font-medium">Question {currentWordIndex + 1}/{session.words.length}</span>
            </div>

            {/* Zone du mot brouillé */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8 mb-6 text-center">
              <p className="text-gray-600 mb-4">Retrouvez le mot correct :</p>
              <p className="text-4xl font-bold text-blue-600 tracking-widest uppercase">{scrambledWord}</p>
            </div>

            {/* Zone de réponse ou Résultat */}
            {!showResult ? (
              <div className="space-y-4">
                <input 
                  type="text" 
                  value={userAnswer} 
                  onChange={(e) => setUserAnswer(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && userAnswer && checkAnswer()}
                  placeholder="Tapez votre réponse..." 
                  className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  autoFocus 
                />
                <button 
                  onClick={checkAnswer} 
                  disabled={!userAnswer.trim()} 
                  className="w-full py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-300"
                >
                  Valider
                </button>
              </div>
            ) : (
              <div>
                <div className={`p-6 rounded-xl mb-4 ${isCorrect ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'}`}>
                  <p className={`text-xl font-bold mb-2 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {isCorrect ? '✓ Correct !' : '✗ Incorrect'}
                  </p>
                  {!isCorrect && (
                    <p className="text-gray-700">
                      La bonne réponse était : <span className="font-bold">{session.words[currentWordIndex]}</span>
                    </p>
                  )}
                </div>
                <button 
                  onClick={nextExercise} 
                  className="w-full py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  {currentWordIndex < session.words.length - 1 ? 'Exercice suivant →' : 'Terminer'}
                </button>
              </div>
            )}

            {/* Points de progression (Dots) */}
            <div className="mt-6 flex gap-2 justify-center">
              {session.words.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-full ${
                    idx < currentWordIndex 
                      ? (localResults[idx]?.correct ? 'bg-green-500' : 'bg-red-500')
                      : idx === currentWordIndex 
                      ? 'bg-blue-600' 
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (status === 'waiting_finish' || status === 'result') {
      // Calcul du score basé sur les résultats locaux ou ceux de la session
      const score = localResults.filter(r => r.correct).length;
      
      return (
        <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-10 rounded-2xl shadow-xl">
            <h2 className="text-3xl font-bold text-green-600 mb-4">Exercice Terminé !</h2>
            <p className="text-xl mt-4 mb-8">Votre score : <span className="font-bold">{score} / {session?.words.length}</span></p>
            <div className="flex flex-col gap-3">
               <p className="text-gray-500 text-sm">Le praticien va clore la session...</p>
               <button onClick={handleReturnToStart} className="text-blue-600 underline hover:text-blue-800">
                Retourner à l'accueil</button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Page Router
  const renderPage = () => {
    switch(currentPage) {
      case 'landing':
        return <LandingPage />;
      case 'login':
        return <LoginPage />;
      case 'home':
        return <HomePage />;
      case 'praticien':
        return <PraticienPage />;
      case 'patient':
        return <PatientPage />;
      default:
        return <LandingPage />;
    }
  };

  return renderPage();
};

export default OrthoApp;