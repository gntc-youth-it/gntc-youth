import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AuthCallback from './pages/AuthCallback';
import BibleTranscriptionPage from './pages/BibleTranscriptionPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/bible" element={<BibleTranscriptionPage />} />
      </Routes>
    </Router>
  );
}

export default App;
