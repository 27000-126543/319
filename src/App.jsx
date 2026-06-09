import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Equipment from './pages/Equipment.jsx';
import SalesOrders from './pages/SalesOrders.jsx';
import Schedule from './pages/Schedule.jsx';
import Production from './pages/Production.jsx';
import Quality from './pages/Quality.jsx';
import Inventory from './pages/Inventory.jsx';
import Maintenance from './pages/Maintenance.jsx';
import Workforce from './pages/Workforce.jsx';
import Statistics from './pages/Statistics.jsx';
import HeatMap from './pages/HeatMap.jsx';

const MENU_ITEMS = [
  { key: 'dashboard', label: '生产总览', icon: '📊', path: '/dashboard' },
  { key: 'equipment', label: '设备管理', icon: '⚙️', path: '/equipment' },
  { key: 'orders', label: '销售订单', icon: '📋', path: '/orders' },
  { key: 'schedule', label: '智能排程', icon: '📅', path: '/schedule' },
  { key: 'production', label: '生产跟踪', icon: '🔥', path: '/production' },
  { key: 'quality', label: '质量追溯', icon: '✅', path: '/quality' },
  { key: 'inventory', label: '库存管理', icon: '📦', path: '/inventory' },
  { key: 'maintenance', label: '设备维保', icon: '🔧', path: '/maintenance' },
  { key: 'workforce', label: '人员排班', icon: '👥', path: '/workforce' },
  { key: 'statistics', label: '统计报表', icon: '📈', path: '/statistics' },
  { key: 'heatmap', label: '产线热力图', icon: '🗺️', path: '/heatmap' }
];

function AppContent({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const currentMenu = MENU_ITEMS.find(m => location.pathname.startsWith(m.path)) || MENU_ITEMS[0];

  const handleMenuClick = (item) => {
    navigate(item.path);
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-logo">
          <h1>钢铁一体化</h1>
          <div className="subtitle">生产调度系统</div>
        </div>
        <div className="sidebar-menu">
          {MENU_ITEMS.map(item => (
            <div
              key={item.key}
              className={`menu-item ${currentMenu.key === item.key ? 'active' : ''}`}
              onClick={() => handleMenuClick(item)}
            >
              <span className="icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="header-left">
            <div>
              <div className="page-title">{currentMenu.label}</div>
              <div className="breadcrumb">首页 / {currentMenu.label}</div>
            </div>
          </div>
          <div className="header-right">
            <div className="notification-icon">
              🔔
              <span className="notification-badge">3</span>
            </div>
            <div
              className="user-info"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="user-avatar">{user.name.charAt(0)}</div>
              <div className="user-details">
                <span className="user-name">{user.name}</span>
                <span className="user-role">
                  {user.role === 'admin' ? '系统管理员' :
                   user.role === 'minister' ? '生产部长' :
                   user.role === 'operator' ? '操作员' :
                   user.role === 'inspector' ? '质检员' :
                   user.role === 'maintenance' ? '维修人员' : user.role}
                </span>
              </div>
              <span>▼</span>
              {showUserMenu && (
                <div className="dropdown-menu" style={{ right: 20, top: 60 }}>
                  <div className="dropdown-item">个人信息</div>
                  <div className="dropdown-item">修改密码</div>
                  <div className="dropdown-item" style={{ color: '#ff4d4f' }} onClick={onLogout}>
                    退出登录
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="content-area">
          <Routes>
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/equipment" element={<Equipment user={user} />} />
            <Route path="/orders" element={<SalesOrders user={user} />} />
            <Route path="/schedule" element={<Schedule user={user} />} />
            <Route path="/production" element={<Production user={user} />} />
            <Route path="/quality" element={<Quality user={user} />} />
            <Route path="/inventory" element={<Inventory user={user} />} />
            <Route path="/maintenance" element={<Maintenance user={user} />} />
            <Route path="/workforce" element={<Workforce user={user} />} />
            <Route path="/statistics" element={<Statistics user={user} />} />
            <Route path="/heatmap" element={<HeatMap user={user} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('steel_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('steel_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('steel_user');
  };

  if (loading) {
    return (
      <div className="login-container">
        <div style={{ color: '#fff', fontSize: 18 }}>加载中...</div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/*" element={<AppContent user={user} onLogout={handleLogout} />} />
    </Routes>
  );
}

export default App;
