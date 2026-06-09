import React, { useState, useEffect, useMemo } from 'react';
import { query, insert, update, remove, list, getSteelKpiDashboard } from '../utils/api.js';

const STEEL_GRADES = [
  'Q235B', 'Q345B', 'DC01', 'DC04', 'SPHC', 'SPCC',
  'AH32', 'AH36', 'HC340LA', 'HC420LA', 'Q550D', 'Q690D'
];

const ORDER_STATUS = ['待排程', '已排程', '生产中', '临期待交付', '已完成', '已取消'];
const URGENCY_LABEL = ['无', '一般', '普通', '较急', '紧急', '特急'];
const URGENCY_COLOR = ['#9ca3af', '#6b7280', '#3b82f6', '#f59e0b', '#ef4444', '#dc2626'];

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysBetween = (d1, d2) => Math.ceil((new Date(d1) - new Date(d2)) / (1000 * 60 * 60 * 24));

function statusBadge(s) {
  const map = {
    '待排程':     { bg: '#fef3c7', color: '#92400e' },
    '已排程':     { bg: '#dbeafe', color: '#1e40af' },
    '生产中':     { bg: '#d1fae5', color: '#065f46' },
    '临期待交付': { bg: '#fee2e2', color: '#991b1b' },
    '已完成':     { bg: '#e0e7ff', color: '#3730a3' },
    '已取消':     { bg: '#f3f4f6', color: '#4b5563' }
  };
  const c = map[s] || { bg: '#f3f4f6', color: '#000' };
  return <span className="tag" style={{ background: c.bg, color: c.color, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{s}</span>;
}

function FormRow({ label, required, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1f2937', marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#dc2626', marginLeft: 4 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

export default function SalesOrders({ user }) {
  const [orders, setOrders] = useState([]);
  const [kpi, setKpi] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [urgencyFilter, setUrgencyFilter] = useState('全部');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    order_no: '', customer: '', steel_grade: 'Q235B', specification: '',
    quantity: 500, order_date: todayISO(), delivery_date: todayISO(15),
    urgency: 3, status: '待排程', note: ''
  });
  const [confirmDel, setConfirmDel] = useState(null);

  const refresh = () => {
    const all = list('sales_orders', 'created_at DESC');
    setOrders(all);
    setKpi(getSteelKpiDashboard());
  };
  useEffect(refresh, []);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (statusFilter !== '全部' && o.status !== statusFilter) return false;
      if (urgencyFilter !== '全部' && String(o.urgency) !== urgencyFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!(o.order_no || '').toLowerCase().includes(s) &&
            !(o.customer || '').toLowerCase().includes(s) &&
            !(o.steel_grade || '').toLowerCase().includes(s) &&
            !(o.specification || '').toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [orders, search, statusFilter, urgencyFilter]);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => ['待排程', '已排程'].includes(o.status)).length,
    pendingWeight: Math.round(orders.filter(o => ['待排程', '已排程'].includes(o.status)).reduce((s, o) => s + (o.quantity || 0), 0)),
    producing: orders.filter(o => o.status === '生产中').length,
    overdue: orders.filter(o => {
      if (o.status === '已完成' || o.status === '已取消') return false;
      return daysBetween(o.delivery_date, todayISO()) <= 7;
    }).length
  }), [orders]);

  const openNew = () => {
    setEditing(null);
    const seq = String((orders.length || 0) + 1001).padStart(4, '0');
    setForm({
      order_no: `SO-2026-${seq}`,
      customer: '', steel_grade: 'Q235B', specification: '1250×200',
      quantity: 500, order_date: todayISO(), delivery_date: todayISO(15),
      urgency: 3, status: '待排程', note: ''
    });
    setShowModal(true);
  };

  const openEdit = (o) => {
    setEditing(o.id);
    setForm({ ...o });
    setShowModal(true);
  };

  const save = () => {
    if (!form.customer.trim()) return alert('请填写客户名称');
    if (!form.specification.trim()) return alert('请填写规格');
    if (!(form.quantity > 0)) return alert('数量必须大于0');

    const payload = {
      ...form,
      updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    try {
      if (editing) {
        update('sales_orders', editing, payload);
      } else {
        payload.created_at = payload.updated_at;
        if (!payload.actual_output) payload.actual_output = 0;
        insert('sales_orders', payload);
      }
      setShowModal(false);
      refresh();
    } catch (e) { alert('保存失败: ' + e.message); }
  };

  const delOrder = (id) => {
    remove('sales_orders', id);
    setConfirmDel(null);
    refresh();
  };

  return (
    <div>
      {/* 4个KPI卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: '订单总数',     value: `${stats.total} 笔`,  sub: `共 ${Math.round(orders.reduce((s, o) => s + (o.quantity || 0), 0))} 吨`, color: 'linear-gradient(135deg, #1e40af, #3b82f6)', icon: '📋' },
          { label: '待排程订单',   value: `${stats.pending} 笔`,sub: `${stats.pendingWeight} 吨待排`,                                   color: 'linear-gradient(135deg, #f59e0b, #f97316)', icon: '📅' },
          { label: '生产中订单',   value: `${stats.producing} 笔`, sub: '跟踪在制炉次进度',                                           color: 'linear-gradient(135deg, #10b981, #059669)', icon: '🔥' },
          { label: '临期订单',     value: `${stats.overdue} 笔`, sub: '7天内需交付订单',                                              color: 'linear-gradient(135deg, #ef4444, #dc2626)', icon: '⚠️' }
        ].map((c, i) => (
          <div key={i} className="stat-card" style={{
            padding: 20, borderRadius: 12, background: '#fff', border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 90, height: 90, background: c.color, opacity: 0.08, borderRadius: '0 0 0 100%' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontSize: 13, color: '#6b7280' }}>{c.label}</div>
                <div style={{ fontSize: 22 }}>{c.icon}</div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{c.value}</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 工具栏 */}
      <div className="card" style={{ padding: 16, marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: '1 1 280px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>🔍</span>
          <input
            type="text" placeholder="搜索 订单号 / 客户 / 钢种 / 规格..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 14px 10px 40px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, minWidth: 140, background: '#fff' }}>
          <option>全部状态</option>
          {ORDER_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={urgencyFilter} onChange={e => setUrgencyFilter(e.target.value)}
          style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, minWidth: 140, background: '#fff' }}>
          <option value="全部">全部紧急度</option>
          {URGENCY_LABEL.slice(1).map((l, i) => <option key={i + 1} value={String(i + 1)}>{l}</option>)}
        </select>
        <button className="btn btn-primary" onClick={openNew}
          style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16 }}>+</span> 新建销售订单
        </button>
        <button className="btn btn-default" onClick={() => { setSearch(''); setStatusFilter('全部'); setUrgencyFilter('全部'); refresh(); }}
          style={{ padding: '10px 16px', fontSize: 13, borderRadius: 8, border: '1px solid #d1d5db', cursor: 'pointer', background: '#fff' }}>
          ↻ 重置/刷新
        </button>
      </div>

      {/* 订单表格 */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                {['订单号', '客户名称', '钢种', '规格', '数量(吨)', '紧急度', '下单日期', '交货期', '状态', '操作'].map(h => (
                  <th key={h} style={{ padding: '14px 14px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan="10" style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>暂无符合条件的销售订单</td></tr>
              )}
              {filtered.map(o => {
                const remain = daysBetween(o.delivery_date, todayISO());
                const nearDeadline = o.status !== '已完成' && o.status !== '已取消' && remain <= 7;
                return (
                  <tr key={o.id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 14px', color: '#1e40af', fontWeight: 600, whiteSpace: 'nowrap' }}>{o.order_no}</td>
                    <td style={{ padding: '12px 14px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={o.customer}>{o.customer}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>{o.steel_grade}</span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#6b7280' }}>{o.specification}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{o.quantity?.toLocaleString()}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        color: URGENCY_COLOR[o.urgency || 0] || '#6b7280',
                        fontWeight: 700,
                        fontSize: 12,
                        letterSpacing: 1
                      }}>{'★'.repeat(o.urgency || 0)}</span>
                      <span style={{ color: '#9ca3af', marginLeft: 4, fontSize: 11 }}>
                        {URGENCY_LABEL[o.urgency] || ''}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: '#6b7280' }}>{o.order_date}</td>
                    <td style={{ padding: '12px 14px', position: 'relative' }}>
                      <div style={{ color: nearDeadline ? '#dc2626' : '#1f2937', fontWeight: nearDeadline ? 700 : 500 }}>{o.delivery_date}</div>
                      {nearDeadline && (
                        <div style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>
                          {remain > 0 ? `剩${remain}天` : (remain === 0 ? '今日到期' : `逾期${-remain}天`)}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>{statusBadge(o.status)}</td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <button onClick={() => alert(
                        `订单详情：\n\n订单号: ${o.order_no}\n客户: ${o.customer}\n钢种: ${o.steel_grade}\n规格: ${o.specification}\n数量: ${o.quantity} 吨\n紧急度: ${URGENCY_LABEL[o.urgency]}\n下单: ${o.order_date}\n交货: ${o.delivery_date}\n状态: ${o.status}\n${o.note ? `\n备注: ${o.note}` : ''}\n${o.actual_output ? `已产: ${Math.round(o.actual_output)} 吨 (${Math.round(o.actual_output / o.quantity * 100)}%)` : ''}${o.quality_rate ? `\n合格率: ${o.quality_rate.toFixed(1)}%` : ''}`
                      )}
                        style={{ border: 'none', background: 'none', color: '#0891b2', cursor: 'pointer', padding: '4px 8px', fontSize: 12 }}>查看</button>
                      {(user?.role === 'admin' || user?.role === 'minister') && (
                        <>
                          <button onClick={() => openEdit(o)}
                            style={{ border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', padding: '4px 8px', fontSize: 12 }}>编辑</button>
                          <button onClick={() => setConfirmDel(o.id)}
                            style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px 8px', fontSize: 12 }}>删除</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '14px 18px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6b7280', fontSize: 12 }}>
          <div>共 <strong style={{ color: '#111827' }}>{filtered.length}</strong> 条记录 / 全部 {orders.length} 条</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-default" style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb', cursor: 'pointer' }}>上一页</button>
            <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: 'none', cursor: 'pointer', color: '#fff' }}>1</button>
            <button className="btn btn-default" style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #e5e7eb', cursor: 'pointer' }}>下一页</button>
          </div>
        </div>
      </div>

      {/* 新建/编辑订单模态框 */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal" onClick={e => e.stopPropagation()}
            style={{ width: '90%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111827' }}>
                {editing ? '📝 编辑销售订单' : '➕ 新建销售订单'}
              </h3>
              <button onClick={() => setShowModal(false)}
                style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: 22, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0 18px' }}>
              <FormRow label="订单编号" required>
                <input value={form.order_no} onChange={e => setForm({ ...form, order_no: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
              </FormRow>
              <FormRow label="客户名称" required>
                <input value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })}
                  placeholder="例：中国第一汽车集团有限公司"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
              </FormRow>
              <FormRow label="钢种牌号" required>
                <select value={form.steel_grade} onChange={e => setForm({ ...form, steel_grade: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#fff', outline: 'none' }}>
                  {STEEL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </FormRow>
              <FormRow label="规格(宽×厚/板幅)" required>
                <input value={form.specification} onChange={e => setForm({ ...form, specification: e.target.value })}
                  placeholder="例：1500×220mm 或 1250×3.0mm"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
              </FormRow>
              <FormRow label="订货数量(吨)" required>
                <input type="number" min="1" step="1" value={form.quantity}
                  onChange={e => setForm({ ...form, quantity: Math.max(0, Number(e.target.value) || 0) })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
              </FormRow>
              <FormRow label="紧急度" required>
                <div style={{ display: 'flex', gap: 4, padding: '4px 0' }}>
                  {URGENCY_LABEL.slice(1).map((l, i) => (
                    <label key={i + 1} style={{
                      flex: 1, textAlign: 'center', padding: '8px 4px', borderRadius: 6,
                      cursor: 'pointer', fontSize: 11,
                      border: '1px solid ' + (form.urgency === i + 1 ? URGENCY_COLOR[i + 1] : '#e5e7eb'),
                      background: form.urgency === i + 1 ? URGENCY_COLOR[i + 1] + '18' : '#fff',
                      color: form.urgency === i + 1 ? URGENCY_COLOR[i + 1] : '#6b7280',
                      fontWeight: form.urgency === i + 1 ? 700 : 500,
                      transition: 'all 0.1s'
                    }}>
                      <input type="radio" style={{ display: 'none' }} checked={form.urgency === i + 1} onChange={() => setForm({ ...form, urgency: i + 1 })} />
                      {'★'.repeat(i + 1)}<br />{l}
                    </label>
                  ))}
                </div>
              </FormRow>
              <FormRow label="下单日期">
                <input type="date" value={form.order_date} onChange={e => setForm({ ...form, order_date: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
              </FormRow>
              <FormRow label="要求交货期" required>
                <input type="date" value={form.delivery_date} onChange={e => setForm({ ...form, delivery_date: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
              </FormRow>
              <FormRow label="订单状态" required>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, background: '#fff', outline: 'none' }}>
                  {ORDER_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </FormRow>
              <div style={{ gridColumn: '1 / -1' }}>
                <FormRow label="备注(执行标准/用途/技术要求等)">
                  <textarea rows="3" value={form.note || ''} onChange={e => setForm({ ...form, note: e.target.value })}
                    placeholder="例：GB/T 1591-2018，用于汽车底盘结构件，要求零下20℃冲击功≥34J"
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, resize: 'vertical', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }} />
                </FormRow>
              </div>
              {(form.actual_output || form.quality_rate) && (
                <div style={{ gridColumn: '1 / -1', padding: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12, color: '#166534' }}>
                  📊 生产实际数据：已产出 {Math.round(form.actual_output || 0)} 吨 / 合格率 {form.quality_rate ? form.quality_rate.toFixed(1) + '%' : '—'}
                </div>
              )}
            </div>
            <div style={{ padding: '16px 22px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-default" onClick={() => setShowModal(false)}
                style={{ padding: '10px 20px', fontSize: 13, borderRadius: 8, border: '1px solid #d1d5db', cursor: 'pointer', background: '#fff' }}>取消</button>
              <button className="btn btn-primary" onClick={save}
                style={{ padding: '10px 28px', fontSize: 13, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer', color: '#fff', background: 'linear-gradient(135deg, #1e40af, #2563eb)' }}>
                💾 保存订单（写入localStorage）
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认 */}
      {confirmDel && (
        <div className="modal-overlay" onClick={() => setConfirmDel(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="modal" onClick={e => e.stopPropagation()}
            style={{ width: 420, background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: 22, background: '#fee2e2', borderBottom: '1px solid #fecaca', fontSize: 15, color: '#991b1b', fontWeight: 600 }}>
              ⚠️ 确认删除该销售订单？
            </div>
            <div style={{ padding: 20, fontSize: 13, color: '#4b5563', lineHeight: 1.8 }}>
              删除后订单将从数据库中移除，排程和生产模块将无法再读取该订单，此操作不可恢复。
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-default" onClick={() => setConfirmDel(null)}
                style={{ padding: '8px 16px', fontSize: 13, borderRadius: 6, border: '1px solid #d1d5db', cursor: 'pointer', background: '#fff' }}>取消</button>
              <button onClick={() => delOrder(confirmDel)}
                style={{ padding: '8px 20px', fontSize: 13, fontWeight: 600, borderRadius: 6, border: 'none', cursor: 'pointer', color: '#fff', background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
