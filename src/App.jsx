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

const STEEL_MENU = [
  { key: 'dashboard',  label: '生产总览',   icon: '📊', path: '/dashboard'  },
  { key: 'equipment',  label: '设备管理',   icon: '⚙️', path: '/equipment'  },
  { key: 'orders',     label: '销售订单',   icon: '📋', path: '/orders'     },
  { key: 'schedule',   label: '智能排程',   icon: '📅', path: '/schedule'   },
  { key: 'production', label: '生产跟踪',   icon: '🔥', path: '/production' },
  { key: 'quality',    label: '质量追溯',   icon: '✅', path: '/quality'    },
  { key: 'inventory',  label: '库存管理',   icon: '📦', path: '/inventory'  },
  { key: 'maintenance',label: '设备维保',   icon: '🔧', path: '/maintenance'},
  { key: 'workforce',  label: '人员排班',   icon: '👥', path: '/workforce'  },
  { key: 'statistics', label: '统计报表',   icon: '📈', path: '/statistics' },
  { key: 'heatmap',    label: '产线热力图', icon: '🗺️', path: '/heatmap'    }
];

const STEEL_ROLE_LABEL = {
  admin: '系统管理员',
  minister: '生产部长',
  operator: '操作员',
  inspector: '质检员',
  maintenance: '维修人员'
};

function SteelApp({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const currentMenu = STEEL_MENU.find(m => location.pathname === m.path) || STEEL_MENU[0];

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-logo">
          <h1 style={{ color: '#fff', margin: 0, fontSize: 20, letterSpacing: 1 }}>钢铁一体化</h1>
          <div className="subtitle" style={{ color: '#88a3c7', fontSize: 12, marginTop: 4 }}>生产调度系统</div>
        </div>
        <div className="sidebar-menu">
          {STEEL_MENU.map(item => (
            <div
              key={item.key}
              className={`menu-item ${currentMenu.key === item.key ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="icon">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: 20, left: 16, right: 16, padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 8, fontSize: 11, color: '#88a3c7', lineHeight: 1.8 }}>
          <div style={{ fontWeight: 600, color: '#fff', marginBottom: 4 }}>炼钢-连铸-轧制一体化</div>
          <div>版本 v1.0.0 · 生产环境</div>
          <div>© 2026 钢铁集团信息化部</div>
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
            <div className="notification-icon" title="质量报警/库存预警/调整申请通知">
              🔔
              <span className="notification-badge">3</span>
            </div>
            <div className="user-info" onClick={() => setShowUserMenu(!showUserMenu)}>
              <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #1890ff, #722ed1)', color: '#fff' }}>
                {user.name.charAt(0)}
              </div>
              <div className="user-details">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{STEEL_ROLE_LABEL[user.role] || user.role}</span>
              </div>
              <span style={{ color: '#999', fontSize: 12 }}>▼</span>
              {showUserMenu && (
                <div className="dropdown-menu" style={{ right: 20, top: 60 }}>
                  <div className="dropdown-item">个人信息</div>
                  <div className="dropdown-item">修改密码</div>
                  <div className="dropdown-item" style={{ color: '#ff4d4f' }} onClick={() => {
                    onLogout();
                    setShowUserMenu(false);
                  }}>
                    退出登录
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="content-area">
          <Routes>
            <Route path="/dashboard"  element={<Dashboard  user={user} />} />
            <Route path="/equipment"  element={<Equipment  user={user} />} />
            <Route path="/orders"     element={<SalesOrders user={user} />} />
            <Route path="/schedule"   element={<Schedule   user={user} />} />
            <Route path="/production" element={<Production user={user} />} />
            <Route path="/quality"    element={<Quality    user={user} />} />
            <Route path="/inventory"  element={<Inventory  user={user} />} />
            <Route path="/maintenance"element={<Maintenance user={user} />} />
            <Route path="/workforce"  element={<Workforce  user={user} />} />
            <Route path="/statistics" element={<Statistics user={user} />} />
            <Route path="/heatmap"    element={<HeatMap    user={user} />} />
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
    try {
      const saved = localStorage.getItem('steel_prod_user');
      if (saved) setUser(JSON.parse(saved));
    } catch (e) { console.error('读取用户失败:', e); }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('steel_prod_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('steel_prod_user');
  };

  if (loading) return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e3a5f', color: '#fff', fontSize: 18 }}>
      🔄 钢铁生产调度系统加载中...
    </div>
  );

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/*"    element={<SteelApp user={user} onLogout={handleLogout} />} />
    </Routes>
  );
}

export default App;
