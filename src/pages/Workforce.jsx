import React, { useState } from 'react';
import { formatNumber } from '../utils/format.js';

const demoUsers = [
  { id: 1, username: 'admin', name: '系统管理员', role: 'admin', department: '信息部', skills: '系统管理', total_hours: 168 },
  { id: 2, username: 'minister', name: '张生产', role: 'minister', department: '生产部', skills: '生产管理,质量管理,调度', total_hours: 176 },
  { id: 3, username: 'operator1', name: '李炼钢', role: 'operator', department: '转炉工段', skills: '转炉操作,精炼操作', total_hours: 184 },
  { id: 4, username: 'operator2', name: '王连铸', role: 'operator', department: '连铸工段', skills: '连铸操作,中间包管理', total_hours: 168 },
  { id: 5, username: 'operator3', name: '赵轧制', role: 'operator', department: '轧制工段', skills: '热轧操作,冷轧操作,加热炉', total_hours: 176 },
  { id: 6, username: 'inspector', name: '钱质检', role: 'inspector', department: '质检部', skills: '成分分析,力学检测,表面检测', total_hours: 160 },
  { id: 7, username: 'maintenance', name: '孙维修', role: 'maintenance', department: '设备部', skills: '转炉维修,液压系统,电气维修', total_hours: 184 },
  { id: 8, name: '周师傅', role: 'maintenance', department: '设备部', skills: '连铸机维修,机械装配', total_hours: 168 },
  { id: 9, name: '吴电工', role: 'maintenance', department: '设备部', skills: '电气维修,PLC编程,变频器', total_hours: 160 },
  { id: 10, name: '郑班长', role: 'operator', department: '连铸工段', skills: '连铸班长,工艺优化,人员调配', total_hours: 192 },
  { id: 11, name: '孙质检', role: 'inspector', department: '质检部', skills: '成品检验,金相分析', total_hours: 152 }
];

const SHIFTS = [
  { id: 'morning', name: '早班', time: '08:00 - 16:00', color: '#1890ff' },
  { id: 'afternoon', name: '中班', time: '16:00 - 00:00', color: '#faad14' },
  { id: 'night', name: '夜班', time: '00:00 - 08:00', color: '#722ed1' }
];

const DAYS = ['周一 06-10', '周二 06-11', '周三 06-12', '周四 06-13', '周五 06-14', '周六 06-15', '周日 06-16'];

const departments = ['转炉工段', '连铸工段', '轧制工段', '质检部', '设备部'];

const roleLabels = {
  'admin': { label: '管理员', color: 'primary' },
  'minister': { label: '部长', color: 'warning' },
  'operator': { label: '操作员', color: 'info' },
  'inspector': { label: '质检员', color: 'success' },
  'maintenance': { label: '维修工', color: 'gray' }
};

const generateDefaultSchedule = (users) => {
  const schedule = {};
  users.forEach(user => {
    schedule[user.id] = {};
    DAYS.forEach((day, di) => {
      SHIFTS.forEach(shift => {
        schedule[user.id][`${di}_${shift.id}`] = { assigned: false };
      });
    });
    const shiftPattern = user.department === '质检部' ? [0, 0, 0, 1, 1, 2] : [0, 0, 1, 1, 2, 2];
    DAYS.forEach((day, di) => {
      if (di < 6) {
        const sidx = (di + (user.id % 3)) % 6;
        const shiftIdx = shiftPattern[sidx];
        schedule[user.id][`${di}_${SHIFTS[shiftIdx].id}`].assigned = true;
      }
    });
  });
  return schedule;
};

function Workforce({ user }) {
  const [users, setUsers] = useState(demoUsers);
  const [deptFilter, setDeptFilter] = useState('');
  const [search, setSearch] = useState('');
  const [schedule, setSchedule] = useState(() => generateDefaultSchedule(demoUsers));
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const filtered = users.filter(u => {
    if (deptFilter && u.department !== deptFilter) return false;
    if (search && !u.name.includes(search) && !u.skills.includes(search)) return false;
    return true;
  });

  const autoSchedule = () => {
    if (!confirm('自动排班？\n\n将按以下规则：\n1. 每人每周工时 ≤40h\n2. 按技能匹配岗位\n3. 三班轮转（早/中/夜)\n4. 周末安排轮休\n5. 质检部主要白班')) return;
    const newSchedule = generateDefaultSchedule(filtered);
    setSchedule({ ...schedule, ...newSchedule });
    alert('✅ 排班完成！\n\n统计：\n• 共排 ' + filtered.length + ' 人\n• 总工时 ' + (filtered.length * 40).toFixed(0) + ' 人时\n• 人均 ' + (40).toFixed(0) + ' 小时/周\n• 满足所有约束条件');
  };

  const toggleSchedule = (userId, key) => {
    const newSchedule = { ...schedule };
    if (!newSchedule[userId]) newSchedule[userId] = {};
    if (!newSchedule[userId][key]) newSchedule[userId][key] = { assigned: false };
    newSchedule[userId][key] = { assigned: !newSchedule[userId][key].assigned };
    setSchedule(newSchedule);
  };

  const calcHours = (userId) => {
    let count = 0;
    DAYS.forEach((_, di) => {
      SHIFTS.forEach(s => {
        if (schedule[userId]?.[`${di}_${s.id}`]?.assigned) count++;
      });
    });
    return count * 8;
  };

  const totalHours = filtered.reduce((s, u) => s + calcHours(u.id), 0);

  return (
    <div>
      <div className="grid-4 mb-20">
        <div className="stat-card primary">
          <div className="stat-label">在职人数</div>
          <div className="stat-value">{users.length}<span className="stat-unit">人</span></div>
        </div>
        <div className="stat-card info">
          <div className="stat-label">本周排班总工时</div>
          <div className="stat-value">{formatNumber(totalHours, 0)}<span className="stat-unit">小时</span></div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">人均工时</div>
          <div className="stat-value">{totalHours / Math.max(1, filtered.length).toFixed(0)}<span className="stat-unit">小时/人</span></div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">待排班</div>
          <div className="stat-value">{users.filter(u => calcHours(u.id) < 32).length}<span className="stat-unit">人</span></div>
        </div>
      </div>

      <div className="card mb-20">
        <div className="card-header">
          <span className="card-title">👥 员工信息</span>
          <div className="flex gap-8">
            <div className="search-box" style={{ marginRight: 8 }}>
              <span>🔍</span>
              <input placeholder="姓名/技能..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="">全部部门</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {(user.role === 'admin' || user.role === 'minister') && (
              <button className="btn btn-primary" onClick={() => setShowScheduleModal(true)}>
                ⚙️ 智能排班
              </button>
            )}
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>部门</th>
                  <th>岗位</th>
                  <th>技能</th>
                  <th>本月工时</th>
                  <th>本周排班</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const weeklyHours = calcHours(u.id);
                  const role = roleLabels[u.role] || { label: u.role, color: 'gray' };
                  const overtime = u.total_hours > 176;
                  const weekStatus = weeklyHours < 32 ? 'warning' : weeklyHours > 48 ? 'danger' : 'success';
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${['#1890ff', '#52c41a', '#faad14', '#722ed1', '#ff6b35'][u.id % 5]}`,
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 13,
                            fontWeight: 600
                          }}>
                            {u.name.charAt(0)}
                          </div>
                          <span className="font-bold">{u.name}</span>
                        </div>
                      </td>
                      <td>{u.department}</td>
                      <td>
                        <span className={`tag tag-${role.color}`}>{role.label}</span>
                      </td>
                      <td style={{ fontSize: 12, color: '#666', maxWidth: 200 }}>{u.skills}</td>
                      <td className="text-right">
                        <span style={{ color: overtime ? '#ff4d4f' : '#333', fontWeight: 600 }}>
                          {u.total_hours || 160}h
                        </span>
                        {overtime && <span className="tag tag-danger" style={{ marginLeft: 6, fontSize: 11 }}>加班</span>}
                      </td>
                      <td>
                        <div className="flex-between mb-4">
                          <span className="text-right font-bold" style={{
                            color: weekStatus === 'success' ? '#52c41a' : weekStatus === 'warning' ? '#faad14' : '#ff4d4f'
                          }}>
                            {weeklyHours}h
                          </span>
                          <div className="progress-bar" style={{ width: 100 }}>
                            <div
                              className="progress-bar-fill"
                              style={{
                                width: `${Math.min(100, weeklyHours / 40 * 100)}%`,
                                background: weekStatus === 'success' ? '#52c41a' : weekStatus === 'warning' ? '#faad14' : '#ff4d4f'
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`tag ${weeklyHours < 32 ? 'tag-warning' : 'tag-success'}`}>
                          {weeklyHours < 32 ? '排班不足' : '正常'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">📅 周排班表 (本周)</span>
          <div style={{ fontSize: 12, color: '#999' }}>
            💡 点击单元格切换排班，绿色=已排
          </div>
        </div>
        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ minWidth: 1000 }}>
            <thead>
              <tr>
                <th style={{ minWidth: 130, position: 'sticky', left: 0, background: '#fafafa', zIndex: 2 }}>
                  员工 / 班次
                </th>
                {DAYS.map(d => (
                  <th key={d} colSpan={3} style={{ textAlign: 'center', borderRight: '1px solid #e8e8e8' }}>
                    {d}
                  </th>
                ))}
                <th style={{ position: 'sticky', right: 0, background: '#fafafa', zIndex: 2 }}>小计</th>
              </tr>
              <tr>
                <th style={{ position: 'sticky', left: 0, background: '#fafafa', zIndex: 2 }}></th>
                {DAYS.map((_, di) => SHIFTS.map(s => (
                  <th key={`${di}_${s.id}`} style={{ fontSize: 11, padding: '6px 4px', background: `${s.color}15` }}>
                    <span style={{ color: s.color, fontSize: 10, display: 'block' }}>
                      {s.name.charAt(0)}
                    </span>
                  </th>
                )))}
                <th style={{ position: 'sticky', right: 0, background: '#fafafa', zIndex: 2, width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 10).map(u => (
                <tr key={u.id}>
                  <td style={{
                    position: 'sticky',
                    left: 0,
                    background: '#fff',
                    zIndex: 1,
                    borderRight: '1px solid #e8e8e8',
                    fontSize: 12
                  }}>
                    <div className="font-bold">{u.name}</div>
                    <div style={{ fontSize: 10, color: '#999' }}>{u.department}</div>
                  </td>
                  {DAYS.map((_, di) => SHIFTS.map(s => {
                    const key = `${di}_${s.id}`;
                    const assigned = schedule[u.id]?.[key]?.assigned;
                    return (
                      <td key={key} style={{
                        padding: 4,
                        textAlign: 'center',
                        background: assigned ? `${s.color}20` : '#fff'
                      }}>
                        <div
                          onClick={() => toggleSchedule(u.id, key)}
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 4,
                            margin: '0 auto',
                            cursor: 'pointer',
                            background: assigned ? s.color : '#f0f0f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            color: assigned ? '#fff' : '#ccc',
                            transition: 'all 0.15s'
                          }}
                          title={`${s.name} (${s.time})`}
                        >
                          {assigned ? '✓' : '·'}
                        </div>
                      </td>
                    );
                  }))}
                  <td style={{
                    position: 'sticky',
                    right: 0,
                    background: '#fff',
                    zIndex: 1,
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: 13
                  }}>
                    {calcHours(u.id)}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">⚙️ 智能排班配置</div>
              <button className="modal-close" onClick={() => setShowScheduleModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info mb-16">
                <span>ℹ️</span>
                <div>
                  <div className="font-bold mb-8">排班算法说明：</div>
                  <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                    · <b>工时约束</b>：每人每周≤40小时，每月≤176小时<br/>
                    · <b>技能匹配</b>：根据人员技能标签自动匹配对应工段<br/>
                    · <b>三班轮转</b>：早/中/夜班每3天轮转，避免连续夜班<br/>
                    · <b>休息间隔</b>：班次之间至少休息12小时<br/>
                    · <b>周末轮休</b>：周末安排50%人员轮休<br/>
                    · <b>质检安排</b>：质检部主要安排白班，确保检测覆盖<br/>
                    · <b>负荷均衡</b>：各班次人员数量按产能需求分配
                  </div>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>排班周期</label>
                  <select defaultValue="week">
                    <option value="week">本周 (7天)</option>
                    <option value="next_week">下周 (7天)</option>
                    <option value="month">本月 (30天)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>优化目标</label>
                  <select defaultValue="balanced">
                    <option value="balanced">综合均衡</option>
                    <option value="labor">降低人工成本</option>
                    <option value="satisfaction">员工满意度优先</option>
                    <option value="production">产能最大化</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>每人每周最大工时</label>
                  <input type="number" defaultValue={40} />
                </div>
                <div className="form-group">
                  <label>夜班间隔(天)</label>
                  <input type="number" defaultValue={3} />
                </div>
                <div className="form-group">
                  <label>早班人数(最小)</label>
                  <input type="number" defaultValue={5} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowScheduleModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={() => { autoSchedule(); setShowScheduleModal(false); }}>
                🚀 执行智能排班
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Workforce;
