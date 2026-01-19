import { useState, useEffect } from 'react';
import { User, Brain, ArrowRight, MessageSquare, Users, BarChart3, BookOpen, LogOut } from 'lucide-react';
import { registerUser, loginUser, logoutUser, observeAuthState } from './services/authService';
import { addPractitioner } from './services/firestoreService';
import Praticien from './pages/Praticien';
import Patient from './pages/Patient';

const OrthoApp = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  // Home Page - Choix du type d'utilisateur
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
        return <Praticien currentUser={currentUser} onBack={() => setCurrentPage('home')} />;
      case 'patient':
        return <Patient currentUser={currentUser} onBack={() => setCurrentPage('home')} />;
      default:
        return <LandingPage />;
    }
  };

  return renderPage();
};

export default OrthoApp;