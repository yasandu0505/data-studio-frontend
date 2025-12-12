import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/entities', label: 'Entities', icon: '🗄️' },
    { path: '/relationships', label: 'Relationships', icon: '🌐' },
    { path: '/metadata', label: 'Metadata', icon: '🏷️' },
  ];

  const getIcon = (icon) => {
    return <span className="text-xl">{icon}</span>;
  };

  return (
    <div className="sidebar bg-white border-r border-gray-200 w-64 h-screen fixed left-0 top-0 flex flex-col">
      <div className="sidebar-header p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            DV
          </div>
          <span className="text-xl font-semibold text-gray-900">DataVerse</span>
        </div>
      </div>
      <nav className="sidebar-nav flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {getIcon(item.icon)}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;

