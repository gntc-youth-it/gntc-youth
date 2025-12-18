import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';
import BibleTranscriptionPage from './pages/BibleTranscriptionPage';
import BibleMainPage from './pages/BibleMainPage';
import CellSelectPage from './pages/CellSelectPage';
import BibleTranscribePage from './pages/BibleTranscribePage';
import BibleRankingPage from './pages/BibleRankingPage';
import ChristmasPage from './pages/ChristmasPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/bible" element={<BibleTranscriptionPage />} />
        <Route path="/bible/main" element={<BibleMainPage />} />
        <Route path="/bible/select-cell" element={<CellSelectPage />} />
        <Route path="/bible/transcribe/:bookName/:chapter" element={<BibleTranscribePage />} />
        <Route path="/bible/ranking" element={<BibleRankingPage />} />
        <Route path="/christmas" element={<ChristmasPage />} />
      </Routes>
    </Router>
  );
}

export default App;
