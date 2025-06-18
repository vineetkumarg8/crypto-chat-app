import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PriceChart = ({ data, coinName, className = '' }) => {
  if (!data || data.length === 0) {
    return (
      <div className={`chart-container ${className}`}>
        <p className="text-gray-500 text-center py-8">No chart data available</p>
      </div>
    );
  }

  const chartData = {
    labels: data.map(point => {
      const date = new Date(point.timestamp);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: data.length <= 24 ? 'numeric' : undefined,
      });
    }),
    datasets: [
      {
        label: `${coinName} Price (USD)`,
        data: data.map(point => point.price),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'rgb(59, 130, 246)',
        pointHoverBorderColor: 'white',
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `${coinName} - 7 Day Price Chart`,
        font: {
          size: 16,
          weight: 'bold',
        },
        color: '#374151',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `$${context.parsed.y.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6,
            })}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
          },
          maxTicksLimit: 7,
        },
      },
      y: {
        display: true,
        position: 'right',
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
          },
          callback: function(value) {
            return '$' + value.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            });
          },
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    elements: {
      point: {
        hoverRadius: 8,
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
    },
  };

  const firstPrice = data[0]?.price;
  const lastPrice = data[data.length - 1]?.price;
  const priceChange = lastPrice - firstPrice;
  const priceChangePercent = ((priceChange / firstPrice) * 100);
  const isPositive = priceChange >= 0;

  return (
    <div className={`chart-container ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{coinName}</h3>
          <p className="text-2xl font-bold text-gray-900">
            ${lastPrice?.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6,
            })}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-medium ${isPositive ? 'price-positive' : 'price-negative'}`}>
            {isPositive ? '+' : ''}${priceChange.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6,
            })}
          </p>
          <p className={`text-sm font-medium ${isPositive ? 'price-positive' : 'price-negative'}`}>
            {isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="h-64 w-full">
        <Line data={chartData} options={options} />
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Data from CoinGecko • Last 7 days
      </div>
    </div>
  );
};

export default PriceChart;
