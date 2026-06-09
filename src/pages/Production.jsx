import React, { useState, useEffect } from 'react';
import { query, update } from '../utils/api.js';
import { formatDateTime, formatNumber,
  getHeatStatusLabel, getHeatStatusColor } from '../utils/format.js';

const STAGES = [
  { key: 'blowing', name: '吹炼', color: '#ff6b35' },
  { key: 'refining', name: '精炼', color: '#faad14' },
  { key: 'casting', name: '连铸', color: '#1890ff' },
  { key: 'hot_rolling', name: '热轧', color: '#52c41a' },
  { key: 'cold_rolling', name: '冷轧', color: '#13c2c2' }
];

const demoHeats = [
  {
    id: 1, heat_no: 'H240609001', steel_grade: 'Q235B', target_weight: 120, actual_weight: 118.5,
    status: '热轧中',
    converter_id: 1, caster_id: 6, rolling_mill_id: 8,
    blowing_start_time: '2024-06-09 08:05',
    blowing_end_time: '2024-06-09 09:35',
    refining_start_time: '2024-06-09 09:50',
    refining_end_time: '2024-06-09 10:55',
    casting_start_time: '2024-06-09 11:10',
    casting_end_time: '2024-06-09 13:25',
    hot_rolling_start_time: '2024-06-09 14:00',
    quality_locked: 0,
    quality_alarm: [],
    parameters: {
      blowing: [
        { name: '终点碳', value: 0.18, standard: 0.15, min: 0.12, max: 0.20, stage: 'blowing', unit: '%', status: 'normal' },
        { name: '吹炼温度', value: 1645, standard: 1650, min: 1620, max: 1680, stage: 'blowing', unit: '℃', status: 'normal' },
        { name: '供氧时间', value: 16, standard: 15, min: 12, max: 18, stage: 'blowing', unit: 'min', status: 'normal' },
        { name: '终点磷', value: 0.015, standard: 0.015, min: 0, max: 0.025, stage: 'blowing', unit: '%', status: 'normal' }
      ],
      refining: [
        { name: '精炼温度', value: 1610, standard: 1600, min: 1580, max: 1630, stage: 'refining', unit: '℃', status: 'normal' },
        { name: '真空度', value: 0.67, standard: 0.67, min: 0.1, max: 1.0, stage: 'refining', unit: 'mbar', status: 'normal' },
        { name: '合金收得率', value: 92, standard: 90, min: 85, max: 100, stage: 'refining', unit: '%', status: 'normal' }
      ],
      casting: [
        { name: '中间包温度', value: 1542, standard: 1540, min: 1520, max: 1560, stage: 'casting', unit: '℃', status: 'normal' },
        { name: '拉速', value: 1.2, standard: 1.2, min: 1.0, max: 1.4, stage: 'casting', unit: 'm/min', status: 'normal' },
        { name: '结晶器液位', value: 78, standard: 80, min: 75, max: 85, stage: 'casting', unit: '%', status: 'normal' }
      ]
    }
  },
  {
    id: 2, heat_no: 'H240609002', steel_grade: 'HC340LA', target_weight: 120, actual_weight: 119.2,
    status: '连铸中',
    converter_id: 2, caster_id: 7, rolling_mill_id: 10,
    blowing_start_time: '2024-06-09 08:20',
    blowing_end_time: '2024-06-09 09:50',
    refining_start_time: '2024-06-09 10:05',
    refining_end_time: '2024-06-09 11:20',
    casting_start_time: '2024-06-09 11:35',
    quality_locked: 1, lock_reason: '碳含量超标: 实际0.22% 标准≤0.20%',
    parameters: {
      blowing: [
        { name: '终点碳', value: 0.22, standard: 0.18, min: 0.15, max: 0.20, stage: 'blowing', unit: '%', status: 'alarm_high' }
      ]
    }
  },
  {
    id: 3, heat_no: 'H240609003', steel_grade: 'AH32', target_weight: 120, actual_weight: 117.8,
    status: '精炼中',
    converter_id: 1, caster_id: 6,
    blowing_start_time: '2024-06-09 09:50',
    blowing_end_time: '2024-06-09 11:20',
    refining_start_time: '2024-06-09 11:35',
    quality_locked: 0,
    parameters: {
      blowing: []
    }
  },
  {
    id: 4, heat_no: 'H240609004', steel_grade: 'DC01', target_weight: 120, actual_weight: 119.5,
    status: '吹炼中',
    converter_id: 2,
    blowing_start_time: '2024-06-09 11:30',
    quality_locked: 0,
    parameters: {}
  },
  {
    id: 5, heat_no: 'H240609005', steel_grade: 'SPHC', target_weight: 120,
    status: '待吹炼',
    quality_locked: 0,
    parameters: {}
  }
];

function Production({ user }) {
  const [heats, setHeats] = useState(demoHeats);
  const [selectedHeat, setSelectedHeat] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setHeats(prev => prev.map(h => {
        if (h.status === '吹炼中' && Math.random() > 0.3) return h;
        return h;
      }));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const filtered = heats.filter(h => {
    if (statusFilter && h.status !== statusFilter) return false;
    if (search && !h.heat_no.includes(search) && !h.steel_grade.includes(search)) return false;
    return true;
  });

  const getStageIndex = (status) => {
    if (status.includes('吹炼')) return 0;
    if (status.includes('精炼')) return 1;
    if (status.includes('连铸')) return 2;
    if (status.includes('热轧')) return 3;
    if (status.includes('冷轧')) return 4;
    return 5;
  };

  const advanceStage = (heat) => {
    const idx = getStageIndex(heat.status);
    let newStatus = heat.status;
    const now = formatDateTime(new Date());
    if (heat.status === '吹炼中') newStatus = '吹炼完成';
    else if (heat.status === '吹炼完成') newStatus = '精炼中';
    else if (heat.status === '吹炼中'.replace('中', '完成')) newStatus = STAGES[idx + 1].name + '中';
    else if (idx < 4 && heat.status.endsWith('完成')) newStatus = STAGES[idx + 1].name + '中';
    const updated = { ...heat, status: newStatus };
    setHeats(heats.map(h => h.id === heat.id ? updated : h));
    setSelectedHeat(updated);
  };

  const handleStatusChange = (heatId, field, value) => {
    setHeats(heats.map(h => h.id === heatId ? { ...h, [field]: value } : h));
  };

  const unlockHeat = (heat) => {
    if (!confirm(`确认解锁炉次 ${heat.heat_no}？需确认质量问题已处理。`)) return;
    handleStatusChange(heat.id, 'quality_locked', 0);
    handleStatusChange(heat.id, 'lock_reason', '');
    handleStatusChange(heat.id, 'status', '吹炼完成');
  };

  const renderStageProgress = (heat) => {
    const currentIdx = getStageIndex(heat.status);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '8px 0' }}>
        {STAGES.map((s, i) => {
          const isDone = i < currentIdx || (i === currentIdx && heat.status.endsWith('完成'));
          const isCurrent = i === currentIdx && heat.status.includes('中');
          return (
            <React.Fragment key={s.key}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: isDone ? '#52c41a' : isCurrent ? s.color : '#f0f0f0',
                border: `2px solid ${isDone ? '#52c41a' : isCurrent ? s.color : '#e0e0e0'}`,
                color: isDone || isCurrent ? '#fff' : '#999',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                boxShadow: isCurrent ? `0 0 8px ${s.color}` : 'none'
              }}>
                {isDone ? '✓' : i + 1}
              </div>
              {i < 4 && (
                <div style={{
                  flex: 1,
                  height: 3,
                  width: 30,
                  background: i < currentIdx ? '#52c41a' : '#e0e0e0',
                  borderRadius: 2
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <div className="grid-4 mb-20">
        <div className="stat-card primary">
          <div className="stat-label">在制炉次</div>
          <div className="stat-value">{filtered.filter(h => !h.status.includes('待') && !h.status.includes('完成')).length}<span className="stat-unit">炉</span></div>
        </div>
        <div className="stat-card danger">
          <div className="stat-label">质量锁定</div>
          <div className="stat-value">{heats.filter(h => h.quality_locked).length}<span className="stat-unit">炉</span></div>
          <div className="stat-change down">需紧急处理</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">今日完成</div>
          <div className="stat-value">12<span className="stat-unit">炉</span></div>
          <div className="stat-change up">1,420 吨</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">待开始</div>
          <div className="stat-value">{heats.filter(h => h.status === '待吹炼').length}<span className="stat-unit">炉</span></div>
        </div>
      </div>

      <div className="card mb-20">
        <div className="card-header">
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <div className="search-box">
              <span>🔍</span>
              <input placeholder="炉次号/钢种..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">全部状态</option>
              <option>待吹炼</option>
              <option>吹炼中</option>
              <option>精炼中</option>
              <option>连铸中</option>
              <option>热轧中</option>
              <option>冷轧中</option>
              <option>已完成</option>
              <option>质量锁定</option>
              <option>回炉处理</option>
            </select>
          </div>
          <div>
            {(user.role === 'operator' || user.role === 'minister') && (
              <button className="btn btn-success">📥 开始下一炉</button>
            )}
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>炉次号</th>
                  <th>钢种</th>
                  <th>工序进度</th>
                  <th>目标/实际</th>
                  <th>工序状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(heat => {
                  const hasAlarm = heat.quality_locked;
                  return (
                    <tr key={heat.id} style={{
                      background: hasAlarm ? '#fff1f0' : 'transparent',
                      borderLeft: `4px solid ${hasAlarm ? '#ff4d4f' : 'transparent'}`
                    }}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                        {heat.heat_no}
                        {hasAlarm && <span className="tag tag-danger" style={{ marginLeft: 8 }}>🔒 锁定</span>}
                      </td>
                      <td><span className="tag tag-primary">{heat.steel_grade}</span></td>
                      <td style={{ minWidth: 280 }}>
                        {renderStageProgress(heat)}
                      </td>
                      <td>
                        <div>{formatNumber(heat.target_weight || 0, 1)} 吨</div>
                        <div style={{ fontSize: 12, color: heat.actual_weight ? '#52c41a' : '#999' }}>
                          实际: {heat.actual_weight ? formatNumber(heat.actual_weight, 1) : '-'} 吨
                        </div>
                      </td>
                      <td>
                        <span className={`tag tag-${getHeatStatusColor(heat.status)}`}>
                          {getHeatStatusLabel(heat.status)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-sm" onClick={() => { setSelectedHeat(heat); setShowDetail(true); }}>
                            详情
                          </button>
                          {(user.role === 'operator') && heat.status.includes('中') && (
                            <button className="btn btn-sm btn-success" onClick={() => advanceStage(heat)}>
                              工序完成
                            </button>
                          )}
                          {(user.role === 'inspector' || user.role === 'minister') && hasAlarm && (
                            <button className="btn btn-sm btn-warning" onClick={() => unlockHeat(heat)}>
                              解锁
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showDetail && selectedHeat && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
              🔥 炉次详情 - {selectedHeat.heat_no}
              <span className="tag tag-primary" style={{ marginLeft: 12 }}>{selectedHeat.steel_grade}</span>
              {selectedHeat.quality_locked && <span className="tag tag-danger" style={{ marginLeft: 8 }}>🔒 质量锁定</span>}
            </div>
            <button className="modal-close" onClick={() => setShowDetail(false)}>×</button>
            </div>
            <div className="modal-body">
              {selectedHeat.lock_reason && (
                <div className="alert alert-danger mb-16">
                  <span>🚨</span>
                  <div>
                    <div className="font-bold">质量异常报警：</div>
                    <div>{selectedHeat.lock_reason}</div>
                  </div>
                </div>
              )}

              <div className="grid-2 mb-20">
                <div>
                  <div className="font-bold mb-12" style={{ fontSize: 14 }}>📋 基本信息</div>
                  <table style={{ fontSize: 13 }}>
                    <tbody>
                      <tr><td style={{ padding: '6px 8px', color: '#666', width: 100 }}>钢种</td><td style={{ padding: '6px 8px', fontWeight: 600 }}>{selectedHeat.steel_grade}</td></tr>
                      <tr><td style={{ padding: '6px 8px', color: '#666' }}>目标重量</td><td style={{ padding: '6px 8px' }}>{formatNumber(selectedHeat.target_weight, 1)} 吨</td></tr>
                      <tr><td style={{ padding: '6px 8px', color: '#666' }}>实际重量</td><td style={{ padding: '6px 8px' }}>{selectedHeat.actual_weight ? formatNumber(selectedHeat.actual_weight, 1) : '-'} 吨</td></tr>
                      <tr><td style={{ padding: '6px 8px', color: '#666' }}>当前状态</td><td style={{ padding: '6px 8px' }}>{selectedHeat.status}</td></tr>
                      <tr><td style={{ padding: '6px 8px', color: '#666' }}>回炉次数</td><td style={{ padding: '6px 8px' }}>{selectedHeat.rework_count || 0} 次</td></tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <div className="font-bold mb-12" style={{ fontSize: 14 }}>⏰ 时间线</div>
                  <div className="timeline">
                    {selectedHeat.blowing_start_time && (
                      <div className="timeline-item">
                        <div className="timeline-dot">1</div>
                        <div className="timeline-content">
                          <div className="timeline-title">吹炼</div>
                          <div className="timeline-time">{formatDateTime(selectedHeat.blowing_start_time)} ~ {formatDateTime(selectedHeat.blowing_end_time)}</div>
                        </div>
                      </div>
                    )}
                    {selectedHeat.refining_start_time && (
                      <div className="timeline-item">
                        <div className="timeline-dot warning">2</div>
                        <div className="timeline-content">
                          <div className="timeline-title">精炼</div>
                          <div className="timeline-time">{formatDateTime(selectedHeat.refining_start_time)} ~ {formatDateTime(selectedHeat.refining_end_time)}</div>
                        </div>
                      </div>
                    )}
                    {selectedHeat.casting_start_time && (
                      <div className="timeline-item">
                        <div className="timeline-dot" style={{ background: '#1890ff' }}>3</div>
                        <div className="timeline-content">
                          <div className="timeline-title">连铸</div>
                          <div className="timeline-time">{formatDateTime(selectedHeat.casting_start_time)} ~ {formatDateTime(selectedHeat.casting_end_time)}</div>
                        </div>
                      </div>
                    )}
                    {selectedHeat.hot_rolling_start_time && (
                      <div className="timeline-item">
                        <div className="timeline-dot success">4</div>
                        <div className="timeline-content">
                          <div className="timeline-title">热轧</div>
                          <div className="timeline-time">{formatDateTime(selectedHeat.hot_rolling_start_time)} ~ {formatDateTime(selectedHeat.hot_rolling_end_time)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="tabs">
                {['blowing', 'refining', 'casting', 'hot_rolling', 'cold_rolling'].map((key) => {
                  const stage = STAGES.find(s => s.key === key);
                  const params = selectedHeat.parameters?.[key] || [];
                  return (
                    <div key={key} className="tab-item" style={{ color: params.length > 0 ? '' : '#ccc' }}>
                      {stage.name}参数 {params.length > 0 ? `(${params.length})` : ''}
                    </div>
                  );
                })}
              </div>

              {Object.entries(selectedHeat.parameters || {}).map(([stageKey, params]) => {
                if (!params || params.length === 0) return null;
                return (
                  <div key={stageKey}>
                    <table>
                      <thead>
                        <tr>
                          <th>参数名称</th>
                          <th>标准值</th>
                          <th>公差范围</th>
                          <th>实际值</th>
                          <th>状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {params.map((p, i) => {
                          let status = 'normal';
                          if (p.status) status = p.status;
                          else if (p.value !== undefined && p.value < p.min) status = 'alarm_low';
                          else if (p.value !== undefined && p.value > p.max) status = 'alarm_high';
                          return (
                            <tr key={i} style={{
                              background: status !== 'normal' ? '#fff1f0' : 'transparent'
                            }}>
                              <td className="font-bold">{p.name}</td>
                              <td>{p.standard}{p.unit}</td>
                              <td style={{ color: '#999' }}>{p.min} ~ {p.max} {p.unit}</td>
                              <td style={{
                                color: status === 'normal' ? '#52c41a' : '#ff4d4f',
                                fontWeight: 600
                              }}>
                                {p.value !== undefined ? p.value : '-'}{p.unit}
                              </td>
                              <td>
                                <span className={`tag ${status === 'normal' ? 'tag-success' : 'tag-danger'}`}>
                                  {status === 'normal' ? '✓ 合格' : status.includes('high') ? '↑ 超标' : '↓ 偏低'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
              {Object.keys(selectedHeat.parameters || {}).length === 0 && (
                <div className="empty-state">⚗️ 暂无参数数据</div>
              )}

              <div className="divider" />

              <div className="grid-2">
                <div>
                  <div className="font-bold mb-12">📊 质检记录</div>
                </div>
                <div>
                  <div className="font-bold mb-12">📦 物料消耗</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowDetail(false)}>关闭</button>
              {selectedHeat.status.includes('中') && (
                <button className="btn btn-success" onClick={() => advanceStage(selectedHeat)}>完成当前工序</button>
              )}
              {selectedHeat.quality_locked && (
                <button className="btn btn-danger">提交质检</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Production;
