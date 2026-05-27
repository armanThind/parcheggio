import React, { useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function QuartieriChart({ dati, maxPosti }) {
  const chartRef = useRef();
  const labels = Object.keys(maxPosti);
  const occupati = labels.map(q => dati[q] || 0);
  const totali = labels.map(q => maxPosti[q]);

  const data = {
    labels,
    datasets: [
      {
        label: 'Occupati',
        data: occupati,
        backgroundColor: 'rgba(56, 142, 60, 0.7)'
      },
      {
        label: 'Totali',
        data: totali,
        backgroundColor: 'rgba(189, 189, 189, 0.3)'
      }
    ]
  };

  // Funzione per calcolare la scala Y in base ai dataset visibili
  function getDynamicMaxY(visible) {
    let maxY = 10;
    if (visible[0] && visible[1]) {
      // Entrambi visibili
      const maxOccupati = Math.max(...occupati, 10);
      maxY = Math.max(...totali, maxOccupati) < 20 ? 20 : Math.max(...totali, maxOccupati) * 0.2 + Math.max(...totali, maxOccupati);
    } else if (visible[0]) {
      // Solo Occupati
      const maxOccupati = Math.max(...occupati, 1);
      maxY = Math.max(10, Math.ceil(maxOccupati * 1.2));
    } else if (visible[1]) {
      // Solo Totali
      const maxTotali = Math.max(...totali, 1);
      maxY = Math.max(10, Math.ceil(maxTotali * 1.2));
    }
    return Math.ceil(maxY);
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        onClick: (e, legendItem, legend) => {
          // Default toggle
          const ci = legend.chart;
          const index = legendItem.datasetIndex;
          const meta = ci.getDatasetMeta(index);
          meta.hidden = meta.hidden === null ? !ci.data.datasets[index].hidden : null;
          // Calcola quali dataset sono visibili
          const visible = ci.data.datasets.map((ds, i) => !ci.getDatasetMeta(i).hidden);
          ci.options.scales.y.max = getDynamicMaxY(visible);
          ci.update();
        }
      },
      title: { display: true, text: 'Posti Occupati per Quartiere' }
    },
    scales: {
      y: { beginAtZero: true, max: getDynamicMaxY([true, true]) }
    }
  };

  return <Bar ref={chartRef} data={data} options={options} />;
}
