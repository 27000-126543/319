import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { query } from '../utils/api.js';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError('请输入用户名和密码');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const users = await query(
        'SELECT * FROM users WHERE username = ? AND password = ?',
        [form.username, form.password]
      );

      if (users && users.length > 0) {
        const user = users[0];
        onLogin(user);
        navigate('/dashboard');
      } else {
        const demoUsers = [
          { id: 1, username: 'admin', password: 'admin123', name: '系统管理员', role: 'admin', department: '信息部' },
          { id: 2, username: 'minister', password: 'min123', name: '张生产', role: 'minister', department: '生产部' },
          { id: 3, username: 'operator1', password: 'op123', name: '李炼钢', role: 'operator', department: '转炉工段' },
          { id: 4, username: 'operator2', password: 'op456', name: '王连铸', role: 'operator', department: '连铸工段' },
          { id: 5, username: 'operator3', password: 'op789', name: '赵轧制', role: 'operator', department: '轧制工段' },
          { id: 6, username: 'inspector', password: 'ins123', name: '钱质检', role: 'inspector', department: '质检部' },
          { id: 7, username: 'maintenance', password: 'mt123', name: '孙维修', role: 'maintenance', department: '设备部' }
        ];
        const matched = demoUsers.find(u => u.username === form.username && u.password === form.password);
        if (matched) {
          onLogin(matched);
          navigate('/dashboard');
        } else {
          setError('用户名或密码错误');
        }
      }
    } catch (err) {
      const demoUsers = [
        { id: 1, username: 'admin', password: 'admin123', name: '系统管理员', role: 'admin', department: '信息部' },
        { id: 2, username: 'minister', password: 'min123', name: '张生产', role: 'minister', department: '生产部' },
        { id: 3, username: 'operator1', password: 'op123', name: '李炼钢', role: 'operator', department: '转炉工段' },
        { id: 4, username: 'operator2', password: 'op456', name: '王连铸', role: 'operator', department: '连铸工段' }
      ];
      const matched = demoUsers.find(u => u.username === form.username && u.password === form.password);
      if (matched) {
        onLogin(matched);
        navigate('/dashboard');
      } else {
        setError('用户名或密码错误');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (username, password) => {
    setForm({ username, password });
    setError('');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo">
          <div className="login-logo-icon">⚙️</div>
          <div className="login-title">钢铁生产调度系统</div>
          <div className="login-subtitle">炼钢-连铸-轧制一体化</div>
        </div>

        {error && (
          <div className="alert alert-danger mb-16">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="请输入用户名"
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-lg w-100"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        <div className="login-tips">
          <div className="mb-8 font-bold">🎯 演示账号（点击快速填充）：</div>
          <div className="grid-2" style={{ fontSize: 11, gap: 6 }}>
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => fillDemo('admin', 'admin123')}>
              admin/admin123 (管理员)
            </span>
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => fillDemo('minister', 'min123')}>
              minister/min123 (部长)
            </span>
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => fillDemo('operator1', 'op123')}>
              operator1/op123 (转炉)
            </span>
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => fillDemo('inspector', 'ins123')}>
              inspector/ins123 (质检)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
