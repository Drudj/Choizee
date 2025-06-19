import React, { useState, useEffect } from 'react';

interface QuestionLibraryProps {
  onSelectQuestion: (question: string) => void;
  onClose: () => void;
}

interface Role {
  id: string;
  name: string;
  level: string;
  questions: string[];
}

interface Category {
  id: string;
  name: string;
  description: string;
  roles: Role[];
}

interface LibraryData {
  categories: Category[];
}

const QuestionLibrary: React.FC<QuestionLibraryProps> = ({ onSelectQuestion, onClose }) => {
  const [libraryData, setLibraryData] = useState<LibraryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  useEffect(() => {
    loadLibraryData();
  }, []);

  const loadLibraryData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/interview_questions_library.json');
      if (!response.ok) {
        throw new Error('Не удалось загрузить библиотеку вопросов');
      }
      const data = await response.json();
      setLibraryData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки библиотеки');
      console.error('Error loading question library:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionSelect = (question: string) => {
    onSelectQuestion(question);
    onClose();
  };

  // Фильтрация данных
  const getFilteredRoles = () => {
    if (!libraryData) return [];

    let allRoles: (Role & { categoryName: string })[] = [];
    
    libraryData.categories.forEach(category => {
      if (selectedCategory === 'all' || selectedCategory === category.id) {
        category.roles.forEach(role => {
          if (selectedLevel === 'all' || selectedLevel === role.level) {
            allRoles.push({
              ...role,
              categoryName: category.name
            });
          }
        });
      }
    });

    // Фильтрация по поисковому запросу
    if (searchTerm) {
      allRoles = allRoles.filter(role => {
        const searchLower = searchTerm.toLowerCase();
        return (
          role.name.toLowerCase().includes(searchLower) ||
          role.categoryName.toLowerCase().includes(searchLower) ||
          role.questions.some(q => q.toLowerCase().includes(searchLower))
        );
      });
    }

    return allRoles;
  };

  const getFilteredQuestions = (role: Role & { categoryName: string }) => {
    if (!searchTerm) return role.questions;
    
    return role.questions.filter(question => 
      question.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getAllLevels = () => {
    if (!libraryData) return [];
    const levels = new Set<string>();
    libraryData.categories.forEach(category => {
      category.roles.forEach(role => {
        levels.add(role.level);
      });
    });
    return Array.from(levels);
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content large">
          <div className="modal-body">
            <div className="loading">Загрузка библиотеки вопросов...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Ошибка</h3>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <p>{error}</p>
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={onClose}>
              Закрыть
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredRoles = getFilteredRoles();
  const totalQuestions = filteredRoles.reduce((sum, role) => 
    sum + getFilteredQuestions(role).length, 0
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <div className="library-header-content">
            <div className="library-title-section">
              <h3>📚 Библиотека вопросов для интервью</h3>
              <p className="library-subtitle">Готовые вопросы для техических интервью</p>
            </div>
            <div className="library-humor-section">
              <div className="fabric-image-container">
                <img 
                  src="/fabric_details.jpg" 
                  alt="Fabric Details" 
                  className="fabric-image"
                  title="Потому что качественные вопросы - это как качественная ткань 😄"
                />
                <div className="fabric-overlay"></div>
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Фильтры и поиск */}
          <div className="library-filters">
            <div className="filter-row">
              <div className="filter-group">
                <label htmlFor="search">🔍 Поиск по вопросам</label>
                <input
                  id="search"
                  type="text"
                  className="form-input"
                  placeholder="Введите ключевые слова..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="filter-group">
                <label htmlFor="category">Категория</label>
                <select
                  id="category"
                  className="form-input"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">Все категории</option>
                  {libraryData?.categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="level">Уровень</label>
                <select
                  id="level"
                  className="form-input"
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                >
                  <option value="all">Все уровни</option>
                  {getAllLevels().map(level => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filter-stats">
              Найдено: <strong>{filteredRoles.length}</strong> ролей, 
              <strong> {totalQuestions}</strong> вопросов
            </div>
          </div>

          {/* Результаты */}
          <div className="library-results">
            {filteredRoles.length === 0 ? (
              <div className="empty-state">
                <p>Вопросы не найдены</p>
                <p className="text-muted">Попробуйте изменить критерии поиска</p>
              </div>
            ) : (
              filteredRoles.map((role, roleIndex) => {
                const filteredQuestions = getFilteredQuestions(role);
                if (filteredQuestions.length === 0) return null;

                return (
                  <div key={`${role.id}-${roleIndex}`} className="role-section">
                    <div className="role-header">
                      <h4>
                        <span className="role-category">{role.categoryName}</span>
                        <span className="role-name">{role.name}</span>
                        <span className={`role-level level-${role.level.toLowerCase()}`}>
                          {role.level}
                        </span>
                      </h4>
                      <span className="question-count">
                        {filteredQuestions.length} вопросов
                      </span>
                    </div>

                    <div className="questions-grid">
                      {filteredQuestions.map((question, questionIndex) => (
                        <div 
                          key={questionIndex} 
                          className="question-item clickable"
                          onClick={() => handleQuestionSelect(question)}
                        >
                          <div className="question-text">{question}</div>
                          <div className="question-actions">
                            <button 
                              className="btn btn-sm btn-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuestionSelect(question);
                              }}
                            >
                              ✨ Выбрать
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionLibrary; 