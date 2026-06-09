import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { query } from '../utils/api.js';

const DEMO_ACCOUNTS = [
  { username: 'admin',       password: 'admin123', name: '系统管理员', role: 'admin'       },
  { username: 'minister',    password: 'min123',   name: '李部长',     role: 'minister'    },
  { username: 'operator1',   password: 'op123',    name: '张师傅',     role: 'operator'    },
  { username: 'operator2',   password: 'op123',    name: '王师傅',     role: 'operator'    },
  { username: 'inspector',   password: 'ins123',   name: '赵质检',     role: 'inspector'   },
  { username: 'maintenance', password: 'mnt123',   name: '钱维修',     role: 'maintenance' }
];

const STEEL_GRADES = [
  'Q235B', 'Q345B', 'DC01', 'DC04', 'SPHC', 'SPCC',
  'AH32', 'AH36', 'HC340LA', 'HC420LA', 'Q550D', 'Q690D'
];

const ROLE_DESC = {
  admin:       '完整系统权限，用户/设备/排程/质检/库存全部管理',
  minister:    '生产排程审批，报表查看，炉次质量解锁',
  operator:    '确认排程、工艺参数上报、工序完成提交',
  inspector:   '录入质检数据，缺陷记录，质量锁定/解锁申请',
  maintenance: '维保工单接收，备件领用，故障处理记录'
};

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const fillDemo = (acc) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setError('');
  };

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }
    setLoading(true);
    setError('');

    setTimeout(() => {
      let userData = null;
      try {
        const users = query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
        if (users && users.length > 0) {
          const u = users[0];
          userData = { id: u.id, username: u.username, name: u.name, role: u.role };
        } else {
          const demo = DEMO_ACCOUNTS.find(a => a.username === username && a.password === password);
          if (demo) userData = { id: Date.now(), username: demo.username, name: demo.name, role: demo.role };
        }
      } catch (e) {
        const demo = DEMO_ACCOUNTS.find(a => a.username === username && a.password === password);
        if (demo) userData = { id: Date.now(), username: demo.username, name: demo.name, role: demo.role };
      }

      if (userData) {
        onLogin(userData);
        navigate('/dashboard', { replace: true });
      } else {
        setError('用户名或密码错误，请使用下方演示账号登录');
      }
      setLoading(false);
    }, 500);
  };

  const handleKey = (e) => { if (e.key === 'Enter') handleLogin(); };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a1a3a 0%, #1e3a6f 40%, #2c5282 70%, #1a365d 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div style={{
        width: '100%',
        maxWidth: 1100,
        background: 'rgba(255,255,255,0.98)',
        borderRadius: 16,
        boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        display: 'flex'
      }}>
        {/* 左侧钢铁品牌区 */}
        <div style={{
          flex: '1 1 500px',
          background: 'linear-gradient(160deg, #1e3a6f 0%, #0a1a3a 100%)',
          padding: '60px 48px',
          color: '#fff',
          position: 'relative'
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,153,51,0.12), transparent 70%)' }} />
          <div style={{ position: 'absolute', bottom: -80, left: -80, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(102,204,255,0.12), transparent 70%)' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: 'linear-gradient(135deg, #ff9933, #ff5500)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, marginRight: 16, boxShadow: '0 8px 24px rgba(255,153,51,0.4)'
              }}>🏭</div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 1 }}>钢铁一体化</div>
                <div style={{ fontSize: 13, color: '#88a3c7', marginTop: 4 }}>生产调度与质量追溯平台</div>
              </div>
            </div>

            <h2 style={{ fontSize: 28, fontWeight: 600, marginBottom: 12, lineHeight: 1.3 }}>
              炼钢 · 连铸 · 轧制
              <br />
              一体化智能生产调度系统
            </h2>
            <p style={{ color: '#a8c0dd', fontSize: 14, lineHeight: 1.8, marginBottom: 36 }}>
              覆盖从转炉冶炼、LF/RH精炼、板坯连铸、加热炉热轧、酸洗冷轧到成品出库全流程。
              支持多目标智能排程、实时工艺参数监控、全链路质量追溯与三级库存预警。
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 36 }}>
              {[
                ['🔥', '转炉-连铸时序约束', '自动保证中间包寿命8-12炉、钢种切换时间30-45分钟'],
                ['📊', '多维度KPI统计', '产量、合格率、能耗、设备利用率、成材率实时分析'],
                ['✅', '全链路质量追溯', '参数超标自动锁定炉次，支持6工序反向溯源'],
                ['📦', '智能库存预警', '原料消耗自动扣减，低于安全库存触发三级预警']
              ].map(([icon, title, desc], i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, padding: 16
                }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 11, color: '#88a3c7', lineHeight: 1.6 }}>{desc}</div>
                </div>
              ))}
            </div>

            <div style={{
              padding: '16px 20px',
              background: 'rgba(255,153,51,0.12)',
              borderLeft: '4px solid #ff9933',
              borderRadius: 8,
              fontSize: 12,
              color: '#ffcc80'
            }}>
              <strong style={{ color: '#fff' }}>支持钢种：</strong>{STEEL_GRADES.join('  ·  ')}
            </div>
          </div>
        </div>

        {/* 右侧登录表单 */}
        <div style={{ flex: '1 1 480px', padding: '60px 48px' }}>
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0a1a3a', margin: 0, marginBottom: 8 }}>账号登录</h1>
            <div style={{ color: '#6b7280', fontSize: 13 }}>请输入您的钢铁生产调度系统账号</div>
          </div>

          {error && (
            <div style={{
              background: '#fff2f0', border: '1px solid #ffccc7', color: '#cf1322',
              padding: '10px 14px', borderRadius: 6, marginBottom: 20, fontSize: 13
            }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#374151', fontSize: 13, fontWeight: 500 }}>用户名</label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={handleKey}
              placeholder="请输入用户名"
              style={{
                width: '100%', padding: '12px 14px', fontSize: 14, border: '1px solid #d1d5db',
                borderRadius: 8, boxSizing: 'border-box', outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, color: '#374151', fontSize: 13, fontWeight: 500 }}>密码</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKey}
              placeholder="请输入密码"
              style={{
                width: '100%', padding: '12px 14px', fontSize: 14, border: '1px solid #d1d5db',
                borderRadius: 8, boxSizing: 'border-box', outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, fontSize: 13 }}>
            <label style={{ display: 'flex', alignItems: 'center', color: '#4b5563', cursor: 'pointer' }}>
              <input
                type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                style={{ marginRight: 6 }}
              />
              记住登录状态（7天）
            </label>
            <a style={{ color: '#2563eb', cursor: 'pointer' }}>忘记密码？</a>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%', padding: '14px', fontSize: 15, fontWeight: 600, color: '#fff',
              background: loading ? '#94a3b8' : 'linear-gradient(135deg, #1e40af, #1e3a8a)',
              border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(30,64,175,0.35)',
              transition: 'transform 0.1s', letterSpacing: 2
            }}
            onMouseDown={e => !loading && (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {loading ? '🔄 登录验证中...' : '登 录 钢 铁 生 产 调 度 系 统'}
          </button>

          <div style={{ marginTop: 28 }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12, display: 'flex', alignItems: 'center' }}>
              <span style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
              <span style={{ padding: '0 12px' }}>演示账号快速登录（建议收藏）</span>
              <span style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {DEMO_ACCOUNTS.map(acc => (
                <div
                  key={acc.username}
                  onClick={() => fillDemo(acc)}
                  style={{
                    padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8,
                    cursor: 'pointer', fontSize: 12, transition: 'all 0.15s',
                    background: username === acc.username ? '#eff6ff' : '#fff'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = username === acc.username ? '#eff6ff' : '#fff'; }}
                >
                  <div style={{ fontWeight: 600, color: '#1e40af', marginBottom: 2 }}>{acc.name}</div>
                  <div style={{ color: '#6b7280', fontSize: 11 }}>{acc.username} / {acc.password}</div>
                  <div style={{ color: '#94a3b8', fontSize: 10, marginTop: 3, lineHeight: 1.4 }}>
                    {ROLE_DESC[acc.role]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
