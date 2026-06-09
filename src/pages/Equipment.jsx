import React, { useState, useEffect } from 'react';
import { query, insert, update, remove } from '../utils/api.js';
import { getEqTypeLabel, getEqTypeColor, formatNumber } from '../utils/format.js';

const EQ_TYPES = [
  { value: 'converter', label: '转炉' },
  { value: 'refinery', label: '精炼炉' },
  { value: 'caster', label: '连铸机' },
  { value: 'rolling_mill', label: '热轧机' },
  { value: 'rolling_mill_cold', label: '冷轧机' }
];

const STATUSES = [
  { value: '空闲', color: '#52c41a' },
  { value: '运行中', color: '#1890ff' },
  { value: '维护中', color: '#faad14' },
  { value: '故障', color: '#ff4d4f' }
];

const demoEquipments = [
  { id: 1, name: '1号转炉', type: 'converter', code: 'LD-001', status: '运行中', capacity: 120, efficiency: 0.95, total_heats: 1236, maintenance_interval: 50, last_maintenance_heats: 1186, specification: '120吨顶底复吹转炉', created_at: '2024-01-15 09:00:00' },
  { id: 2, name: '2号转炉', type: 'converter', code: 'LD-002', status: '运行中', capacity: 120, efficiency: 0.93, total_heats: 1158, maintenance_interval: 50, last_maintenance_heats: 1110, specification: '120吨顶底复吹转炉', created_at: '2024-01-15 09:00:00' },
  { id: 3, name: '3号转炉', type: 'converter', code: 'LD-003', status: '维护中', capacity: 150, efficiency: 0.97, total_heats: 980, maintenance_interval: 60, last_maintenance_heats: 980, specification: '150吨顶底复吹转炉', created_at: '2024-02-20 10:30:00' },
  { id: 4, name: 'RH精炼炉', type: 'refinery', code: 'RH-001', status: '运行中', capacity: 120, efficiency: 0.98, total_heats: 890, maintenance_interval: 80, last_maintenance_heats: 820, specification: 'RH真空精炼炉', created_at: '2024-01-15 09:00:00' },
  { id: 5, name: 'LF精炼炉', type: 'refinery', code: 'LF-001', status: '空闲', capacity: 120, efficiency: 0.96, total_heats: 920, maintenance_interval: 80, last_maintenance_heats: 850, specification: 'LF钢包精炼炉', created_at: '2024-01-15 09:00:00' },
  { id: 6, name: '1号连铸机', type: 'caster', code: 'CC-001', status: '运行中', capacity: 0, efficiency: 0.94, total_heats: 2100, maintenance_interval: 100, last_maintenance_heats: 2010, specification: '板坯连铸机-双流', created_at: '2024-01-15 09:00:00' },
  { id: 7, name: '2号连铸机', type: 'caster', code: 'CC-002', status: '运行中', capacity: 0, efficiency: 0.92, total_heats: 1950, maintenance_interval: 100, last_maintenance_heats: 1870, specification: '方坯连铸机-八流', created_at: '2024-03-10 14:00:00' },
  { id: 8, name: '1号热轧机', type: 'rolling_mill', code: 'HR-001', status: '运行中', capacity: 0, efficiency: 0.95, total_heats: 1850, maintenance_interval: 200, last_maintenance_heats: 1660, specification: '1780mm热连轧机组', created_at: '2024-01-15 09:00:00' },
  { id: 9, name: '2号热轧机', type: 'rolling_mill', code: 'HR-002', status: '空闲', capacity: 0, efficiency: 0.93, total_heats: 1720, maintenance_interval: 200, last_maintenance_heats: 1530, specification: '2250mm热连轧机组', created_at: '2024-04-05 08:00:00' },
  { id: 10, name: '1号冷轧机', type: 'rolling_mill_cold', code: 'CR-001', status: '运行中', capacity: 0, efficiency: 0.94, total_heats: 1480, maintenance_interval: 250, last_maintenance_heats: 1260, specification: '1420mm冷连轧机组', created_at: '2024-02-01 11:00:00' },
  { id: 11, name: '2号冷轧机', type: 'rolling_mill_cold', code: 'CR-002', status: '运行中', capacity: 0, efficiency: 0.91, total_heats: 1350, maintenance_interval: 250, last_maintenance_heats: 1130, specification: '1550mm冷连轧机组', created_at: '2024-02-01 11:00:00' }
];

function Equipment({ user }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', type: 'converter', code: '', status: '空闲',
    capacity: 120, efficiency: 0.95, maintenance_interval: 50, specification: ''
  });

  useEffect(() => {
    loadList();
  }, []);

  const loadList = async () => {
    try {
      setLoading(true);
      const data = await query('SELECT * FROM equipment ORDER BY type, code');
      setList(data && data.length > 0 ? data : demoEquipments);
    } catch (e) {
      setList(demoEquipments);
    } finally {
      setLoading(false);
    }
  };

  const filtered = list.filter(item => {
    if (filterType && item.type !== filterType) return false;
    if (search && !item.name.includes(search) && !item.code.includes(search)) return false;
    return true;
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '', type: 'converter', code: '', status: '空闲',
      capacity: 120, efficiency: 0.95, maintenance_interval: 50, specification: ''
    });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({ ...item });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.code) {
      alert('请填写设备名称和编号');
      return;
    }
    try {
      if (editing) {
        await update('equipment', form, 'id = ?', [editing.id]);
      } else {
        await insert('equipment', form);
      }
      await loadList();
      setShowModal(false);
    } catch (e) {
      const newList = editing
        ? list.map(x => x.id === editing.id ? { ...x, ...form } : x)
        : [...list, { ...form, id: Date.now(), total_heats: 0, last_maintenance_heats: 0 }];
      setList(newList);
      setShowModal(false);
    }
  };

  const handleDelete = (item) => {
    if (confirm(`确定删除设备【${item.name}】？`)) {
      try {
        remove('equipment', 'id = ?', [item.id]);
      } catch (e) {}
      setList(list.filter(x => x.id !== item.id));
    }
  };

  const stats = {
    total: list.length,
    running: list.filter(x => x.status === '运行中').length,
    idle: list.filter(x => x.status === '空闲').length,
    maintenance: list.filter(x => x.status === '维护中').length,
    fault: list.filter(x => x.status === '故障').length
  };

  const getMaintenanceProgress = (item) => {
    const used = item.total_heats - item.last_maintenance_heats;
    return item.maintenance_interval > 0 ? Math.min(100, (used / item.maintenance_interval) * 100) : 0;
  };

  return (
    <div>
      <div className="grid-4 mb-20">
        <div className="stat-card primary">
          <div className="stat-label">设备总数</div>
          <div className="stat-value">{stats.total}<span className="stat-unit">台</span></div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">运行中</div>
          <div className="stat-value">{stats.running}<span className="stat-unit">台</span></div>
          <div className="stat-change up">运行率 {((stats.running / stats.total) * 100).toFixed(1)}%</div>
        </div>
        <div className="stat-card gray" style={{ '--card-border': '#999' }}>
          <div className="stat-label">空闲</div>
          <div className="stat-value">{stats.idle}<span className="stat-unit">台</span></div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">维护/故障</div>
          <div className="stat-value">{stats.maintenance + stats.fault}<span className="stat-unit">台</span></div>
          <div className="stat-change down">{stats.maintenance} 台维护, {stats.fault} 台故障</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <div className="search-box">
              <span>🔍</span>
              <input placeholder="搜索设备名称或编号..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">全部类型</option>
              {EQ_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            {(user.role === 'admin' || user.role === 'minister') && (
              <button className="btn btn-primary" onClick={openCreate}>
                ➕ 新增设备
              </button>
            )}
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>设备编号</th>
                  <th>设备名称</th>
                  <th>类型</th>
                  <th>状态</th>
                  <th>规格</th>
                  <th>累计炉次</th>
                  <th>维保进度</th>
                  <th>效率</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="9" className="text-center" style={{ padding: 40 }}>加载中...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="9"><div className="empty-state">🗂️ 暂无设备数据</div></td></tr>
                ) : (
                  filtered.map(item => {
                    const progress = getMaintenanceProgress(item);
                    const needMaintenance = progress >= 80;
                    const statusInfo = STATUSES.find(s => s.value === item.status) || STATUSES[1];
                    return (
                      <tr key={item.id}>
                        <td className="font-bold" style={{ fontFamily: 'monospace', color: '#1890ff' }}>{item.code}</td>
                        <td>{item.name}</td>
                        <td>
                          <span className={`tag tag-${getEqTypeColor(item.type)}`}>
                            {getEqTypeLabel(item.type)}
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                              width: 10, height: 10, borderRadius: '50%',
                              background: statusInfo.color,
                              boxShadow: item.status === '运行中' ? `0 0 6px ${statusInfo.color}` : 'none'
                            }} />
                            {item.status}
                          </span>
                        </td>
                        <td style={{ color: '#666', fontSize: 12 }}>{item.specification}</td>
                        <td>{formatNumber(item.total_heats, 0)} 炉</td>
                        <td style={{ minWidth: 140 }}>
                          <div className="flex-between" style={{ fontSize: 12, marginBottom: 4 }}>
                            <span>{item.total_heats - item.last_maintenance_heats}/{item.maintenance_interval}</span>
                            <span style={{ color: needMaintenance ? '#ff4d4f' : '#999' }}>
                              {Math.floor(progress)}%
                              {needMaintenance && ' ⚠'}
                            </span>
                          </div>
                          <div className="progress-bar">
                            <div
                              className="progress-bar-fill"
                              style={{
                                width: `${progress}%`,
                                background: needMaintenance ? '#ff4d4f' : progress >= 60 ? '#faad14' : '#52c41a'
                              }}
                            />
                          </div>
                        </td>
                        <td>{(item.efficiency * 100).toFixed(1)}%</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {(user.role === 'admin' || user.role === 'minister') && (
                              <>
                                <button className="btn btn-sm" onClick={() => openEdit(item)}>编辑</button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item)}>删除</button>
                              </>
                            )}
                            {user.role === 'maintenance' && needMaintenance && (
                              <button className="btn btn-sm btn-warning">生成工单</button>
                            )}
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editing ? '编辑设备' : '新增设备'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>设备名称<span className="required">*</span></label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="如: 1号转炉" />
                </div>
                <div className="form-group">
                  <label>设备编号<span className="required">*</span></label>
                  <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="如: LD-001" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>设备类型<span className="required">*</span></label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    {EQ_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>设备状态</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.value}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>额定容量 (吨)</label>
                  <input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>设备效率 (0-1)</label>
                  <input type="number" step="0.01" min="0" max="1" value={form.efficiency} onChange={e => setForm({ ...form, efficiency: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>维保间隔 (炉次)</label>
                  <input type="number" value={form.maintenance_interval} onChange={e => setForm({ ...form, maintenance_interval: Number(e.target.value) })} />
                </div>
              </div>
              <div className="form-group">
                <label>设备规格描述</label>
                <textarea value={form.specification} onChange={e => setForm({ ...form, specification: e.target.value })} placeholder="如: 120吨顶底复吹转炉" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editing ? '保存修改' : '创建设备'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Equipment;
