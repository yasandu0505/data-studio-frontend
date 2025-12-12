import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#06B6D4'];

const DonutChart = ({ majorCounts, minorCounts }) => {
  const [viewMode, setViewMode] = useState('major'); // 'major' or 'minor'

  // Prepare major counts data
  const majorData = Object.entries(majorCounts || {}).map(([name, value]) => ({
    name,
    value,
  }));

  // Prepare minor counts data (flatten nested structure)
  const minorData = Object.entries(minorCounts || {}).flatMap(([majorKey, minorCountsObj]) =>
    Object.entries(minorCountsObj).map(([name, value]) => ({
      name: `${name.charAt(0).toUpperCase() + name.slice(1)} (${majorKey})`,
      value,
    }))
  );

  const chartData = viewMode === 'major' ? majorData : minorData;

  const renderLabel = (entry) => {
    return `${entry.name}: ${entry.value.toLocaleString()}`;
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900"> Data Universe Distribution Chart</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('major')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'major'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Major View
          </button>
          <button
            onClick={() => setViewMode('minor')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'minor'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Minor View
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry) => `${entry.payload.name}: ${entry.payload.value.toLocaleString()}`}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DonutChart;

