import React, { useState, useEffect, useMemo } from 'react';
import { query, list, findAll, getSteelKpiDashboard, resetSteelDatabase } from '../utils/api.js';

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function Dashboard({ user }) {
  const [kpi, setKpi] = useState(null);
  const [equips, setEquips] = useState([]);
  const [orders, setOrders] = useState([]);
  const [heats, setHeats] = useState([]);
  const [quality, setQuality] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [showReset, setShowReset] = useState(false);

  const refresh = () => {
    setKpi(getSteelKpiDashboard());
    setEquips(list('equipment'));
    setOrders(list('sales_orders', 'created_at DESC', 6));
    setHeats(list('production_heats', 'start_time DESC', 6));
    setQuality(list('quality_records', 'inspection_time DESC', 8));
    setMaterials(findAll('materials', null, 'stock ASC').filter(m => m.stock <= m.safe_stock).slice(0, 5));
  };
  useEffect(refresh, []);

  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - 6 + i);
      const iso = `${d.getMonth() + 1}/${d.getDate()}`;
      const seed = (d.getDate() * 13) % 100;
      return {
        date: iso,
        output: 220 + seed,
        qual: 96 + ((seed * 3) % 40) / 10,
        energy: 15000 + ((seed * 7) % 6000)
      };
    });
  }, []);

  const gradeDist = useMemo(() => {
    const groups = {};
    (list('sales_orders') || []).forEach(o => {
      groups[o.steel_grade] = (groups[o.steel_grade] || 0) + (o.quantity || 0);
    });
    const entries = Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
    const colors = ['#1e40af', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];
    return entries.map(([g, v], i) => ({ grade: g, weight: v, pct: Math.round(v / total * 1000) / 10, color: colors[i % colors.length] }));
  }, [kpi]);

  const maxOut = Math.max(...last7Days.map(d => d.output));
  const maxEnergy = Math.max(...last7Days.map(d => d.energy));

  if (!kpi) return <div style={{ padding: 60, textAlign: 'center', color: '#6b7280' }}>🔄 钢铁生产KPI数据加载中...</div>;

  const kpiCards = [
    { label: '今日产量', value: `${kpi.today_output}`, unit: '吨', change: '+2.8%', trend: 'up', color: '#1e40af', icon: '📦', sub: `本月累计 ${kpi.today_output * 26} 吨` },
    { label: '综合合格率', value: kpi.today_quality_rate, unit: '%', change: '+0.5%', trend: 'up', color: '#059669', icon: '✅', sub: '目标 ≥97%' },
    { label: '待排程订单', value: kpi.pending_orders, unit: '笔', change: `共${kpi.pending_orders_weight}吨`, trend: '', color: '#d97706', icon: '📅', sub: '待智能排程分配产能' },
    { label: '设备利用率', value: kpi.equipment_utilization, unit: '%', change: `${kpi.equipment_running}/${kpi.equipment_total}台运行`, trend: '', color: '#7c3aed', icon: '🏭', sub: '目标OEE≥85%' },
    { label: '今日能耗', value: kpi.today_energy, unit: 'kWh', change: '-3.2%', trend: 'down', color: '#0891b2', icon: '⚡', sub: '吨钢能耗 约69kWh/t' },
    { label: '在制炉次', value: kpi.in_progress_heats, unit: '炉', change: `3炉待开始`, trend: '', color: '#be123c', icon: '🔥', sub: '吹炼/精炼/连铸并行中' },
    { label: '待处理维保', value: kpi.pending_maintenance, unit: '单', change: `2单紧急`, trend: '', color: '#ea580c', icon: '🔧', sub: '2号转炉液压渗漏紧急' },
    { label: '质量报警', value: `${kpi.quality_alarms}`, unit: '条', change: `${kpi.locked_heats}炉锁定待处`, trend: 'up', color: '#dc2626', icon: '⚠️', sub: 'HEAT-005 S超标锁定🔒' }
  ];

  return (
    <div>
      {/* 顶部欢迎条 */}
      <div style={{
        padding: '18px 22px', marginBottom: 22, borderRadius: 12,
        background: 'linear-gradient(135deg, #1e3a6f 0%, #2c5282 50%, #1e40af 100%)',
        color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 12
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
            👋 欢迎，{user?.name || '钢铁调度员'}！今天是 {todayISO()}
          </div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>
            🏭 大型钢铁企业炼钢-连铸-轧制一体化生产调度系统 · 您的角色具有：{
              user?.role === 'admin' ? '全系统管理权限' :
              user?.role === 'minister' ? '排程审批 + 报表 + 质量解锁' :
              user?.role === 'inspector' ? '质检数据录入 + 炉次追溯' :
              user?.role === 'maintenance' ? '设备维保工单处理' :
              '操作权限：排程确认 + 工序上报'
            }
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={refresh}
            style={{ padding: '9px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#fff', color: '#1e40af', fontWeight: 600, fontSize: 12 }}>
            ↻ 刷新数据
          </button>
          <button onClick={() => setShowReset(true)}
            style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #fca5a5', cursor: 'pointer', background: 'rgba(255,255,255,0.08)', color: '#fecaca', fontWeight: 500, fontSize: 12 }}>
            🔄 重置演示数据库
          </button>
        </div>
      </div>

      {/* 8个KPI卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16, marginBottom: 24 }}>
        {kpiCards.map((k, i) => (
          <div key={i} style={{
            padding: 20, background: '#fff', borderRadius: 12,
            border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, background: `linear-gradient(135deg, ${k.color}22, transparent)`, borderRadius: '50%' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{k.label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 28, fontWeight: 700, color: k.color }}>{k.value}</span>
                    <span style={{ fontSize: 13, color: '#9ca3af' }}>{k.unit}</span>
                  </div>
                </div>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `linear-gradient(135deg, ${k.color}, ${k.color}cc)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, boxShadow: `0 4px 10px ${k.color}44`
                }}>{k.icon}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, marginTop: 8 }}>
                <span style={{
                  padding: '2px 8px', borderRadius: 10,
                  background: k.trend === 'up' ? '#dcfce7' : k.trend === 'down' ? '#dbeafe' : '#f3f4f6',
                  color: k.trend === 'up' ? '#166534' : k.trend === 'down' ? '#1e40af' : '#6b7280',
                  fontWeight: 600
                }}>
                  {k.trend === 'up' ? '↑' : k.trend === 'down' ? '↓' : '•'} {k.change}
                </span>
                <span style={{ color: '#9ca3af' }}>{k.sub}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 产量/合格率/能耗 + 钢种分布 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18, marginBottom: 24 }}>
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>近7天 产量/合格率/能耗 趋势</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>炼钢-连铸-热轧主流程关键指标跟踪</div>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#1e40af', fontWeight: 600 }}>
                <span style={{ width: 12, height: 12, background: '#1e40af', borderRadius: 3, display: 'inline-block' }} />产量(吨)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#059669', fontWeight: 600 }}>
                <span style={{ width: 12, height: 12, background: '#059669', borderRadius: '50%', display: 'inline-block' }} />合格率(%)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#0891b2', fontWeight: 600 }}>
                <span style={{ width: 12, height: 3, background: '#0891b2', display: 'inline-block' }} />能耗(kWh)
              </span>
            </div>
          </div>
          <div style={{ position: 'relative', height: 240 }}>
            {/* Y轴刻度 - 左侧 */}
            <div style={{ position: 'absolute', top: 0, bottom: 24, left: 0, width: 52, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: 10, color: '#9ca3af' }}>
              {[maxOut, maxOut * 0.75, maxOut * 0.5, maxOut * 0.25, 0].map((v, i) => <span key={i} style={{ textAlign: 'right', paddingRight: 4 }}>{Math.round(v)}</span>)}
            </div>
            {/* 网格线 */}
            <div style={{ position: 'absolute', top: 0, bottom: 24, left: 52, right: 52, borderLeft: '1px dashed #e5e7eb' }}>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${i * 25}%`, borderTop: '1px dashed #f3f4f6' }} />
              ))}
            </div>
            {/* 柱状图 - 产量 */}
            <div style={{ position: 'absolute', top: 0, bottom: 24, left: 52, right: 52, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around' }}>
              {last7Days.map((d, i) => (
                <div key={i} style={{ width: '11%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: '100%', height: `${d.output / maxOut * 100}%`, background: 'linear-gradient(180deg, #2563eb, #1e40af)', borderRadius: '4px 4px 0 0', position: 'relative', minHeight: 4 }}>
                    <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: '#1e40af', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {d.output}
                    </div>
                  </div>
                  {/* 合格率折线圆点 */}
                  <div style={{
                    position: 'absolute', bottom: `${24 + (d.qual - 90) / 10 * (100 - 24) - 24 + 0}%`,
                    width: 10, height: 10, borderRadius: '50%', background: '#059669',
                    border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </div>
              ))}
            </div>
            {/* X轴 */}
            <div style={{ position: 'absolute', bottom: 0, left: 52, right: 52, display: 'flex', justifyContent: 'space-around', fontSize: 11, color: '#6b7280' }}>
              {last7Days.map((d, i) => <span key={i}>{d.date}</span>)}
            </div>
            {/* Y轴刻度 - 右侧能耗 */}
            <div style={{ position: 'absolute', top: 0, bottom: 24, right: 0, width: 52, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: 10, color: '#9ca3af' }}>
              {[maxEnergy, maxEnergy * 0.75, maxEnergy * 0.5, maxEnergy * 0.25, 0].map((v, i) => <span key={i}>{Math.round(v / 1000)}k</span>)}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>订单钢种分布</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 18 }}>按订单总量(吨)统计 TOP 6 钢种</div>

          {/* 环形饼图 */}
          <div style={{ position: 'relative', width: 170, height: 170, margin: '0 auto 18px' }}>
            <svg width="170" height="170" viewBox="0 0 42 42">
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f3f4f6" strokeWidth="6" />
              {(() => {
                let offset = 25;
                return gradeDist.map((g, i) => {
                  const dash = g.pct * 1.26;
                  const el = (
                    <circle key={i} cx="21" cy="21" r="15.915" fill="transparent"
                      stroke={g.color} strokeWidth="6"
                      strokeDasharray={`${dash} ${126 - dash}`}
                      strokeDashoffset={-offset}
                      strokeLinecap="round"
                      transform="rotate(-90 21 21)"
                      style={{ transition: 'stroke-dasharray 0.8s ease' }}
                    />
                  );
                  offset += dash;
                  return el;
                });
              })()}
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>
                {gradeDist.reduce((s, g) => s + g.weight, 0).toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: '#6b7280' }}>吨 · {gradeDist.length}钢种</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {gradeDist.map((g, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', fontSize: 11 }}>
                <span style={{ width: 10, height: 10, background: g.color, borderRadius: 3, marginRight: 8 }} />
                <span style={{ fontWeight: 600, color: '#374151', width: 60 }}>{g.grade}</span>
                <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 3, marginRight: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${g.pct * 2}%`, height: '100%', background: g.color }} />
                </div>
                <span style={{ color: '#6b7280', width: 46, textAlign: 'right' }}>{g.weight.toLocaleString()}t</span>
                <span style={{ color: '#9ca3af', width: 32, textAlign: 'right' }}>{g.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 设备状态 + 在制炉次 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 18, marginBottom: 24 }}>
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>核心生产设备 实时状态</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                运行 {kpi.equipment_running} 台 / 总 {kpi.equipment_total} 台 · 利用率 {kpi.equipment_utilization}%
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
              {[['运行中', '#10b981'], ['维护中', '#f59e0b'], ['停机', '#6b7280']].map(([l, c]) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4b5563' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />{l}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
            {equips.map(e => {
              const sColor = e.status === '运行中' ? '#10b981' : e.status === '维护中' ? '#f59e0b' : '#6b7280';
              const maintRem = Math.max(0, Math.ceil((new Date(e.next_maintenance_date) - new Date()) / 86400000));
              return (
                <div key={e.id} style={{
                  padding: '12px 14px', border: `1px solid ${sColor}55`, borderRadius: 10,
                  background: `linear-gradient(135deg, ${sColor}11, #fff)`,
                  position: 'relative'
                }}>
                  <div style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: '50%', background: sColor,
                    boxShadow: `0 0 8px ${sColor}`, animation: 'pulse 1.6s infinite' }} />
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>
                    <span style={{ color: sColor, fontWeight: 700, marginRight: 4 }}>[{e.type}]</span>
                    {e.equip_no}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{e.name}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 10, color: '#6b7280' }}>
                    <span>📍 {e.location}</span>
                    <span>⚙️ {e.capacity}吨</span>
                    <span>🕐 {Math.round((e.run_hours || 0) / 1000)}k小时</span>
                    <span style={{ color: maintRem < 10 ? '#dc2626' : '#059669', fontWeight: maintRem < 10 ? 700 : 500 }}>
                      🔧 {maintRem < 10 ? `${maintRem}天后维保` : `维保周期OK`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>在制炉次 实时追踪</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>吹炼 → 精炼 → 连铸 → 热轧 → 冷轧 · 5工序</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {heats.map((h, hi) => {
              const steps = ['转炉吹炼', 'LF精炼', 'RH精炼', '连铸浇注', '热轧轧制'];
              const stepMap = {
                '转炉吹炼': 0, 'LF精炼': 1, 'RH精炼': 2, '连铸中': 3, '连铸等待': 3, '热轧完成': 4, '冷轧完成': 5
              };
              const currentIdx = Math.max(0, Math.min(5, (stepMap[h.status] ?? 0)));
              return (
                <div key={h.id} style={{
                  padding: 12, border: h.quality_locked ? '1px solid #fecaca' : '1px solid #e5e7eb',
                  borderRadius: 10, background: h.quality_locked ? '#fff5f5' : '#fff'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1e40af' }}>{h.heat_no}</span>
                      <span style={{ marginLeft: 8, padding: '1px 8px', background: '#eff6ff', color: '#1d4ed8', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
                        {h.steel_grade}
                      </span>
                      {h.quality_locked && (
                        <span style={{ marginLeft: 6, color: '#dc2626', fontSize: 11, fontWeight: 700 }}>🔒 已锁定</span>
                      )}
                    </div>
                    <span style={{
                      padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                      background: currentIdx >= 5 ? '#dcfce7' : currentIdx >= 3 ? '#dbeafe' : '#fef3c7',
                      color: currentIdx >= 5 ? '#166534' : currentIdx >= 3 ? '#1e40af' : '#92400e'
                    }}>{h.status}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {steps.map((s, si) => {
                      const done = si < currentIdx, active = si === currentIdx;
                      return (
                        <React.Fragment key={si}>
                          <div style={{
                            flex: 1, textAlign: 'center', padding: '4px 0', borderRadius: 4,
                            fontSize: 10, fontWeight: done ? 600 : 500,
                            background: done ? '#dcfce7' : active ? '#bfdbfe' : '#f3f4f6',
                            color: done ? '#166534' : active ? '#1e40af' : '#9ca3af',
                            minWidth: 48, position: 'relative'
                          }}>
                            {done && <span style={{ position: 'absolute', top: -6, right: -2, fontSize: 9 }}>✓</span>}
                            {s.slice(0, 2)}
                          </div>
                          {si < steps.length - 1 && (
                            <div style={{ width: 6, height: 2, background: si < currentIdx ? '#86efac' : '#e5e7eb' }} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: '#9ca3af' }}>
                    <span>计划{h.plan_weight}t / 实际{h.actual_weight || 0}t</span>
                    {h.tundish_life > 0 && <span>中间包寿命 第{h.tundish_life}炉</span>}
                    <span>👤 {h.operator}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 报警时间线 + 库存预警 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }}>
        <div className="card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>⚠️ 报警与预警时间线</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>质量报警 / 库存预警 / 设备预警 / 排程调整 最近事件</div>
            </div>
            <span style={{ padding: '3px 12px', background: '#fee2e2', color: '#991b1b', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
              {quality.filter(q => q.result === '不合格').length + materials.length} 条未处理
            </span>
          </div>

          <div style={{ position: 'relative', paddingLeft: 28 }}>
            <div style={{ position: 'absolute', left: 11, top: 4, bottom: 4, width: 2, background: 'linear-gradient(180deg, #ef4444, #f59e0b, #3b82f6)' }} />
            {[
              { type: '质量报警', color: '#ef4444', icon: '🚨', time: '13分钟前', title: '炉次 HEAT-005 质量锁定', desc: '转炉终点S含量0.008%，超标0.003%，建议LF深脱硫处理后评审' },
              { type: '设备预警', color: '#f59e0b', icon: '⚙️', time: '42分钟前', title: '2号步进加热炉温度偏高', desc: '2区1260℃，超上限30℃，自动减煤气开度12%' },
              { type: '库存预警', color: '#d97706', icon: '📦', time: '1小时前',   title: '中间包涂抹料 低于安全库存', desc: '库存72吨 / 安全库存50吨，建议3天内补货80吨' },
              { type: '排程调整', color: '#3b82f6', icon: '📅', time: '2小时前',   title: 'SO-2026-0005 紧急度上调为5★', desc: '中船黄埔 AH32 船板交期提前，需优先排产' },
              ...materials.map((m, i) => ({ type: '库存预警', color: '#dc2626', icon: '🔻', time: `${2 + i * 3}小时前`, title: `${m.name} 库存告警`, desc: `库存${m.stock}${m.unit} / 安全库存${m.safe_stock}${m.unit}，缺口${Math.round(m.safe_stock - m.stock)}${m.unit}` }))
            ].slice(0, 7).map((a, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: 16 }}>
                <div style={{
                  position: 'absolute', left: -28, top: 0, width: 22, height: 22, borderRadius: '50%',
                  background: a.color + '22', border: `2px solid ${a.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10
                }}>{a.icon}</div>
                <div style={{
                  padding: '10px 14px', borderLeft: `3px solid ${a.color}`,
                  background: a.color + '0a', borderRadius: '0 8px 8px 0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, padding: '1px 8px', background: a.color + '22', color: a.color, borderRadius: 8, fontWeight: 700 }}>
                      {a.type}
                    </span>
                    <span style={{ fontSize: 10, color: '#9ca3af' }}>{a.time}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 2 }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.6 }}>{a.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 22 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>近7天 能耗结构 面积图</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 18 }}>电耗(万kWh) · 煤气(万Nm³) · 水耗(千吨)</div>

          <svg width="100%" height="180" viewBox="0 0 320 180" style={{ display: 'block' }}>
            {(() => {
              const days = last7Days.length;
              const padL = 36, padR = 10, padT = 16, padB = 22;
              const w = 320 - padL - padR, h = 180 - padT - padB;
              const series = [
                { name: '电耗', color: '#1e40af', data: last7Days.map((d, i) => 85 + ((i * 13 + 7) % 30)) },
                { name: '煤气', color: '#f59e0b', data: last7Days.map((d, i) => 42 + ((i * 11 + 5) % 20)) },
                { name: '水耗', color: '#0ea5e9', data: last7Days.map((d, i) => 28 + ((i * 9 + 3) % 15)) }
              ];
              const maxV = 130;
              const mkPts = (d) => d.map((v, i) => {
                const x = padL + (w * i / (days - 1));
                const y = padT + h - (v / maxV) * h;
                return [x, y];
              });
              return (
                <g>
                  {[0, 1, 2, 3, 4].map(i => {
                    const y = padT + (h * i / 4);
                    const v = Math.round(maxV - (maxV * i / 4));
                    return <g key={i}>
                      <line x1={padL} y1={y} x2={320 - padR} y2={y} stroke="#f3f4f6" strokeDasharray="3 3" />
                      <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#9ca3af">{v}</text>
                    </g>;
                  })}
                  {series.map((s, si) => {
                    const pts = mkPts(s.data);
                    const d = `M ${pts[0][0]} ${padT + h} L ${pts.map(p => p.join(' ')).join(' L ')} L ${pts[pts.length - 1][0]} ${padT + h} Z`;
                    const line = `M ${pts.map(p => p.join(' ')).join(' L ')}`;
                    return (
                      <g key={si}>
                        <path d={d} fill={s.color} opacity="0.18" />
                        <path d={line} fill="none" stroke={s.color} strokeWidth="2" />
                        {pts.map((p, pi) => <circle key={pi} cx={p[0]} cy={p[1]} r="3" fill="#fff" stroke={s.color} strokeWidth="2" />)}
                      </g>
                    );
                  })}
                  {last7Days.map((d, i) => (
                    <text key={i} x={padL + (w * i / (days - 1))} y={180 - 6} fontSize="9" textAnchor="middle" fill="#6b7280">{d.date}</text>
                  ))}
                </g>
              );
            })()}
          </svg>

          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 10, fontSize: 11 }}>
            {[['电耗', '#1e40af'], ['煤气', '#f59e0b'], ['水耗', '#0ea5e9']].map(([l, c]) => (
              <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#4b5563', fontWeight: 600 }}>
                <span style={{ width: 12, height: 3, background: c, borderRadius: 2 }} />{l}
              </span>
            ))}
          </div>

          <div style={{ borderTop: '1px dashed #e5e7eb', marginTop: 20, paddingTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 10 }}>📋 最近销售订单 TOP 6</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {orders.map(o => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', background: '#f9fafb', borderRadius: 8, fontSize: 11 }}>
                  <span style={{ fontWeight: 700, color: '#1e40af', width: 86 }}>{o.order_no?.slice(0, 13)}</span>
                  <span style={{ padding: '1px 6px', background: '#eff6ff', color: '#1d4ed8', borderRadius: 8, marginRight: 6, fontWeight: 600 }}>{o.steel_grade}</span>
                  <span style={{ flex: 1, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {(o.customer || '').slice(0, 12)}
                  </span>
                  <span style={{ color: '#6b7280', marginRight: 8 }}>{o.quantity}吨</span>
                  <span style={{
                    padding: '1px 8px', borderRadius: 8, fontWeight: 600,
                    background: o.status === '已完成' ? '#dcfce7' : o.status === '生产中' ? '#dbeafe' : '#fef3c7',
                    color: o.status === '已完成' ? '#166534' : o.status === '生产中' ? '#1e40af' : '#92400e'
                  }}>{o.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showReset && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setShowReset(false)}>
          <div onClick={e => e.stopPropagation()}
            style={{ width: 420, background: '#fff', borderRadius: 12, padding: 22, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#92400e', marginBottom: 12 }}>⚠️ 确认重置演示数据库？</div>
            <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.8, marginBottom: 18 }}>
              所有销售订单、设备状态、炉次数据、维保工单、质检记录将重置为初始演示数据。
              此操作不可撤销！
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowReset(false)}
                style={{ padding: '9px 20px', fontSize: 13, borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>取消</button>
              <button onClick={() => {
                resetSteelDatabase();
                localStorage.removeItem('steel_prod_user');
                setShowReset(false);
                setTimeout(() => window.location.reload(), 400);
              }}
                style={{ padding: '9px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer' }}>确认重置</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
