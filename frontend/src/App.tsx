import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Wizard from './pages/Wizard';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import DestinationDetail from './pages/DestinationDetail';
import Chatbot from './components/Chatbot';
import { Globe, MessageSquareText, LogOut, User, Home, Map, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
}

function Navigation() {
  const { user, logout } = useAuth();

  return (
    <nav className="w-full bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        <a href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">AtlasAI</span>
            <div className="text-[9px] text-slate-400 font-medium -mt-1">Your Intelligent Travel Companion</div>
          </div>
        </a>
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
          <a href="/" className="hover:text-blue-600 transition-colors">Home</a>
          <a href="/plan" className="hover:text-blue-600 transition-colors">Plan Trip</a>
          {user && <a href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</a>}
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <User className="w-4 h-4" />
                {user.displayName || user.email?.split('@')[0]}
              </div>
              <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <a href="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors px-4 py-2">Sign In</a>
          )}
          <a href="/plan" className="bg-gradient-to-r from-blue-600 to-teal-500 text-white text-sm font-bold px-5 py-2.5 rounded-full hover:opacity-90 hover:scale-105 transition-all shadow-md flex items-center justify-center whitespace-nowrap">
            Plan My Trip
          </a>
        </div>
      </div>
    </nav>
  );
}

function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const path = location.pathname;

  const items = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/plan', icon: Map, label: 'Plan Trip' },
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', auth: true },
    { href: user ? '/dashboard' : '/login', icon: User, label: user ? 'Profile' : 'Sign In' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {items.map((item) => {
          const isActive = path === item.href || (item.href !== '/' && path.startsWith(item.href));
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-blue-600 scale-105'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-blue-50' : ''}`}>
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-semibold leading-none ${isActive ? 'text-blue-600' : ''}`}>{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

function AppContent() {
  const [showChatbot, setShowChatbot] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navigation />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route path="/plan" element={<ProtectedRoute><Wizard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/destination/:name" element={<ProtectedRoute><DestinationDetail /></ProtectedRoute>} />
      </Routes>

      {/* Mobile bottom navigation */}
      <BottomNav />

      {/* Global floating chatbot - pushed up on mobile to avoid bottom nav */}
      <button
        onClick={() => setShowChatbot(!showChatbot)}
        className="fixed bottom-24 md:bottom-8 right-6 bg-gradient-to-r from-blue-600 to-teal-500 text-white pl-5 pr-6 py-3.5 rounded-full shadow-xl hover:scale-105 transition-transform z-50 flex items-center font-bold text-sm"
      >
        <MessageSquareText className="w-5 h-5 mr-2" /> Ask AtlasAI
      </button>
      {showChatbot && <Chatbot onClose={() => setShowChatbot(false)} />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
