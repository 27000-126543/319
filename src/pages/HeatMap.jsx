import React, { useState, useEffect, useMemo } from 'react';
import { query, list, getSteelKpiDashboard } from '../utils/api.js';

const STEEL_STATUS_COLOR = {
  运行: { bg: '#10b981', label: '运行中', dot: '#22c55e', pulse: true },
  忙碌: { bg: '#f59e0b', label: '高负荷', dot: '#f97316', pulse: true },
  报警: { bg: '#ef4444', label: '故障报警', dot: '#dc2626', pulse: true },
  停机: { bg: '#6b7280', label: '停机维护', dot: '#9ca3af', pulse: false },
  待机: { bg: '#3b82f6', label: '待机',     dot: '#60a5fa', pulse: false }
};

const STEEL_PRODUCTION_LINE = [
  {
    section: '原料预处理区',
    nodes: [
      { id: 'n1', name: '原料堆场',      type: '原料',  x: 3,   y: 12, w: 110, h: 56, status: '运行', temp: '常温', load: 45, info: '铁矿粉 8.5万t\n废钢 1.28万t' },
      { id: 'n2', name: '配料站',        type: '配料',  x: 145, y: 12, w: 90,  h: 56, status: '忙碌', temp: '常温', load: 78, info: '按8:1:1自动配料\n精度±0.2%' }
    ]
  },
  {
    section: '炼钢区',
    nodes: [
      { id: 'n3', name: '1号转炉 120t',  type: '转炉',  x: 265, y: 4,  w: 95,  h: 80, status: '忙碌', temp: '1650℃', load: 92, info: '炉次 HEAT-004\n吹炼 第14分钟\n钢种 Q345B' },
      { id: 'n4', name: '2号转炉 120t',  type: '转炉',  x: 380, y: 4,  w: 95,  h: 80, status: '运行', temp: '1620℃', load: 76, info: '炉次 HEAT-005\nS超标待处理\n已锁定🔒' },
      { id: 'n5', name: '3号转炉 150t',  type: '转炉',  x: 495, y: 4,  w: 95,  h: 80, status: '运行', temp: '1600℃', load: 68, info: '炉次 HEAT-006\n出钢准备中' },
      { id: 'n6', name: 'LF 1号精炼炉',  type: '精炼',  x: 265, y: 100,w: 95,  h: 52, status: '忙碌', temp: '1580℃', load: 88, info: 'HEAT-003 AH32\n电极加热第12min\n氩气搅拌' },
      { id: 'n7', name: 'RH 真空精炼炉', type: '精炼',  x: 380, y: 100,w: 95,  h: 52, status: '运行', temp: '1560℃', load: 72, info: 'HEAT-002 SPHC\n真空0.25torr\n脱气处理' },
      { id: 'n8', name: '钢包转运区',    type: '辅助',  x: 500, y: 100,w: 90,  h: 52, status: '运行', temp: '1500℃', load: 55, info: '周转钢包 14个\n在线 8个' }
    ]
  },
  {
    section: '连铸区',
    nodes: [
      { id: 'n9',  name: '1号板坯连铸机', type: '连铸', x: 265, y: 172,w: 105, h: 56, status: '忙碌', temp: '1540℃', load: 95, info: '板坯 220×1500mm\n拉速 1.2m/min\n中间包寿命 第7炉' },
      { id: 'n10', name: '2号板坯连铸机', type: '连铸', x: 390, y: 172,w: 105, h: 56, status: '运行', temp: '1525℃', load: 82, info: '板坯 250×1800mm\n拉速 1.0m/min\n结晶器液位正常' },
      { id: 'n11', name: '铸坯堆放场',    type: '堆场', x: 515, y: 172,w: 85,  h: 56, status: '待机', temp: '800℃',  load: 38, info: '待热送 18块\n待冷装 6块' }
    ]
  },
  {
    section: '热轧区',
    nodes: [
      { id: 'n12', name: '1号步进加热炉', type: '加热', x: 3,   y: 250,w: 105, h: 58, status: '运行', temp: '1220℃', load: 80, info: '蓄热式燃烧\n炉温均匀 ±5℃' },
      { id: 'n13', name: '2号步进加热炉', type: '加热', x: 128, y: 250,w: 105, h: 58, status: '报警', temp: '1260℃', load: 99, info: '⚠️ 2区温度偏高\n自动减煤气中' },
      { id: 'n14', name: '1号 1+7热连轧', type: '热轧', x: 253, y: 250,w: 175, h: 58, status: '忙碌', temp: '880℃',  load: 96, info: '粗轧R1-R2\n精轧F1-F7\n卷取 第42卷' },
      { id: 'n15', name: '2号热轧精整线', type: '热轧', x: 448, y: 250,w: 95,  h: 58, status: '运行', temp: '480℃',  load: 65, info: '定尺剪切\n在线喷印标识' },
      { id: 'n16', name: '热轧成品库',    type: '成品', x: 563, y: 250,w: 85,  h: 58, status: '运行', temp: '常温',  load: 72, info: '在库 3.2万t\n库位利用率 72%' }
    ]
  },
  {
    section: '冷轧区',
    nodes: [
      { id: 'n17', name: '酸洗机组',      type: '冷轧前',x: 3,   y: 330,w: 95,  h: 58, status: '运行', temp: '75℃',   load: 70, info: '推拉式酸洗\n盐酸再生 98%' },
      { id: 'n18', name: '1号 6辊冷轧机', type: '冷轧',  x: 118, y: 330,w: 105, h: 58, status: '停机', temp: '常温',  load: 0,  info: '🔧 更换工作辊中\n预计完成 4h后\nCRM-001' },
      { id: 'n19', name: '2号 5辊冷轧机', type: '冷轧',  x: 243, y: 330,w: 105, h: 58, status: '忙碌', temp: '60℃',   load: 94, info: 'HC340LA 1.8mm\nAGC精度 ±0.005mm' },
      { id: 'n20', name: '连续退火炉',    type: '热处理',x: 368, y: 330,w: 95,  h: 58, status: '运行', temp: '780℃',  load: 75, info: 'CQ级再结晶\n均热 60秒' },
      { id: 'n21', name: '冷轧成品库',    type: '成品',  x: 483, y: 330,w: 85,  h: 58, status: '运行', temp: '常温',  load: 61, info: '在库 1.6万t\n库位利用率 61%' }
    ]
  },
  {
    section: '成品发运区',
    nodes: [
      { id: 'n22', name: '质检中心',      type: '质检',  x: 3,   y: 410,w: 110, h: 58, status: '运行', temp: '常温',  load: 68, info: '光谱+力学+探伤\n今日检测 48炉次' },
      { id: 'n23', name: '精整包装线',    type: '包装',  x: 133, y: 410,w: 110, h: 58, status: '运行', temp: '常温',  load: 58, info: '自动打捆+称重\n喷码+贴标签' },
      { id: 'n24', name: '成品发货区',    type: '发运',  x: 263, y: 410,w: 130, h: 58, status: '忙碌', temp: '常温',  load: 84, info: '今日发运 26车\n在装 5车/待装 11车' }
    ]
  },
  {
    section: '公辅设施区',
    nodes: [
      { id: 'n25', name: '空压站',       type: '公辅', x: 413, y: 410, w: 80, h: 58, status: '运行', temp: '', load: 66, info: '供气压力 0.7MPa\n运行 6/8台' },
      { id: 'n26', name: '水处理中心',    type: '公辅', x: 513, y: 410, w: 80, h: 58, status: '运行', temp: '', load: 72, info: '浊环水 8500m³/h\n回水率 >98%' },
      { id: 'n27', name: '110kV变电所',  type: '公辅', x: 613, y: 410, w: 80, h: 58, status: '运行', temp: '', load: 68, info: '总负荷 62MW\n功率因数 0.96' }
    ]
  }
];

const PROCESS_FLOW_LINKS = [
  ['n1', 'n2', '#10b981'],
  ['n2', 'n3', '#f59e0b'],
  ['n2', 'n4', '#f59e0b'],
  ['n2', 'n5', '#f59e0b'],
  ['n3', 'n6', '#3b82f6'],
  ['n4', 'n7', '#3b82f6'],
  ['n5', 'n6', '#3b82f6'],
  ['n6', 'n8', '#ef4444'],
  ['n7', 'n8', '#ef4444'],
  ['n8', 'n9', '#10b981'],
  ['n8', 'n10', '#10b981'],
  ['n9', 'n11', '#f59e0b'],
  ['n10', 'n11', '#f59e0b'],
  ['n11', 'n12', '#3b82f6'],
  ['n11', 'n13', '#3b82f6'],
  ['n12', 'n14', '#ef4444'],
  ['n13', 'n14', '#ef4444'],
  ['n14', 'n15', '#10b981'],
  ['n15', 'n16', '#f59e0b'],
  ['n16', 'n17', '#3b82f6'],
  ['n17', 'n18', '#10b981'],
  ['n18', 'n19', '#10b981'],
  ['n19', 'n20', '#3b82f6'],
  ['n20', 'n21', '#f59e0b'],
  ['n21', 'n22', '#10b981'],
  ['n22', 'n23', '#3b82f6'],
  ['n23', 'n24', '#10b981']
];

export default function HeatMap({ user }) {
  const [activeNode, setActiveNode] = useState(null);
  const [tab, setTab] = useState('layout');
  const [kpi, setKpi] = useState(null);

  useEffect(() => { setKpi(getSteelKpiDashboard()); }, []);

  const allNodes = useMemo(() => STEEL_PRODUCTION_LINE.flatMap(s => s.nodes), []);

  const statusCounts = useMemo(() => {
    const c = { 运行: 0, 忙碌: 0, 报警: 0, 停机: 0, 待机: 0 };
    allNodes.forEach(n => c[n.status] = (c[n.status] || 0) + 1);
    return c;
  }, [allNodes]);

  return (
    <div>
      {/* 顶部4个KPI卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 22 }}>
        {[
          { label: '产线设备总数', value: `${allNodes.length} 台`, sub: `运行${statusCounts.运行 + statusCounts.忙碌 || 0}台 / 报警${statusCounts.报警 || 0}台 / 停机${statusCounts.停机 || 0}台`, color: '#1e40af', icon: '🏭' },
          { label: '系统整体运行率', value: `${kpi ? 100 - Math.round((statusCounts.停机 || 0) / allNodes.length * 100) : 88}%`, sub: `综合OEE效率 78.3%`, color: '#059669', icon: '📈' },
          { label: '产能利用率',     value: `${kpi ? kpi.equipment_utilization : 82}%`, sub: `计划内 产能 92%`, color: '#d97706', icon: '⚡' },
          { label: '工艺最高温区',   value: `${kpi ? '1650℃' : '1650℃'}`, sub: `转炉出钢 目标1630±20℃`, color: '#dc2626', icon: '🔥' }
        ].map((k, i) => (
          <div key={i} style={{
            padding: 18, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{k.label}</span>
              <span style={{ fontSize: 20 }}>{k.icon}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: k.color, marginBottom: 4 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Tab 切换 + 图例 */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 20px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', padding: 4, borderRadius: 8 }}>
          {[
            { k: 'layout', label: '🗺️ 产线布局图', desc: '钢铁全流程节点' },
            { k: 'busy',   label: '📊 分时忙闲热力', desc: '按设备×时段' },
            { k: 'load',   label: '🔥 工序负荷分布', desc: '6大工序' }
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              style={{
                padding: '8px 16px', fontSize: 13, fontWeight: tab === t.k ? 600 : 500,
                color: tab === t.k ? '#1d4ed8' : '#6b7280',
                background: tab === t.k ? '#fff' : 'transparent',
                border: 'none', borderRadius: 6, cursor: 'pointer',
                boxShadow: tab === t.k ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s'
              }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 12 }}>
          <span style={{ color: '#6b7280', fontWeight: 500 }}>状态图例：</span>
          {Object.entries(STEEL_STATUS_COLOR).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%', background: v.dot,
                display: 'inline-block',
                boxShadow: v.pulse ? `0 0 0 0 ${v.dot}` : 'none',
                animation: v.pulse ? 'pulse 1.6s infinite' : 'none'
              }} />
              <span style={{ color: '#4b5563' }}>{v.label} ({statusCounts[k] || 0})</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); } 70% { box-shadow: 0 0 0 8px rgba(34,197,94,0); } 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); } }`}</style>

      {/* Tab: 产线布局图 */}
      {tab === 'layout' && (
        <div style={{
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
          border: '1px solid #334155', borderRadius: 12,
          padding: 20, position: 'relative',
          minHeight: 520
        }}>
          {/* 区段标题 */}
          {STEEL_PRODUCTION_LINE.map((sec, si) => (
            <div key={sec.section} style={{ position: 'absolute', left: 10, top: 6 + si * 80, color: '#94a3b8', fontSize: 11, writingMode: 'vertical-lr', letterSpacing: 4 }}>
              {sec.section}
            </div>
          ))}

          {/* SVG 连线 */}
          <svg width="100%" height="490" viewBox="0 0 700 490" style={{ position: 'absolute', top: 20, left: 40, pointerEvents: 'none', overflow: 'visible' }}>
            {PROCESS_FLOW_LINKS.map(([a, b, color], i) => {
              const na = allNodes.find(n => n.id === a);
              const nb = allNodes.find(n => n.id === b);
              if (!na || !nb) return null;
              const x1 = na.x + na.w / 2, y1 = na.y + na.h / 2;
              const x2 = nb.x, y2 = nb.y + nb.h / 2;
              const dx = x2 - x1, dy = y2 - y1;
              const path = `M ${x1} ${y1} C ${x1 + dx * 0.5} ${y1}, ${x2 - dx * 0.5} ${y2}, ${x2} ${y2}`;
              return (
                <g key={i}>
                  <path d={path} fill="none" stroke={color} strokeWidth="2" strokeDasharray="6 4" opacity="0.7">
                    <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite" />
                  </path>
                  <polygon points={`${x2 - 8},${y2 - 5} ${x2},${y2} ${x2 - 8},${y2 + 5}`} fill={color} opacity="0.9" />
                </g>
              );
            })}
          </svg>

          {/* 设备节点 */}
          <div style={{ position: 'relative', height: 490, marginLeft: 30 }}>
            {allNodes.map(n => {
              const sc = STEEL_STATUS_COLOR[n.status] || STEEL_STATUS_COLOR.待机;
              return (
                <div key={n.id}
                  onClick={() => setActiveNode(activeNode === n.id ? null : n.id)}
                  style={{
                    position: 'absolute',
                    left: n.x, top: n.y,
                    width: n.w, height: n.h,
                    background: `linear-gradient(135deg, ${sc.bg}dd, ${sc.bg}99)`,
                    border: activeNode === n.id ? `2px solid #fbbf24` : `1px solid ${sc.bg}`,
                    borderRadius: 8,
                    padding: '6px 8px',
                    color: '#fff',
                    cursor: 'pointer',
                    boxShadow: sc.pulse ? `0 0 12px ${sc.dot}66` : 'none',
                    transition: 'all 0.2s',
                    zIndex: activeNode === n.id ? 10 : 1,
                    transform: activeNode === n.id ? 'scale(1.06)' : 'scale(1)',
                    overflow: 'hidden'
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2 }}>{n.name}</span>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: sc.dot, flexShrink: 0, marginTop: 2,
                      animation: sc.pulse ? 'pulse 1.6s infinite' : 'none'
                    }} />
                  </div>
                  <div style={{ fontSize: 10, opacity: 0.9, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{n.type}</span>
                    {n.temp && <span style={{ color: '#fde68a' }}>{n.temp}</span>}
                  </div>
                  <div style={{
                    position: 'absolute', bottom: 4, left: 6, right: 6, height: 4,
                    background: 'rgba(0,0,0,0.3)', borderRadius: 2, overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${n.load}%`, height: '100%',
                      background: n.load > 90 ? '#ef4444' : n.load > 70 ? '#f59e0b' : '#10b981',
                      transition: 'width 0.5s'
                    }} />
                  </div>
                  <div style={{ position: 'absolute', bottom: 10, right: 6, fontSize: 9, opacity: 0.85 }}>{n.load}%</div>
                </div>
              );
            })}
          </div>

          {/* 选中节点详情面板 */}
          {activeNode && (() => {
            const n = allNodes.find(x => x.id === activeNode);
            if (!n) return null;
            const sc = STEEL_STATUS_COLOR[n.status];
            return (
              <div style={{
                position: 'absolute', right: 20, top: 20, width: 240,
                background: 'rgba(15,23,42,0.95)', border: `1px solid ${sc.dot}`,
                borderRadius: 10, padding: 16, color: '#fff',
                boxShadow: `0 8px 24px rgba(0,0,0,0.5)`,
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{n.name}</div>
                  <span style={{
                    padding: '2px 10px', borderRadius: 10, fontSize: 11,
                    background: sc.dot + '33', color: sc.dot, fontWeight: 600,
                    border: `1px solid ${sc.dot}`
                  }}>{sc.label}</span>
                </div>
                <div style={{ borderTop: '1px dashed #334155', paddingTop: 10, fontSize: 12, lineHeight: 1.8, color: '#cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#94a3b8' }}>设备类型</span><span>{n.type}</span>
                  </div>
                  {n.temp && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#94a3b8' }}>工艺温度</span><span style={{ color: '#f97316', fontWeight: 600 }}>{n.temp}</span>
                  </div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#94a3b8' }}>负荷率</span>
                    <span style={{ color: n.load > 90 ? '#ef4444' : '#10b981', fontWeight: 600 }}>{n.load}%</span>
                  </div>
                  <div style={{ marginTop: 8, padding: 10, background: 'rgba(30,41,59,0.8)', borderRadius: 6, fontSize: 11, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    📌 {n.info}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Tab: 分时忙闲热力矩阵 */}
      {tab === 'busy' && (
        <div className="card" style={{ padding: 22 }}>
          <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>钢铁工序 × 时段 负荷热力矩阵</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>按5大核心工序 × 17个工作时段（06:00-22:00）展示实时负荷</div>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 11, color: '#6b7280' }}>
              <span>低</span>
              {['#ecfccb', '#bef264', '#fde047', '#fb923c', '#dc2626'].map((c, i) => (
                <span key={i} style={{ width: 24, height: 14, background: c, border: '1px solid #e5e7eb', borderRadius: 2 }} />
              ))}
              <span>高</span>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  <th style={{ padding: 8, textAlign: 'left', fontWeight: 600, color: '#374151', background: '#f9fafb', border: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>工序\时段</th>
                  {Array.from({ length: 17 }, (_, i) => (
                    <th key={i} style={{ padding: 6, fontWeight: 500, color: '#6b7280', background: '#f9fafb', border: '1px solid #e5e7eb', textAlign: 'center', minWidth: 40 }}>
                      {String(6 + i).padStart(2, '0')}:00
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {['转炉', '精炼', '连铸', '热轧', '冷轧'].map((proc, pi) => (
                  <tr key={proc}>
                    <td style={{ padding: 8, fontWeight: 600, color: '#111827', background: '#f9fafb', border: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{proc}</td>
                    {Array.from({ length: 17 }, (_, hi) => {
                      const seed = (pi * 7 + hi * 3 + Math.floor(Date.now() / 600000)) % 100;
                      const load = 35 + ((seed * 13) % 65);
                      const color = load > 90 ? '#dc2626' : load > 75 ? '#fb923c' : load > 55 ? '#fde047' : load > 40 ? '#bef264' : '#ecfccb';
                      return (
                        <td key={hi} title={`${proc} ${String(6 + hi).padStart(2, '0')}:00 负荷${load}%`}
                          style={{
                            padding: 0, border: '1px solid #fff', background: color,
                            textAlign: 'center', color: load > 70 ? '#fff' : '#111',
                            fontWeight: 600, height: 34, cursor: 'pointer'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.outline = '2px solid #1e40af'; }}
                          onMouseLeave={e => { e.currentTarget.style.outline = 'none'; }}
                        >
                          {load}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: 工序负荷分布 */}
      {tab === 'load' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          <div className="card" style={{ padding: 22 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: '#111827' }}>6大工序区域 实时负荷仪表</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                ['炼钢区（转炉+精炼）', 88, '转炉平均1650℃，精炼平均1560℃'],
                ['连铸区',                 89, '1号机1.2m/min，2号机1.0m/min'],
                ['热轧区',                 91, '加热炉1220℃，精轧出口880℃'],
                ['冷轧区',                 69, '1号机检修中，2号机HC340LA生产中'],
                ['质检包装发运',           70, '今日检测48炉次，发运26车'],
                ['公辅设施',               70, '水电气综合负载率70%']
              ].map(([name, load, note], i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{name}</span>
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color: load > 90 ? '#dc2626' : load > 75 ? '#f59e0b' : '#10b981'
                    }}>{load}%</span>
                  </div>
                  <div style={{ height: 20, background: '#f3f4f6', borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      width: `${load}%`, height: '100%',
                      background: `linear-gradient(90deg, ${load > 90 ? '#dc2626' : load > 75 ? '#f59e0b' : '#10b981'}, ${load > 90 ? '#f87171' : load > 75 ? '#fbbf24' : '#34d399'})`,
                      borderRadius: 10,
                      transition: 'width 0.6s ease'
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{note}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: '#111827' }}>6大区域 温度热力柱</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, height: 260, justifyContent: 'space-around', padding: '20px 0' }}>
              {[
                ['炼钢区', 1650, '#dc2626'],
                ['连铸区', 1540, '#ea580c'],
                ['热轧区', 1220, '#f59e0b'],
                ['冷轧区', 780,  '#eab308'],
                ['热处理', 780,  '#ca8a04'],
                ['成品区', 45,   '#3b82f6']
              ].map(([name, t, c], i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c, marginBottom: 4 }}>{t}℃</div>
                  <div style={{
                    width: '100%', maxWidth: 52, height: `${Math.min(200, t / 9)}px`,
                    background: `linear-gradient(180deg, ${c}, ${c}66)`,
                    borderRadius: '6px 6px 2px 2px',
                    boxShadow: `0 0 16px ${c}55`,
                    position: 'relative',
                    animation: `tower${i} 3s ease-in-out infinite`,
                    transformOrigin: 'bottom'
                  }}>
                    <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 8, height: 8, borderRadius: '50%', background: '#fff', opacity: 0.7 }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginTop: 8 }}>{name}</div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: 14, marginTop: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 8 }}>📊 能耗分布 (按工序占比)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                {[
                  ['炼钢（转炉+精炼）', 42, '#dc2626'],
                  ['热轧（加热+轧制）', 28, '#f59e0b'],
                  ['冷轧+热处理',       15, '#3b82f6'],
                  ['公辅（水电风气）',   10, '#10b981'],
                  ['其他（质检/包装）',  5,  '#6b7280']
                ].map(([n, p, c], i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ color: '#4b5563' }}>{n}</span>
                      <span style={{ color: c, fontWeight: 700 }}>{p}%</span>
                    </div>
                    <div style={{ height: 10, background: '#f3f4f6', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ width: `${p}%`, height: '100%', background: c, borderRadius: 5 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 底部实时KPI */}
      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        {[
          { k: '在制炉次', v: `${kpi?.in_progress_heats || 5} 炉`, s: '预计今日出钢 28炉' },
          { k: '钢包周转率', v: '8.4 次/日', s: '目标 ≥8次，提升3.5%' },
          { k: '连铸平均拉速', v: '1.12 m/min', s: '1号机1.20 / 2号机1.05' },
          { k: '轧制节奏',     v: '42 s/卷',   s: '1号热轧线，目标≤40s' },
          { k: '综合成材率',   v: `${(96.8).toFixed(1)}%`, s: '本月累计 96.5%' }
        ].map((x, i) => (
          <div key={i} style={{
            padding: '14px 16px', background: '#fff', borderRadius: 10,
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{x.k}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{x.v}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{x.s}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
