import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import StatCard from '../components/StatCard';
import DonutChart from '../components/DonutChart';

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCountData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/counts');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching count data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCountData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="dashboard-container p-8">
      {/* Header Section */}
      <div className="dashboard-header mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Universe Overview</h1>
            <p className="text-gray-600">Explore your data entities, relationships, and metadata</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search entities..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
                🔍
              </span>
            </div>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
              + Add Entity
            </button>
          </div>
        </div>
      </div>

      {/* Cards Section */}
      <div className="dashboard-cards space-y-6">
        {/* Total Entities and Major Counts Cards - Aligned in same row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Entities Card */}
          <StatCard
            title="Total Entities"
            value={data.total_count}
            icon="🗄️"
            colorTheme="blue"
          />
          
          {/* Major Counts Cards */}
          {Object.entries(data.major_counts || {}).map(([key, value], index) => {
            const icons = ['🏢', '👤', '📊'];
            let title;
            if (key === 'Person') {
              title = value > 1 ? 'Total People' : 'Total Person';
            } else {
              title = `Total ${key}${value > 1 ? 's' : ''}`;
            }
            return (
              <StatCard
                key={key}
                title={title}
                value={value}
                icon={icons[index] || '📦'}
                colorTheme="blue"
              />
            );
          })}
        </div>

        

        {/* Minor Counts Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(data.minor_counts || {}).flatMap(([majorKey, minorCounts]) => 
            Object.entries(minorCounts).map(([key, value]) => ({ key, value, majorKey }))
          ).map(({ key, value, majorKey }, index) => {
            const icons = ['👔', '🏛️', '👥', '📋'];
            const handleClick = () => {
              navigate(`/entities?major=${encodeURIComponent(majorKey)}&minor=${encodeURIComponent(key)}`);
            };
            return (
              <StatCard
                key={`${key}-${index}`}
                title={key.charAt(0).toUpperCase() + key.slice(1)}
                value={value}
                icon={icons[index] || '📦'}
                colorTheme="purple"
                onClick={handleClick}
              />
            );
          })}
        </div>

        {/* Donut Chart */}
        <DonutChart majorCounts={data.major_counts} minorCounts={data.minor_counts} />
      </div>
    </div>
  );
};

export default Dashboard;

