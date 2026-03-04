import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LibraryProvider } from './hooks/LibraryContext';
import { CoverProvider } from './hooks/CoverContext';
import { BooksProvider } from './hooks/BooksContext';
import { AuthProvider, useAuth } from './hooks/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import DiscoverPage from './pages/DiscoverPage';
import SearchPage from './pages/SearchPage';
import BookPage from './pages/BookPage';
import FavoritesPage from './pages/FavoritesPage';
import CyclePage from './pages/CyclePage';
import LibraryPage from './pages/LibraryPage';
import LibraryBookPage from './pages/LibraryBookPage';
import QuizPage from './pages/QuizPage';
import SpinPage from './pages/SpinPage';
import IfYouLikedPage from './pages/IfYouLikedPage';
import StatsPage from './pages/StatsPage';
import AuthorPage from './pages/AuthorPage';
import TBRPage from './pages/TBRPage';
import NYTBookPage from './pages/NYTBookPage';
import AuthPage from './pages/AuthPage';
import SettingsPage from './pages/SettingsPage';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#141010',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#e2ddd5',
        fontSize: '18px',
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div style={{
      backgroundColor: '#141010',
      minHeight: '100vh',
      color: '#e2ddd5',
    }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/book/:id" element={<BookPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/cycle" element={<CyclePage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/library/:id" element={<LibraryBookPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/spin" element={<SpinPage />} />
        <Route path="/if-you-liked" element={<IfYouLikedPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/author/:name" element={<AuthorPage />} />
        <Route path="/tbr" element={<TBRPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/trending/:isbn" element={<NYTBookPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Navbar />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BooksProvider>
          <CoverProvider>
            <LibraryProvider>
              <AppRoutes />
            </LibraryProvider>
          </CoverProvider>
        </BooksProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
