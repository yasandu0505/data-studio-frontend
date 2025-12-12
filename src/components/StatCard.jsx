const StatCard = ({ title, value, change, icon, colorTheme = 'blue', onClick }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'bg-blue-500',
      text: 'text-blue-600',
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'bg-purple-500',
      text: 'text-purple-600',
    },
    orange: {
      bg: 'bg-orange-50',
      icon: 'bg-orange-500',
      text: 'text-orange-600',
    },
    green: {
      bg: 'bg-green-50',
      icon: 'bg-green-500',
      text: 'text-green-600',
    },
  };

  const theme = colorClasses[colorTheme] || colorClasses.blue;

  return (
    <div 
      className={`stat-card ${theme.bg} rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className="stat-icon flex items-center justify-center text-xl">
          {icon}
        </div>
      </div>
      <div className="mb-2">
        <p className="text-3xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      </div>
      {change && (
        <p className={`text-sm font-medium ${change.includes('+') ? 'text-green-600' : 'text-orange-600'}`}>
          {change}
        </p>
      )}
    </div>
  );
};

export default StatCard;

