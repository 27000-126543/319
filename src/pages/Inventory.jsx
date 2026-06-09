import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { formatDateTime, formatNumber } from '../utils/format.js';

const demoMaterials = [
  { id: 1, name: '铁矿石', code: 'MAT-001', category: '原料', unit: '吨', current_stock: 42000, safety_stock: 10000, unit_price: 850, supplier: '鞍钢矿业', consumption: [3800, 4200, 3600, 4000, 3900, 4100, 3800] },
  { id: 2, name: '废钢', code: 'MAT-002', category: '原料', unit: '吨', current_stock: 5600, safety_stock: 2000, unit_price: 2800, supplier: '本地回收公司', consumption: [680, 720, 650, 700, 690, 710, 680] },
  { id: 3, name: '焦炭', code: 'MAT-003', category: '原料', unit: '吨', current_stock: 12000, safety_stock: 3000, unit_price: 2200, supplier: '山西焦化', consumption: [950, 980, 920, 960, 940, 970, 950] },
  { id: 4, name: '石灰石', code: 'MAT-004', category: '辅料', unit: '吨', current_stock: 2800, safety_stock: 500, unit_price: 120, supplier: '本地建材', consumption: [180, 190, 175, 185, 182, 188, 180] },
  { id: 5, name: '锰铁合金', code: 'MAT-005', category: '合金', unit: '吨', current_stock: 420, safety_stock: 100, unit_price: 6500, supplier: '鄂尔多斯冶金', consumption: [18, 20, 17, 19, 18, 20, 18] },
  { id: 6, name: '硅铁合金', code: 'MAT-006', category: '合金', unit: '吨', current_stock: 210, safety_stock: 80, unit_price: 5800, supplier: '青海铁合金', consumption: [12, 13, 11, 12, 12, 13, 12] },
  { id: 7, name: '铝脱氧剂', code: 'MAT-007', category: '辅料', unit: '吨', current_stock: 65, safety_stock: 30, unit_price: 15000, supplier: '中铝集团', consumption: [3.5, 3.8, 3.2, 3.6, 3.4, 3.7, 3.5] },
  { id: 8, name: '保护渣', code: 'MAT-008', category: '辅料', unit: '吨', current_stock: 18, safety_stock: 20, unit_price: 8000, supplier: '洛阳耐火材料', consumption: [2.2, 2.4, 2.1, 2.3, 2.2, 2.3, 2.2], warning: 1 },
  { id: 9, name: '中间包', code: 'MAT-009', category: '耐材', unit: '个', current_stock: 5, safety_stock: 10, unit_price: 15000, supplier: '营口青花', consumption: [3, 4, 3, 4, 3, 4, 3], warning: 2 },
  { id: 10, name: '轧辊', code: 'MAT-010', category: '备件', unit: '支', current_stock: 12, safety_stock: 5, unit_price: 85000, supplier: '中钢邢机', consumption: [1, 1, 0, 1, 1, 1, 1] }
];

const demoWarnings = [
  { id: 1, material_id: 9, material_name: '中间包', warning_level: '紧急', current_stock: 5, safety_stock: 10, suggested_quantity: 20, status: '待处理', created_at: '2024-06-09 08:00' },
  { id: 2, material_id: 8, material_name: '保护渣', warning_level: '警告', current_stock: 18, safety_stock: 20, suggested_quantity: 15, status: '待处理', created_at: '2024-06-09 09:15' },
  { id: 3, material_id: 2, material_name: '废钢', warning_level: '提醒', current_stock: 5600, safety_stock: 2000, suggested_quantity: 3000, status: '处理中', created_at: '2024-06-08 16:30' }
];

const categories = [
  { value: '', label: '全部类别' },
  { value: '原料', label: '原料' },
  { value: '辅料', label: '辅料' },
  { value: '合金', label: '合金' },
  { value: '耐材', label: '耐材' },
  { value: '备件', label: '备件' }
];

const consumptionDays = ['06-03', '06-04', '06-05', '06-06', '06-07', '06-08', '06-09'];

function Inventory({ user }) {
  const [list, setList] = useState(demoMaterials);
  const [warnings, setWarnings] = useState(demoWarnings);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [inboundForm, setInboundForm] = useState({ material_id: '', quantity: '' });
  const [showInboundModal, setShowInboundModal] = useState(false);

  const filtered = list.filter(m => {
    if (categoryFilter && m.category !== categoryFilter) return false;
    if (search && !m.name.includes(search) && !m.code.includes(search)) return false;
    return true;
  });

  const getStockStatus = (m) => {
    const ratio = m.current_stock / m.safety_stock;
    if (ratio <= 0.5) return { label: '紧急', color: 'danger', level: 2 };
    if (ratio <= 1.0) return { label: '警告', color: 'warning', level: 1 };
    if (ratio <= 1.5) return { label: '偏低', color: 'warning', level: 0 };
    return { label: '充足', color: 'success', level: 0 };
  };

  const totalValue = list.reduce((s, m) => s + m.current_stock * m.unit_price, 0);
  const warningCount = list.filter(m => m.current_stock < m.safety_stock).length;

  const handleInbound = () => {
    if (!inboundForm.material_id || !inboundForm.quantity) { alert('请填写完整信息'); return; }
    const qty = Number(inboundForm.quantity);
    setList(list.map(m => m.id === Number(inboundForm.material_id)
      ? { ...m, current_stock: m.current_stock + qty }
      : m
    ));
    setShowInboundModal(false);
    setInboundForm({ material_id: '', quantity: '' });
    alert(`✅ 入库成功！`);
  };

  const createPurchase = (warn) => {
    if (!confirm(`创建采购单：${warn.material_name} ${warn.suggested_quantity}${list.find(m => m.id === warn.material_id)?.unit}？`)) return;
    setWarnings(warnings.map(w => w.id === warn.id ? { ...w, status: '已采购' } : w));
    alert('✅ 采购申请已创建，推送至采购部门');
  };

  const handleConsume = (materialId, quantity, heatNo) => {
    setList(list.map(m => m.id === materialId ? { ...m, current_stock: Math.max(0, m.current_stock - quantity) } : m));
    const mat = list.find(m => m.id === materialId);
    if (mat && mat.current_stock - quantity < mat.safety_stock) {
      alert(`⚠️ 物料【${mat.name}】库存低于安全库存，已生成采购预警`);
    }
  };

  return (
    <div>
      <div className="grid-4 mb-20">
        <div className="stat-card primary">
          <div className="stat-label">库存总价值</div>
          <div className="stat-value" style={{ fontSize: 22 }}>¥{formatNumber(totalValue / 10000, 0)}<span className="stat-unit">万</span></div>
        </div>
        <div className="stat-card info">
          <div className="stat-label">物料种类</div>
          <div className="stat-value">{list.length}<span className="stat-unit">种</span></div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">低于安全库存</div>
          <div className="stat-value">{warningCount}<span className="stat-unit">种</span></div>
          <div className="stat-change down">2 种紧急</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">本周消耗</div>
          <div className="stat-value">{formatNumber(list.reduce((s, m) => s + m.consumption?.reduce((a, b) => a + b, 0) || 0), 0)}<span className="stat-unit">吨</span></div>
        </div>
      </div>

      {warnings.filter(w => w.status === '待处理' || w.status === '处理中').length > 0 && (
        <div className="card mb-20">
          <div className="card-header" style={{ borderLeft: '4px solid #ff4d4f' }}>
            <span className="card-title">🚨 库存预警中心</span>
            <button className="btn btn-sm" onClick={() => setShowWarningModal(true)}>查看全部</button>
          </div>
          <div className="card-body" style={{ padding: 16 }}>
            <div className="grid-3" style={{ gap: 12 }}>
              {warnings.filter(w => w.status !== '已采购').map(w => {
                const mat = list.find(m => m.id === w.material_id);
                return (
                  <div key={w.id} className="card" style={{
                    borderLeft: `4px solid ${w.warning_level === '紧急' ? '#ff4d4f' : w.warning_level === '警告' ? '#faad14' : '#1890ff'}`
                  }}>
                    <div className="card-body" style={{ padding: 14 }}>
                      <div className="flex-between mb-8">
                        <span className="font-bold">{w.material_name}</span>
                        <span className={`tag tag-${w.warning_level === '紧急' ? 'danger' : w.warning_level === '警告' ? 'warning' : 'info'}`}>
                          {w.warning_level}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                        当前: <b style={{ color: '#ff4d4f' }}>{formatNumber(w.current_stock, 0)}</b> /
                        安全库存: {formatNumber(w.safety_stock, 0)} {mat?.unit}
                      </div>
                      <div className="progress-bar mb-12">
                        <div className="progress-bar-fill" style={{
                          width: `${Math.min(100, (w.current_stock / w.safety_stock) * 100)}%`,
                          background: w.warning_level === '紧急' ? '#ff4d4f' : '#faad14'
                        }} />
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span style={{ fontSize: 12, color: '#666', flex: 1 }}>
                          建议采购: <b>{formatNumber(w.suggested_quantity, 0)}</b>
                        </span>
                        <button className="btn btn-sm btn-primary" onClick={() => createPurchase(w)}>
                          下单
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="card mb-20">
        <div className="card-header"><span className="card-title">📉 近7天原辅料消耗趋势 (吨)</span></div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              {[
                { key: '铁矿石', color: '#1890ff', data: demoMaterials[0].consumption },
                { key: '废钢', color: '#ff6b35', data: demoMaterials[1].consumption },
                { key: '焦炭', color: '#52c41a', data: demoMaterials[2].consumption },
                { key: '合金', color: '#faad14', data: demoMaterials[4].consumption }
              ].map((item, idx) => (
                <Line
                  key={item.key}
                  type="monotone"
                  data={consumptionDays.map((d, i) => ({ date: d, value: item.data[i] }))}
                  dataKey="value"
                  name={item.key}
                  stroke={item.color}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <div className="search-box">
              <span>🔍</span>
              <input placeholder="搜索物料名称/编码..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            {(user.role === 'admin' || user.role === 'minister') && (
              <>
                <button className="btn" onClick={() => setShowInboundModal(true)}>
                  📥 入库登记
                </button>
                <button className="btn btn-primary" style={{ marginLeft: 8 }}>➕ 新增物料</button>
              </>
            )}
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>编码</th>
                  <th>物料名称</th>
                  <th>类别</th>
                  <th>当前库存</th>
                  <th>安全库存</th>
                  <th>库存状态</th>
                  <th>单价</th>
                  <th>供应商</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => {
                  const status = getStockStatus(m);
                  return (
                    <tr key={m.id}>
                      <td style={{ fontFamily: 'monospace', color: '#1890ff' }}>{m.code}</td>
                      <td className="font-bold">{m.name}</td>
                      <td>
                        <span className={`tag ${m.category === '原料' ? 'tag-primary' : m.category === '合金' ? 'tag-warning' : m.category === '辅料' ? 'tag-info' : 'tag-gray'}`}>
                          {m.category}
                        </span>
                      </td>
                      <td className="text-right">
                        <b style={{ color: status.level > 0 ? '#ff4d4f' : '#333' }}>
                          {formatNumber(m.current_stock, 0)}
                        </b> {m.unit}
                      </td>
                      <td className="text-right">{formatNumber(m.safety_stock, 0)} {m.unit}</td>
                      <td>
                        <span className={`tag tag-${status.color}`}>{status.label}</span>
                      </td>
                      <td className="text-right">¥{formatNumber(m.unit_price, 0)}</td>
                      <td style={{ fontSize: 12 }}>{m.supplier}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-sm" onClick={() => setShowDetailModal(m)}>详情</button>
                          <button className="btn btn-sm btn-warning">消耗</button>
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

      {showInboundModal && (
        <div className="modal-overlay" onClick={() => setShowInboundModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">📥 物料入库登记</div>
              <button className="modal-close" onClick={() => setShowInboundModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>选择物料<span className="required">*</span></label>
                  <select value={inboundForm.material_id} onChange={e => setInboundForm({ ...inboundForm, material_id: e.target.value })}>
                    <option value="">-- 请选择 --</option>
                    {list.map(m => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>入库数量<span className="required">*</span></label>
                  <input type="number" value={inboundForm.quantity} onChange={e => setInboundForm({ ...inboundForm, quantity: e.target.value })} placeholder="请输入数量" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowInboundModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleInbound}>确认入库</button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">📦 {showDetailModal.name} - 库存详情</div>
              <button className="modal-close" onClick={() => setShowDetailModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="grid-2 mb-16">
                <div className="card">
                  <div className="card-body" style={{ padding: 16 }}>
                    <div className="flex-between mb-8">
                      <span style={{ color: '#666' }}>当前库存</span>
                      <span className="font-bold" style={{ fontSize: 18, color: '#1890ff' }}>
                        {formatNumber(showDetailModal.current_stock, 0)} {showDetailModal.unit}
                      </span>
                    </div>
                    <div className="flex-between mb-8">
                      <span style={{ color: '#666' }}>安全库存</span>
                      <span>{formatNumber(showDetailModal.safety_stock, 0)} {showDetailModal.unit}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{
                        width: `${Math.min(100, showDetailModal.current_stock / showDetailModal.safety_stock * 100)}%`,
                        background: showDetailModal.current_stock < showDetailModal.safety_stock ? '#ff4d4f' : '#52c41a'
                      }} />
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-body" style={{ padding: 16 }}>
                    <div className="flex-between mb-8">
                      <span style={{ color: '#666' }}>库存价值</span>
                      <span className="font-bold" style={{ fontSize: 18 }}>
                        ¥{formatNumber(showDetailModal.current_stock * showDetailModal.unit_price, 0)}
                      </span>
                    </div>
                    <div className="flex-between mb-8">
                      <span style={{ color: '#666' }}>单价</span>
                      <span>¥{formatNumber(showDetailModal.unit_price, 0)}/{showDetailModal.unit}</span>
                    </div>
                    <div className="flex-between">
                      <span style={{ color: '#666' }}>供应商</span>
                      <span>{showDetailModal.supplier}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="font-bold mb-12">📊 近7天消耗</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={consumptionDays.map((d, i) => ({ date: d, 消耗: showDetailModal.consumption[i] }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="消耗" fill="#1890ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;
