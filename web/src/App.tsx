/*
 * Choizee - Инструмент для оценки кандидатов
 * Copyright (c) 2025 Konstantin Ansimov
 * 
 * Данное программное обеспечение предоставляется для некоммерческого использования.
 * Коммерческое использование требует отдельной лицензии.
 * Подробности в файле LICENSE.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import JobList from './components/JobList';
import JobForm from './components/JobForm';
import CandidateList from './components/CandidateList';
import QuestionList from './components/QuestionList';
import CandidateInterview from './components/CandidateInterview';
import CandidateComparison from './components/CandidateComparison';
import Breadcrumbs from './components/Breadcrumbs';
import { ToastProvider } from './components/Toast';

function App() {
  return (
    <ToastProvider>
      <Router>
        <div className="app">
        <header className="app-header">
          <h1>🎯 Choizee</h1>
          <p>Инструмент для оценки кандидатов</p>
        </header>
        <main className="app-main">
          <Breadcrumbs />
          <Routes>
            {/* Главная страница - список вакансий */}
            <Route path="/" element={<JobList />} />
            
            {/* Создание новой вакансии */}
            <Route path="/jobs/new" element={<JobForm />} />
            
            {/* Редактирование вакансии */}
            <Route path="/jobs/:id/edit" element={<JobForm />} />
            
            {/* Кандидаты для вакансии */}
            <Route path="/jobs/:id/candidates" element={<CandidateList />} />
            
            {/* Сравнение кандидатов */}
            <Route path="/jobs/:id/comparison" element={<CandidateComparison />} />
            
            {/* Вопросы для вакансии */}
            <Route path="/jobs/:id/questions" element={<QuestionList />} />
            
            {/* Оценка кандидата */}
            <Route path="/jobs/:jobId/candidates/:candidateId/evaluation" element={<CandidateInterview />} />
            
            {/* Редирект для неизвестных путей */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
    </ToastProvider>
  );
}

export default App; 