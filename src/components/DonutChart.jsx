import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// Extended color palette with many distinct colors (all unique)
const BASE_COLORS = [
  '#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#06B6D4',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16', '#EAB308',
  '#A855F7', '#F43F5E', '#22C55E', '#0EA5E9', '#A21CAF', '#DC2626',
  '#16A34A', '#CA8A04', '#9333EA', '#BE185D', '#0891B2', '#059669',
  '#D97706', '#7C3AED', '#C026D3', '#EA580C', '#0284C7', '#0D9488'
];

// Generate unique colors for each item
const generateUniqueColors = (count) => {
  // Remove duplicates from base colors (safety check)
  const uniqueBaseColors = [...new Set(BASE_COLORS)];
  
  if (count <= uniqueBaseColors.length) {
    return uniqueBaseColors.slice(0, count);
  }
  
  // If we need more colors, generate them using HSL
  const colors = [...uniqueBaseColors];
  const hueStep = 360 / count;
  
  for (let i = uniqueBaseColors.length; i < count; i++) {
    const hue = (i * hueStep) % 360;
    const saturation = 60 + (i % 3) * 10; // Vary saturation between 60-80
    const lightness = 50 + (i % 2) * 5; // Vary lightness between 50-55
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }
  
  return colors;
};

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

  // Generate unique colors for the current data
  const colors = useMemo(() => generateUniqueColors(chartData.length), [chartData.length]);

  const renderLabel = (entry) => {
    return `${entry.name}: ${entry.value.toLocaleString()}`;
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">OpenGIN Distribution Chart</h2>
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
              <Cell key={`cell-${index}`} fill={colors[index]} />
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

