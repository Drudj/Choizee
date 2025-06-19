import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  path: string;
  label: string;
  icon?: string;
}

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  
  // Парсим путь и создаем breadcrumbs
  const getBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [
      { path: '/', label: 'Вакансии', icon: '🏠' }
    ];

    // Разбираем путь
    const pathSegments = pathname.split('/').filter(Boolean);
    
    if (pathSegments.length === 0) {
      return breadcrumbs; // Только главная страница
    }

    // /jobs/new
    if (pathSegments[0] === 'jobs' && pathSegments[1] === 'new') {
      breadcrumbs.push({ path: '/jobs/new', label: 'Создание вакансии', icon: '➕' });
      return breadcrumbs;
    }

    // /jobs/:id/edit
    if (pathSegments[0] === 'jobs' && pathSegments[2] === 'edit') {
      const jobId = pathSegments[1];
      breadcrumbs.push({ path: `/jobs/${jobId}/edit`, label: 'Редактирование вакансии', icon: '✏️' });
      return breadcrumbs;
    }

    // /jobs/:id/candidates
    if (pathSegments[0] === 'jobs' && pathSegments[2] === 'candidates') {
      const jobId = pathSegments[1];
      breadcrumbs.push({ path: `/jobs/${jobId}/candidates`, label: 'Кандидаты', icon: '👥' });
      
      // /jobs/:id/candidates/:candidateId/evaluation
      if (pathSegments[3] && pathSegments[4] === 'evaluation') {
        const candidateId = pathSegments[3];
        breadcrumbs.push({ 
          path: `/jobs/${jobId}/candidates/${candidateId}/evaluation`, 
          label: 'Интервью', 
          icon: '🎯' 
        });
      }
      
      return breadcrumbs;
    }

    // /jobs/:id/comparison
    if (pathSegments[0] === 'jobs' && pathSegments[2] === 'comparison') {
      const jobId = pathSegments[1];
      breadcrumbs.push({ path: `/jobs/${jobId}/candidates`, label: 'Кандидаты', icon: '👥' });
      breadcrumbs.push({ path: `/jobs/${jobId}/comparison`, label: 'Сравнение', icon: '📊' });
      return breadcrumbs;
    }

    // /jobs/:id/questions
    if (pathSegments[0] === 'jobs' && pathSegments[2] === 'questions') {
      const jobId = pathSegments[1];
      breadcrumbs.push({ path: `/jobs/${jobId}/questions`, label: 'Вопросы', icon: '📝' });
      return breadcrumbs;
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs(location.pathname);

  // Если только главная страница, не показываем breadcrumbs
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="breadcrumbs" aria-label="Навигация">
      <ol className="breadcrumbs-list">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.path} className="breadcrumb-item">
            {index < breadcrumbs.length - 1 ? (
              <>
                <Link to={breadcrumb.path} className="breadcrumb-link">
                  {breadcrumb.icon && <span className="breadcrumb-icon">{breadcrumb.icon}</span>}
                  <span className="breadcrumb-text">{breadcrumb.label}</span>
                </Link>
                <span className="breadcrumb-separator">›</span>
              </>
            ) : (
              <span className="breadcrumb-current">
                {breadcrumb.icon && <span className="breadcrumb-icon">{breadcrumb.icon}</span>}
                <span className="breadcrumb-text">{breadcrumb.label}</span>
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs; 