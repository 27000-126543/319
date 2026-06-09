import React, { useState, useEffect } from 'react';
import { formatDateTime, formatNumber, getEqTypeLabel } from '../utils/format.js';

const demoOrders = [
  {
    id: 1,
    order_no: 'MO-2024-0609-001',
    equipment_id: 3,
    equipment_name: '3号转炉',
    equipment_type: 'converter',
    type: '预防性维保',
    status: '执行中',
    reason: '累计炉次达到维保间隔(980炉/60炉次)',
    assigned_team: '转炉维修一班',
    assigned_to: 7,
    spare_parts: '转炉氧枪1支',
    started_at: '2024-06-09 08:00',
    completed_at: '',
    estimated_hours: 8,
    created_at: '2024-06-09 08:00'
  },
  {
    id: 2,
    order_no: 'MO-2024-0608-003',
    equipment_id: 8,
    equipment_name: '1号热轧机',
    equipment_type: 'rolling_mill',
    status: '执行中',
    reason: '定期润滑系统检查',
    type: '定期维护',
    assigned_team: '轧制维修二班',
    spare_parts: '润滑油200L',
    estimated_hours: 4,
    created_at: '2024-06-08 14:00'
  },
  {
    id: 3,
    order_no: 'MO-2024-0609-002',
    equipment_id: 6,
    equipment_name: '1号连铸机',
    equipment_type: 'caster',
    status: '待分配',
    type: '故障维修',
    reason: '液压系统压力异常',
    created_at: '2024-06-09 10:20'
  },
  {
    id: 4,
    order_no: 'MO-2024-0609-004',
    equipment_id: 4,
    equipment_name: 'RH精炼炉',
    equipment_type: 'refinery',
    type: '预防性维保',
    status: '待分配',
    reason: '距上次维保70炉/80炉间隔',
    created_at: '2024-06-09 09:00',
    estimated_hours: 6
  },
  {
    id: 5,
    order_no: 'MO-2024-0607-002',
    equipment_id: 2,
    equipment_name: '2号转炉',
    equipment_type: 'converter',
    status: '已完成',
    reason: '更换出钢口',
    type: '故障维修',
    assigned_team: '转炉维修一班',
    completed_at: '2024-06-07 18:30',
    created_at: '2024-06-07 08:00'
  }
];

const MAINTENANCE_TYPES = [
  { value: '预防性维保', color: '#1890ff' },
  { value: '定期维护', color: '#52c41a' },
  { value: '故障维修', color: '#ff4d4f' },
  { value: '升级改造', color: '#722ed1' }
];

const STATUS_COLORS = {
  '待分配': 'warning',
  '已分配': 'info',
  '执行中': 'primary',
  '已完成': 'success',
  '已取消': 'danger'
};

const TEAMS = [
  { id: 1, name: '转炉维修一班', members: ['孙维修', '周师傅', '吴电工'], skill: '转炉,精炼炉' },
  { id: 2, name: '连铸维修二班', members: ['郑班长', '王液压'], skill: '连铸机,中间包' },
  { id: 3, name: '轧制维修三班', members: ['李机械', '赵液压', '张电气'], skill: '热轧机,冷轧机,液压系统' },
  { id: 4, name: '电气维修组', members: ['钱电气', '孙自动化'], skill: '电气,自动化系统' }
];

function Maintenance({ user }) {
  const [list, setList] = useState(demoOrders);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(null);
  const [assignForm, setAssignForm] = useState({ team_id: '', parts: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ equipment_id: '', type: '预防性维保', reason: '' });

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  const filtered = list.filter(o => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (typeFilter && o.type !== typeFilter) return false;
    return true;
  });

  const pendingCount = list.filter(o => o.status === '待分配').length;
  const executingCount = list.filter(o => o.status === '执行中').length;
  const todayCount = list.filter(o => o.created_at && o.created_at.startsWith('2024-06-09')).length;

  const handleAutoGenerate = () => {
    if (!confirm('自动根据设备运行炉次生成预防性维保工单？\n\n将检查所有设备的累计运行炉次与维保间隔对比，自动为达到或超过80%的设备生成工单。')) return;

    const newOrders = [
      {
        id: list.length + 1,
        order_no: `MO-2024-0609-00${list.length + 3}`,
        equipment_id: 10,
        equipment_name: '1号冷轧机',
        equipment_type: 'rolling_mill_cold',
        type: '预防性维保',
        reason: '累计运行220炉/间隔250炉',
        status: '待分配',
        created_at: formatDateTime(new Date()),
        estimated_hours: 8
      }
    ];
    setList([...list, ...newOrders]);
    alert(`✅ 已自动生成 ${newOrders.length} 个维保工单！\n\n• 1号冷轧机：预防性维保 (累计运行220炉次)`);
  };

  const handleAssign = () => {
    if (!assignForm.team_id) { alert('请选择班组'); return; }
    setList(list.map(o => o.id === showAssignModal.id ? {
      ...o,
      status: '已分配',
      assigned_team: TEAMS.find(t => t.id === Number(assignForm.team_id)).name,
      assigned_to: 7
    } : o));
    setShowAssignModal(null);
  };

  const handleComplete = (id) => {
    if (!confirm('确定标记此工单已完成？')) return;
    setList(list.map(o => o.id === id ? { ...o, status: '已完成', completed_at: formatDateTime(new Date()) } : o));
    alert('✅ 维保完成！系统已：\n1. 更新设备状态\n2. 扣减备件库存\n3. 统计人员工时\n4. 生成维保报告');
  };

  return (
    <div>
      <div className="grid-4 mb-20">
        <div className="stat-card primary">
          <div className="stat-label">本月工单</div>
          <div className="stat-value">{list.length}<span className="stat-unit">单</span></div>
          <div className="stat-change" style={{ color: '#999' }}>今日新增 {todayCount} 单</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">待分配</div>
          <div className="stat-value">{pendingCount}<span className="stat-unit">单</span></div>
          <div className="stat-change down">需紧急分配</div>
        </div>
        <div className="stat-card info">
          <div className="stat-label">执行中</div>
          <div className="stat-value">{executingCount}<span className="stat-unit">单</span></div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">完成率</div>
          <div className="stat-value">{((list.filter(o => o.status === '已完成').length / list.length) * 100).toFixed(0)}<span className="stat-unit">%</span></div>
          <div className="stat-change up">↑ 较上月</div>
        </div>
      </div>

      <div className="card mb-20">
        <div className="card-header">
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">全部状态</option>
              <option>待分配</option>
              <option>已分配</option>
              <option>执行中</option>
              <option>已完成</option>
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">全部类型</option>
              {MAINTENANCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.value}</option>)}
            </select>
          </div>
          <div className="flex gap-8">
            {(user.role === 'admin' || user.role === 'maintenance' || user.role === 'minister') && (
              <>
                <button className="btn btn-warning" onClick={handleAutoGenerate}>
                  🤖 自动生成
                </button>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                  ➕ 新建工单
                </button>
              </>
            )}
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>工单号</th>
                  <th>设备</th>
                  <th>类型</th>
                  <th>原因</th>
                  <th>负责班组</th>
                  <th>备件</th>
                  <th>状态</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="9" className="text-center" style={{ padding: 40 }}>加载中...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="9"><div className="empty-state">🔧 暂无工单</div></td></tr>
                ) : (
                  filtered.map(order => {
                    const typeInfo = MAINTENANCE_TYPES.find(t => t.value === order.type);
                    return (
                      <tr key={order.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{order.order_no}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600 }}>{order.equipment_name}</span>
                            <span style={{ fontSize: 11, color: '#999' }}>
                              {getEqTypeLabel(order.equipment_type)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span style={{ color: typeInfo?.color, fontWeight: 500 }}>{order.type}</span>
                        </td>
                        <td style={{ fontSize: 12, color: '#666', maxWidth: 180 }}>{order.reason}</td>
                        <td>{order.assigned_team || <span style={{ color: '#999' }}>未分配</span>}</td>
                        <td style={{ fontSize: 12, color: '#666' }}>{order.spare_parts || '-'}</td>
                        <td>
                          <span className={`tag tag-${STATUS_COLORS[order.status] || 'gray'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td style={{ fontSize: 12 }}>{formatDateTime(order.created_at)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {order.status === '待分配' && (user.role === 'admin' || user.role === 'minister' || user.role === 'maintenance') && (
                              <button className="btn btn-sm btn-primary" onClick={() => {
                                setShowAssignModal(order);
                                setAssignForm({ team_id: '', parts: '' });
                              }}>
                                分配
                              </button>
                            )}
                            {order.status === '执行中' && user.role === 'maintenance' && (
                              <button className="btn btn-sm btn-success" onClick={() => handleComplete(order.id)}>
                                完成
                              </button>
                            )}
                            <button className="btn btn-sm">详情</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">👥 维修班组概览</span>
        </div>
        <div className="card-body">
          <div className="grid-3">
            {TEAMS.map(team => {
              const teamOrders = list.filter(o => o.assigned_team === team.name && o.status === '执行中');
              return (
                <div key={team.id} className="card">
                  <div className="card-header" style={{ padding: '10px 14px' }}>
                    <span className="font-bold">{team.name}</span>
                    <span className="tag tag-info">{team.members.length}人</span>
                  </div>
                  <div className="card-body" style={{ padding: 14 }}>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                      <b>技能：</b>{team.skill}
                    </div>
                    <div style={{ fontSize: 12 }}>
                      <b style={{ display: 'block', marginBottom: 4 }}>成员：</b>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {team.members.map((m, i) => (
                          <span key={i} className="tag tag-gray" style={{ fontSize: 11 }}>{m}</span>
                        ))}
                      </div>
                    </div>
                    <div className="divider" />
                    <div style={{ fontSize: 12 }}>
                      <div className="flex-between mb-4">
                        <span style={{ color: '#666' }}>当前任务：</span>
                        <b>{teamOrders.length} 个进行中</b>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">👥 分配维修工单 - {showAssignModal?.equipment_name}</div>
              <button className="modal-close" onClick={() => setShowAssignModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info mb-16">
                <span>ℹ️</span>
                <div>
                  <b>工单：</b>{showAssignModal?.order_no}<br />
                  <b>类型：</b>{showAssignModal?.type}<br />
                  <b>原因：</b>{showAssignModal?.reason}
                </div>
              </div>

              <div className="form-group mb-16">
                <label>选择维修班组<span className="required">*</span></label>
                <select value={assignForm.team_id} onChange={e => setAssignForm({ ...assignForm, team_id: e.target.value })}>
                  <option value="">-- 请选择 --</option>
                  {TEAMS.map(t => (
                    <option key={t.id} value={t.id}>{t.name} (技能: {t.skill})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>所需备件</label>
                <textarea
                  value={assignForm.parts}
                  onChange={e => setAssignForm({ ...assignForm, parts: e.target.value })}
                  placeholder="请输入所需备件，多个用|分隔"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowAssignModal(null)}>取消</button>
              <button className="btn btn-primary" onClick={handleAssign}>确认分配</button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">➕ 新建维保工单</div>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>选择设备<span className="required">*</span></label>
                  <select value={createForm.equipment_id} onChange={e => setCreateForm({ ...createForm, equipment_id: e.target.value })}>
                    <option value="">-- 请选择 --</option>
                    {[
                      { id: 1, name: '1号转炉' },
                      { id: 2, name: '2号转炉' },
                      { id: 4, name: 'RH精炼炉' },
                      { id: 6, name: '1号连铸机' },
                      { id: 8, name: '1号热轧机' }
                    ].map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>维保类型</label>
                  <select value={createForm.type} onChange={e => setCreateForm({ ...createForm, type: e.target.value })}>
                    {MAINTENANCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.value}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>维保原因</label>
                <textarea value={createForm.reason} onChange={e => setCreateForm({ ...createForm, reason: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowCreateModal(false)}>取消</button>
              <button className="btn btn-primary">创建工单</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Maintenance;
