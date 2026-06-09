import React, { useState, useEffect } from 'react';

const HEATMAP_COLORS = ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127'];

const EQUIPMENT_LAYOUT = [
  { id: 1, name: '原料堆场', x: 20, y: 30, w: 180, h: 80, type: 'yard', status: '空闲' },
  { id: 2, name: '配料站', x: 220, y: 45, w: 90, h: 50, type: 'batching', status: '忙碌' },
  { id: 3, name: '1号转炉', x: 340, y: 25, w: 100, h: 45, type: 'converter', status: '生产中', temp: 1650 },
  { id: 4, name: '2号转炉', x: 340, y: 80, w: 100, h: 45, type: 'converter', status: '生产中', temp: 1580 },
  { id: 5, name: '3号转炉', x: 340, y: 135, w: 100, h: 45, type: 'converter', status: '维护中' },
  { id: 6, name: 'RH精炼炉', x: 470, y: 35, w: 90, h: 55, type: 'refinery', status: '生产中', temp: 1620 },
  { id: 7, name: 'LF精炼炉', x: 470, y: 105, w: 90, h: 55, type: 'refinery', status: '空闲' },
  { id: 8, name: '钢包转运', x: 590, y: 60, w: 70, h: 75, type: 'transport', status: '忙碌' },
  { id: 9, name: '1号连铸机', x: 690, y: 25, w: 140, h: 55, type: 'caster', status: '生产中', temp: 1540 },
  { id: 10, name: '2号连铸机', x: 690, y: 95, w: 140, h: 55, type: 'caster', status: '生产中', temp: 1520 },
  { id: 11, name: '铸坯堆场', x: 860, y: 35, w: 120, h: 100, type: 'yard', status: '忙碌' },
  { id: 12, name: '加热炉1', x: 20, y: 200, w: 80, h: 70, type: 'furnace', status: '生产中', temp: 1220 },
  { id: 13, name: '加热炉2', x: 20, y: 285, w: 80, h: 70, type: 'furnace', status: '空闲' },
  { id: 14, name: '1号热轧机', x: 130, y: 215, w: 220, h: 40, type: 'rolling_mill', status: '生产中', temp: 880 },
  { id: 15, name: '精轧机组', x: 130, y: 265, w: 220, h: 35, type: 'rolling_mill', status: '生产中' },
  { id: 16, name: '卷取机1', x: 380, y: 215, w: 70, h: 40, type: 'coiler', status: '生产中' },
  { id: 17, name: '卷取机2', x: 380, y: 265, w: 70, h: 35, type: 'coiler', status: '生产中' },
  { id: 18, name: '2号热轧线', x: 130, y: 315, w: 260, h: 40, type: 'rolling_mill', status: '空闲' },
  { id: 19, name: '热轧成品库', x: 480, y: 205, w: 120, h: 150, type: 'warehouse', status: '忙碌' },
  { id: 20, name: '酸洗机组', x: 630, y: 200, w: 100, h: 80, type: 'pickling', status: '生产中' },
  { id: 21, name: '冷轧机1', x: 760, y: 190, w: 100, h: 55, type: 'rolling_mill_cold', status: '生产中', temp: 45 },
  { id: 22, name: '冷轧机2', x: 760, y: 255, w: 100, h: 55, type: 'rolling_mill_cold', status: '生产中', temp: 52 },
  { id: 23, name: '退火炉', x: 890, y: 200, w: 90, h: 110, type: 'annealing', status: '忙碌' },
  { id: 24, name: '冷轧成品库', x: 20, y: 400, w: 150, h: 70, type: 'warehouse', status: '空闲' },
  { id: 25, name: '质检中心', x: 200, y: 400, w: 100, h: 70, type: 'qc', status: '忙碌' },
  { id: 26, name: '包装线', x: 330, y: 400, w: 120, h: 70, type: 'packing', status: '生产中' },
  { id: 27, name: '发货区', x: 480, y: 400, w: 150, h: 70, type: 'shipping', status: '空闲' },
  { id: 28, name: '空压站', x: 890, y: 330, w: 90, h: 70, type: 'utility', status: '运行' },
  { id: 29, name: '水处理', x: 890, y: 400, w: 90, h: 70, type: 'utility', status: '运行' },
  { id: 30, name: '变电所', x: 660, y: 400, w: 100, h: 70, type: 'utility', status: '运行' }
];

const STATUS_BUSY_LEVEL = {
  '生产中': 4,
  '忙碌': 3,
  '运行': 2,
  '空闲': 1,
  '维护中': 0
};

const STATUS_COLORS = {
  '生产中': ['#ffebee', '#ffcdd2', '#ef9a9a', '#e57373', '#f44336'],
  '忙碌': ['#fff3e0', '#ffe0b2', '#ffcc80', '#ffb74d', '#ff9800'],
  '空闲': ['#f1f8e9', '#dcedc8', '#c5e1a5', '#aed581', '#8bc34a'],
  '维护中': ['#eceff1', '#cfd8dc', '#b0bec5', '#90a4ae', '#78909c'],
  '运行': ['#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', '#42a5f5']
};

const generateHourlyData = () => {
  const hours = [];
  for (let h = 6; h <= 22; h++) {
    hours.push({
      hour: `${String(h).padStart(2, '0')}:00`,
      converter: Math.floor(Math.random() * 5),
      caster: Math.floor(Math.random() * 5),
      rolling_hot: Math.floor(Math.random() * 5),
      rolling_cold: Math.floor(Math.random() * 5),
      refinery: Math.floor(Math.random() * 5)
    });
  }
  return hours;
};

const processTypes = [
  { key: 'converter', label: '转炉', color: '#1890ff' },
  { key: 'refinery', label: '精炼', color: '#faad14' },
  { key: 'caster', label: '连铸', color: '#52c41a' },
  { key: 'rolling_hot', label: '热轧', color: '#ff6b35' },
  { key: 'rolling_cold', label: '冷轧', color: '#13c2c2' }
];

function HeatMap({ user }) {
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [viewMode, setViewMode] = useState('layout');
  const [hourlyData, setHourlyData] = useState(() => generateHourlyData());
  const [currentTime, setCurrentTime] = useState(10);

  useEffect(() => {
    const interval = setInterval(() => {
      setHourlyData(generateHourlyData());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const getEquipmentColor = (eq) => {
    const level = STATUS_BUSY_LEVEL[eq.status] ?? 2;
    const palette = STATUS_COLORS[eq.status] || STATUS_COLORS['空闲'];
    return palette[Math.min(level, 4)];
  };

  const getEquipmentBorder = (eq) => {
    if (eq.status === '生产中') return '#f44336';
    if (eq.status === '忙碌') return '#ff9800';
    if (eq.status === '维护中') return '#78909c';
    return '#8bc34a';
  };

  const realtimeStats = EQUIPMENT_LAYOUT.reduce((acc, eq) => {
    const level = STATUS_BUSY_LEVEL[eq.status] ?? 0;
    acc.total++;
    if (level >= 3) acc.busy++;
    if (level >= 2) acc.running++;
    if (level === 0) acc.maintenance++;
    if (eq.temp) acc.maxTemp = Math.max(acc.maxTemp, eq.temp);
    return acc;
  }, { total: 0, busy: 0, running: 0, maintenance: 0, maxTemp: 0 });

  return (
    <div>
      <div className="grid-4 mb-20">
        <div className="stat-card danger">
          <div className="stat-label">生产中设备</div>
          <div className="stat-value">{realtimeStats.busy}<span className="stat-unit">台</span></div>
          <div className="stat-change" style={{ color: '#999' }}>高负荷运行</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">系统运行率</div>
          <div className="stat-value">{((realtimeStats.running / realtimeStats.total) * 100).toFixed(0)}<span className="stat-unit">%</span></div>
          <div className="stat-change up">{realtimeStats.running}/{realtimeStats.total} 台</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">产能利用率</div>
          <div className="stat-value">87.5<span className="stat-unit">%</span></div>
          <div className="stat-change up">↑ 计划内</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">工艺最高温</div>
          <div className="stat-value">{realtimeStats.maxTemp}<span className="stat-unit">℃</span></div>
          <div className="stat-change" style={{ color: '#999' }}>转炉区域</div>
        </div>
      </div>

      <div className="card mb-20">
        <div className="card-header">
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div className="tabs" style={{ marginBottom: 0 }}>
              <div className={`tab-item ${viewMode === 'layout' ? 'active' : ''}`} onClick={() => setViewMode('layout')}>
                🗺️ 产线布局图
              </div>
              <div className={`tab-item ${viewMode === 'timeline' ? 'active' : ''}`} onClick={() => setViewMode('timeline')}>
                📊 分时忙闲热力
              </div>
              <div className={`tab-item ${viewMode === 'distribution' ? 'active' : ''}`} onClick={() => setViewMode('distribution')}>
                🔥 工序负荷分布
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 12, color: '#666' }}>
            <span>图例：</span>
            {Object.entries(STATUS_COLORS).map(([status, colors]) => (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ display: 'flex', gap: 1 }}>
                  {colors.map((c, i) => (
                    <div key={i} style={{
                      width: 16,
                      height: 16,
                      background: c,
                      border: '1px solid #ddd'
                    }} />
                  ))}
                </div>
                <span>{status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card-body">
          {viewMode === 'layout' && (
            <div style={{
              position: 'relative',
              width: '100%',
              height: 500,
              background: `
                linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px),
                linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
              borderRadius: 6,
              border: '1px solid #e8e8e8',
              overflow: 'hidden'
            }}>
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.4 }}>
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#999" />
                  </marker>
                </defs>
                <line x1="200" y1="70" x2="220" y2="70" stroke="#999" strokeWidth="2" markerEnd="url(#arrowhead)" />
                <line x1="310" y1="70" x2="340" y2="47" stroke="#999" strokeWidth="2" markerEnd="url(#arrowhead)" />
                <line x1="310" y1="70" x2="340" y2="102" stroke="#999" strokeWidth="2" markerEnd="url(#arrowhead)" />
                <line x1="310" y1="70" x2="340" y2="157" stroke="#999" strokeWidth="2" markerEnd="url(#arrowhead)" />
                <line x1="440" y1="60" x2="470" y2="62" stroke="#999" strokeWidth="2" markerEnd="url(#arrowhead)" />
                <line x1="440" y1="102" x2="470" y2="132" stroke="#999" strokeWidth="2" markerEnd="url(#arrowhead)" />
                <line x1="560" y1="90" x2="590" y2="95" stroke="#999" strokeWidth="2" markerEnd="url(#arrowhead)" />
                <line x1="660" y1="95" x2="690" y2="52" stroke="#999" strokeWidth="2" markerEnd="url(#arrowhead)" />
                <line x1="660" y1="95" x2="690" y2="122" stroke="#999" strokeWidth="2" markerEnd="url(#arrowhead)" />
                <line x1="830" y1="80" x2="860" y2="85" stroke="#999" strokeWidth="2" markerEnd="url(#arrowhead)" />
              </svg>

              {EQUIPMENT_LAYOUT.map(eq => {
                const level = STATUS_BUSY_LEVEL[eq.status] ?? 2;
                const isSelected = selectedEquipment?.id === eq.id;
                return (
                  <div
                    key={eq.id}
                    onClick={() => setSelectedEquipment(eq)}
                    style={{
                      position: 'absolute',
                      left: eq.x,
                      top: eq.y,
                      width: eq.w,
                      height: eq.h,
                      background: getEquipmentColor(eq),
                      border: `2px solid ${isSelected ? '#1890ff' : getEquipmentBorder(eq)}`,
                      borderRadius: 6,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: isSelected
                        ? '0 4px 16px rgba(24, 144, 255, 0.35)'
                        : level >= 3
                          ? `0 0 12px ${getEquipmentBorder(eq)}55`
                          : '0 1px 3px rgba(0,0,0,0.08)',
                      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                      padding: 6,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      zIndex: isSelected ? 10 : 1
                    }}
                    title={`${eq.name} - ${eq.status}${eq.temp ? ` (${eq.temp}℃)` : ''}`}
                  >
                    <div style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: level >= 3 ? '#fff' : level >= 2 ? '#333' : '#555',
                      textAlign: 'center',
                      textShadow: level >= 3 ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
                    }}>
                      {eq.name}
                    </div>
                    <div style={{
                      fontSize: 10,
                      marginTop: 4,
                      padding: '1px 6px',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.5)',
                      color: '#333'
                    }}>
                      {eq.status}
                    </div>
                    {eq.temp && (
                      <div style={{
                        fontSize: 10,
                        marginTop: 2,
                        fontWeight: 700,
                        color: '#d32f2f'
                      }}>
                        {eq.temp}℃
                      </div>
                    )}
                    <div style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      display: 'flex',
                      gap: 1
                    }}>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} style={{
                          width: 4,
                          height: 4,
                          borderRadius: 2,
                          background: i < level ? getEquipmentBorder(eq) : 'rgba(0,0,0,0.1)'
                        }} />
                      ))}
                    </div>
                  </div>
                );
              })}

              {selectedEquipment && (
                <div style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  width: 240,
                  background: '#fff',
                  borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  padding: 16,
                  border: '1px solid #e8e8e8',
                  zIndex: 100
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{selectedEquipment.name}</span>
                    <button
                      onClick={() => setSelectedEquipment(null)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#999', fontSize: 16 }}
                    >×</button>
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#666' }}>设备类型：</span>
                      <span className={`tag tag-${selectedEquipment.type === 'converter' ? 'primary' : selectedEquipment.type.includes('caster') ? 'success' : selectedEquipment.type.includes('rolling') ? 'warning' : 'info'}`}>
                        {({
                          yard: '堆场',
                          batching: '配料',
                          converter: '转炉',
                          refinery: '精炼炉',
                          transport: '转运',
                          caster: '连铸机',
                          furnace: '加热炉',
                          rolling_mill: '热轧机',
                          rolling_mill_cold: '冷轧机',
                          coiler: '卷取机',
                          warehouse: '仓库',
                          pickling: '酸洗',
                          annealing: '退火',
                          qc: '质检',
                          packing: '包装',
                          shipping: '发货',
                          utility: '公辅'
                        })[selectedEquipment.type] || selectedEquipment.type}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#666' }}>运行状态：</span>
                      <span style={{ fontWeight: 600, color: getEquipmentBorder(selectedEquipment) }}>{selectedEquipment.status}</span>
                    </div>
                    {selectedEquipment.temp && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#666' }}>当前温度：</span>
                        <span style={{ color: '#d32f2f', fontWeight: 700 }}>{selectedEquipment.temp} ℃</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#666' }}>忙闲等级：</span>
                      <span>{'🔴🟠🟡🟢⚪'.slice((4 - (STATUS_BUSY_LEVEL[selectedEquipment.status] ?? 2)) * 2, (5 - (STATUS_BUSY_LEVEL[selectedEquipment.status] ?? 2)) * 2) || '⚪'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#666' }}>今日产量：</span>
                      <span style={{ fontWeight: 600 }}>{Math.floor(Math.random() * 500 + 800)} 吨</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#666' }}>能耗：</span>
                      <span>{Math.floor(Math.random() * 200 + 150)} kWh/t</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {viewMode === 'timeline' && (
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: 900 }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `80px repeat(${hourlyData.length}, 1fr)`,
                  borderBottom: '2px solid #e8e8e8',
                  marginBottom: 4
                }}>
                  <div style={{ padding: '10px 8px', fontWeight: 600, background: '#fafafa' }}>工序 \ 时间</div>
                  {hourlyData.map((d, i) => (
                    <div key={i} style={{
                      padding: '10px 4px',
                      textAlign: 'center',
                      fontSize: 11,
                      color: i === currentTime - 6 ? '#1890ff' : '#666',
                      fontWeight: i === currentTime - 6 ? 700 : 400,
                      background: i === currentTime - 6 ? '#e6f7ff' : '#fafafa'
                    }}>
                      {d.hour}
                    </div>
                  ))}
                </div>

                {processTypes.map(pt => (
                  <div key={pt.key} style={{
                    display: 'grid',
                    gridTemplateColumns: `80px repeat(${hourlyData.length}, 1fr)`,
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <div style={{
                      padding: '10px 8px',
                      background: `${pt.color}15`,
                      color: pt.color,
                      fontWeight: 600,
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {pt.label}
                    </div>
                    {hourlyData.map((d, i) => {
                      const level = d[pt.key] ?? 0;
                      const isCurrent = i === currentTime - 6;
                      return (
                        <div key={i} style={{
                          padding: 6,
                          position: 'relative',
                          background: isCurrent ? '#fffbe6' : 'transparent'
                        }}>
                          <div
                            className="heatmap-cell"
                            style={{
                              width: '100%',
                              height: 36,
                              borderRadius: 4,
                              background: pt.color,
                              opacity: 0.15 + level * 0.2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11,
                              fontWeight: level >= 3 ? 700 : 400,
                              color: level >= 3 ? '#fff' : '#333',
                              border: isCurrent ? '2px solid #1890ff' : 'none',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            title={`${pt.label} ${d.hour}: 忙闲等级 ${level}/4`}
                          >
                            {level >= 2 && level}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}

                <div style={{
                  marginTop: 16,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 16,
                  padding: 12,
                  background: '#fafafa',
                  borderRadius: 4
                }}>
                  <span style={{ fontSize: 12, color: '#666' }}>负荷图例：</span>
                  {[0, 1, 2, 3, 4].map(level => (
                    <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {processTypes.map(pt => (
                        <div key={pt.key} style={{
                          width: 20,
                          height: 20,
                          borderRadius: 3,
                          background: pt.color,
                          opacity: 0.15 + level * 0.2
                        }} />
                      ))}
                      <span style={{ fontSize: 12 }}>{level === 0 ? '空闲' : level === 1 ? '低' : level === 2 ? '中' : level === 3 ? '高' : '满负荷'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'distribution' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
              {processTypes.map(pt => {
                const avgBusy = hourlyData.reduce((s, d) => s + (d[pt.key] || 0), 0) / hourlyData.length;
                const eqs = EQUIPMENT_LAYOUT.filter(e => {
                  if (pt.key === 'converter') return e.type === 'converter';
                  if (pt.key === 'refinery') return e.type === 'refinery';
                  if (pt.key === 'caster') return e.type === 'caster';
                  if (pt.key === 'rolling_hot') return e.type === 'rolling_mill';
                  if (pt.key === 'rolling_cold') return e.type === 'rolling_mill_cold';
                  return false;
                });
                return (
                  <div key={pt.key} className="card">
                    <div className="card-header" style={{ padding: '10px 14px' }}>
                      <span style={{
                        display: 'inline-block',
                        width: 4,
                        height: 16,
                        background: pt.color,
                        marginRight: 8,
                        borderRadius: 2
                      }} />
                      <span className="card-title" style={{ fontSize: 13 }}>{pt.label}工序</span>
                    </div>
                    <div className="card-body" style={{ padding: 14 }}>
                      <div style={{
                        textAlign: 'center',
                        marginBottom: 12
                      }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: pt.color }}>
                          {avgBusy.toFixed(1)}
                        </div>
                        <div style={{ fontSize: 11, color: '#999' }}>平均负荷指数 (0-4)</div>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#666', marginBottom: 4 }}>
                          <span>设备 {eqs.length} 台</span>
                          <span>{(avgBusy / 4 * 100).toFixed(0)}%</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-bar-fill" style={{
                            width: `${avgBusy / 4 * 100}%`,
                            background: `linear-gradient(90deg, ${pt.color}88, ${pt.color})`
                          }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {eqs.map(eq => {
                          const level = STATUS_BUSY_LEVEL[eq.status] ?? 0;
                          return (
                            <div key={eq.id} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '6px 8px',
                              borderRadius: 4,
                              background: level >= 3 ? `${pt.color}10` : '#fafafa'
                            }}>
                              <div style={{
                                flex: 1,
                                fontSize: 11,
                                fontWeight: 500
                              }}>{eq.name}</div>
                              <div style={{ display: 'flex', gap: 2 }}>
                                {[1, 2, 3, 4].map(i => (
                                  <div key={i} style={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: 3,
                                    background: i <= level ? pt.color : '#f0f0f0',
                                    opacity: i <= level ? (0.25 + i * 0.1875) : 1
                                  }} />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid-3">
        <div className="card">
          <div className="card-header"><span className="card-title">🔥 温度热力分布</span></div>
          <div className="card-body">
            <div style={{
              height: 180,
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-end',
              gap: 4,
              padding: '8px 0'
            }}>
              {[
                { name: '转炉区', temp: 1650, color: '#f44336' },
                { name: '精炼区', temp: 1620, color: '#e91e63' },
                { name: '连铸区', temp: 1540, color: '#ff5722' },
                { name: '加热炉', temp: 1220, color: '#ff9800' },
                { name: '热轧区', temp: 880, color: '#ffc107' },
                { name: '冷轧区', temp: 45, color: '#8bc34a' }
              ].map(z => {
                const h = (z.temp / 1800) * 100;
                return (
                  <div key={z.name} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: z.color,
                      marginBottom: 4
                    }}>{z.temp}℃</div>
                    <div style={{
                      width: '80%',
                      height: `${h}%`,
                      background: `linear-gradient(180deg, ${z.color}, ${z.color}44)`,
                      borderRadius: '4px 4px 0 0',
                      position: 'relative',
                      boxShadow: `0 0 20px ${z.color}44`
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 8,
                        background: z.color,
                        borderRadius: '4px 4px 0 0',
                        animation: 'pulse 1.5s infinite'
                      }} />
                    </div>
                    <div style={{ fontSize: 10, color: '#666', marginTop: 6 }}>{z.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">⚡ 能耗分布</span></div>
          <div className="card-body">
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              height: 180,
              justifyContent: 'center'
            }}>
              {[
                { name: '转炉系统', val: 32, color: '#1890ff' },
                { name: '加热炉', val: 25, color: '#ff6b35' },
                { name: '热轧机', val: 18, color: '#52c41a' },
                { name: '冷轧机', val: 14, color: '#13c2c2' },
                { name: '公辅设施', val: 11, color: '#722ed1' }
              ].map(e => (
                <div key={e.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                    <span>{e.name}</span>
                    <span style={{ fontWeight: 600 }}>{e.val}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${e.val * 2.5}%`, background: e.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">📈 实时KPI</span></div>
          <div className="card-body">
            <div style={{ height: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {[
                { label: '在制炉次', val: '6', unit: '炉', target: '6', status: 'ok' },
                { label: '钢水包周转率', val: '3.2', unit: '次/h', target: '≥3', status: 'ok' },
                { label: '连铸拉速', val: '1.18', unit: 'm/min', target: '1.2', status: 'warn' },
                { label: '轧制节奏', val: '86', unit: '秒/支', target: '≤90', status: 'ok' },
                { label: '综合成材率', val: '96.8', unit: '%', target: '≥96', status: 'ok' }
              ].map((k, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: k.status === 'ok' ? '#52c41a' : '#faad14'
                  }} />
                  <span style={{ flex: 1, fontSize: 12, color: '#666' }}>{k.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>
                    {k.val}<span style={{ fontSize: 10, color: '#999', marginLeft: 2 }}>{k.unit}</span>
                  </span>
                  <span style={{ fontSize: 10, color: '#999' }}>({k.target})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

export default HeatMap;
