import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface CandidateData {
  name: string;
  scores: { [criterion: string]: number };
  color: string;
}

interface RadarChartProps {
  criteria: string[];
  candidates: CandidateData[];
  title?: string;
}

const RadarChart: React.FC<RadarChartProps> = ({ criteria, candidates, title }) => {
  const data = {
    labels: criteria,
    datasets: candidates.map((candidate, index) => ({
      label: candidate.name,
      data: criteria.map(criterion => candidate.scores[criterion] || 0),
      backgroundColor: `${candidate.color}20`, // прозрачность 20%
      borderColor: candidate.color,
      borderWidth: 2,
      pointBackgroundColor: candidate.color,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
    }))
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 14,
            weight: 'bold' as const
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.r}/10`;
          }
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        min: 0,
        max: 10,
        ticks: {
          stepSize: 2,
          callback: function(value: any) {
            return value + '/10';
          },
          font: {
            size: 12
          }
        },
        grid: {
          color: '#e2e8f0',
          lineWidth: 1
        },
        pointLabels: {
          font: {
            size: 13,
            weight: 'bold' as const
          },
          color: '#374151'
        }
      }
    },
    elements: {
      line: {
        tension: 0.1
      }
    }
  };

  return (
    <div style={{ position: 'relative', height: '500px', width: '100%' }}>
      {title && (
        <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: '#374151' }}>
          {title}
        </h4>
      )}
      <Radar data={data} options={options} />
    </div>
  );
};

export default RadarChart; 