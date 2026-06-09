import React, { useState, useEffect } from 'react';
import { query, insert, update, remove } from '../utils/api.js';
import { getUrgencyLabel, getUrgencyColor, formatDate, formatNumber } from '../utils/format.js';

const demoOrders = [
  { id: 1, order_no: 'SO-2024-0001', customer_name: '一汽集团', steel_grade: 'DC01', specification: '1.5mm*1250mm冷轧卷', quantity: 500, urgency: 5, delivery_date: '2024-06-16', status: '待排程', created_at: '2024-06-01 10:30:00' },
  { id: 2, order_no: 'SO-2024-0002', customer_name: '上汽集团', steel_grade: 'SPHC', specification: '3.0mm*1500mm热轧卷', quantity: 1200, urgency: 3, delivery_date: '2024-06-23', status: '待排程', created_at: '2024-06-02 09:15:00' },
  { id: 3, order_no: 'SO-2024-0003', customer_name: '宝钢加工', steel_grade: 'Q235B', specification: '150mm*150mm方坯', quantity: 800, urgency: 1, delivery_date: '2024-06-30', status: '待排程', created_at: '2024-06-03 14:00:00' },
  { id: 4, order_no: 'SO-2024-0004', customer_name: '中船重工', steel_grade: 'AH32', specification: '20mm*2000mm船板', quantity: 600, urgency: 4, delivery_date: '2024-06-19', status: '排程中', created_at: '2024-06-04 08:45:00' },
  { id: 5, order_no: 'SO-2024-0005', customer_name: '海尔集团', steel_grade: 'ST14', specification: '0.8mm*1000mm冷轧卷', quantity: 350, urgency: 2, delivery_date: '2024-06-27', status: '排程中', created_at: '2024-06-05 11:20:00' },
  { id: 6, order_no: 'SO-2024-0006', customer_name: '比亚迪汽车', steel_grade: 'HC340LA', specification: '2.0mm*1200mm冷轧卷', quantity: 420, urgency: 5, delivery_date: '2024-06-14', status: '待排程', created_at: '2024-06-08 16:00:00' },
  { id: 7, order_no: 'SO-2024-0007', customer_name: '中国建筑', steel_grade: 'HRB400E', specification: 'Φ25mm螺纹钢', quantity: 1500, urgency: 2, delivery_date: '2024-07-05', status: '生产中', created_at: '2024-06-02 13:30:00' },
  { id: 8, order_no: 'SO-2024-0008', customer_name: '格力电器', steel_grade: 'DC04', specification: '1.0mm*1000mm冷轧卷', quantity: 280, urgency: 3, delivery_date: '2024-06-25', status: '已完成', created_at: '2024-05-28 10:00:00' },
  { id: 9, order_no: 'SO-2024-0009', customer_name: '东方电气', steel_grade: 'Q345B', specification: '30mm*2500mm中厚板', quantity: 750, urgency: 4, delivery_date: '2024-06-20', status: '待排程', created_at: '2024-06-07 15:45:00' },
  { id: 10, order_no: 'SO-2024-0010', customer_name: '长安汽车', steel_grade: 'B340LA', specification: '1.8mm*1250mm冷轧卷', quantity: 380, urgency: 3, delivery_date: '2024-06-28', status: '待排程', created_at: '2024-06-08 09:30:00' }
];

const STEEL_GRADES = ['Q235B', 'Q345B', 'DC01', 'DC04', 'ST14', 'SPHC', 'HC340LA', 'B340LA', 'AH32', 'HRB400E'];
const STATUSES = [
  { value: '待排程', color: 'gray' },
  { value: '排程中', color: 'warning' },
  { value: '生产中', color: 'primary' },
  { value: '已完成', color: 'success' },
  { value: '已取消', color: 'danger' }
];

function SalesOrders({ user }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    order_no: '', customer_name: '', steel_grade: 'Q235B', specification: '',
    quantity: 100, urgency: 3, delivery_date: '', status: '待排程'
  });

  useEffect(() => {
    loadList();
  }, []);

  const loadList = async () => {
    try {
      setLoading(true);
      const data = await query('SELECT * FROM sales_orders ORDER BY urgency DESC, created_at DESC');
      setList(data && data.length > 0 ? data : demoOrders);
    } catch (e) {
      setList(demoOrders);
    } finally {
      setLoading(false);
    }
  };

  const filtered = list.filter(item => {
    if (statusFilter && item.status !== statusFilter) return false;
    if (urgencyFilter && item.urgency !== Number(urgencyFilter)) return false;
    if (search && !item.order_no.includes(search) && !item.customer_name.includes(search) && !item.steel_grade.includes(search)) return false;
    return true;
  });

  const today = new Date();
  const stats = {
    total: filtered.length,
    pending: filtered.filter(x => x.status === '待排程').length,
    producing: filtered.filter(x => x.status === '生产中').length,
    completed: filtered.filter(x => x.status === '已完成').length,
    urgent: filtered.filter(x => {
      const dd = new Date(x.delivery_date);
      const days = (dd - today) / (1000 * 60 * 60 * 24);
      return days <= 7 && x.status !== '已完成';
    }).length,
    totalQty: filtered.reduce((s, x) => s + x.quantity, 0)
  };

  const openCreate = () => {
    setEditing(null);
    const nextNo = `SO-${new Date().getFullYear()}-${String((list.length + 1)).padStart(4, '0')}`;
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 14);
    setForm({
      order_no: nextNo, customer_name: '', steel_grade: 'Q235B', specification: '',
      quantity: 100, urgency: 3, delivery_date: defaultDate.toISOString().split('T')[0], status: '待排程'
    });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({ ...item });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.customer_name || !form.specification || form.quantity <= 0) {
      alert('请完整填写订单信息');
      return;
    }
    try {
      if (editing) {
        await update('sales_orders', form, 'id = ?', [editing.id]);
      } else {
        await insert('sales_orders', form);
      }
      await loadList();
      setShowModal(false);
    } catch (e) {
      const newList = editing
        ? list.map(x => x.id === editing.id ? { ...x, ...form } : x)
        : [...list, { ...form, id: Date.now(), created_at: new Date().toISOString() }];
      setList(newList);
      setShowModal(false);
    }
  };

  const handleDelete = (item) => {
    if (confirm(`确定删除订单【${item.order_no}】？`)) {
      try {
        remove('sales_orders', 'id = ?', [item.id]);
      } catch (e) {}
      setList(list.filter(x => x.id !== item.id));
    }
  };

  const getDeliveryStatus = (item) => {
    if (item.status === '已完成') return { text: '已交付', color: 'success' };
    const days = (new Date(item.delivery_date) - today) / (1000 * 60 * 60 * 24);
    if (days < 0) return { text: `逾期${Math.abs(Math.floor(days))}天`, color: 'danger' };
    if (days <= 3) return { text: `剩${Math.floor(days)}天`, color: 'danger' };
    if (days <= 7) return { text: `剩${Math.floor(days)}天`, color: 'warning' };
    return { text: `剩${Math.floor(days)}天`, color: 'info' };
  };

  return (
    <div>
      <div className="grid-4 mb-20">
        <div className="stat-card primary">
          <div className="stat-label">订单总数</div>
          <div className="stat-value">{stats.total}<span className="stat-unit">笔</span></div>
          <div className="stat-change" style={{ color: '#999' }}>共 {formatNumber(stats.totalQty, 0)} 吨</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">待排程</div>
          <div className="stat-value">{stats.pending}<span className="stat-unit">笔</span></div>
          <div className="stat-change" style={{ color: '#999' }}>
            {formatNumber(filtered.filter(x => x.status === '待排程').reduce((s, x) => s + x.quantity, 0), 0)} 吨待排
          </div>
        </div>
        <div className="stat-card info">
          <div className="stat-label">生产中</div>
          <div className="stat-value">{stats.producing}<span className="stat-unit">笔</span></div>
        </div>
        <div className="stat-card danger">
          <div className="stat-label">临期订单</div>
          <div className="stat-value">{stats.urgent}<span className="stat-unit">笔</span></div>
          <div className="stat-change down">7天内需交付</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <div className="search-box">
              <span>🔍</span>
              <input placeholder="订单号/客户/钢种..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">全部状态</option>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.value}</option>)}
            </select>
            <select value={urgencyFilter} onChange={e => setUrgencyFilter(e.target.value)}>
              <option value="">全部紧急度</option>
              <option value="5">紧急 (5)</option>
              <option value="4">较高 (4)</option>
              <option value="3">一般 (3)</option>
              <option value="2">较低 (2)</option>
              <option value="1">普通 (1)</option>
            </select>
          </div>
          <div>
            {(user.role === 'admin' || user.role === 'minister') && (
              <button className="btn btn-primary" onClick={openCreate}>
                ➕ 新建订单
              </button>
            )}
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>客户名称</th>
                  <th>钢种</th>
                  <th>规格</th>
                  <th>数量</th>
                  <th>紧急度</th>
                  <th>交货期</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="9" className="text-center" style={{ padding: 40 }}>加载中...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="9"><div className="empty-state">📋 暂无订单数据</div></td></tr>
                ) : (
                  filtered.map(item => {
                    const statusInfo = STATUSES.find(s => s.value === item.status) || STATUSES[0];
                    const delStatus = getDeliveryStatus(item);
                    return (
                      <tr key={item.id}>
                        <td className="font-bold" style={{ fontFamily: 'monospace', color: '#1890ff' }}>{item.order_no}</td>
                        <td>{item.customer_name}</td>
                        <td><span className="tag tag-primary">{item.steel_grade}</span></td>
                        <td style={{ fontSize: 12, color: '#666' }}>{item.specification}</td>
                        <td className="text-right font-bold">{formatNumber(item.quantity, 0)} 吨</td>
                        <td>
                          <span className={`tag tag-${getUrgencyColor(item.urgency)}`}>
                            {getUrgencyLabel(item.urgency)}
                          </span>
                        </td>
                        <td>
                          <div>{formatDate(item.delivery_date)}</div>
                          <div style={{ fontSize: 11, marginTop: 2 }}>
                            <span className={`tag tag-${delStatus.color} tag-sm`} style={{ padding: '1px 6px' }}>
                              {delStatus.text}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`tag tag-${statusInfo.color}`}>{item.status}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-sm">详情</button>
                            {(user.role === 'admin' || user.role === 'minister') && item.status === '待排程' && (
                              <>
                                <button className="btn btn-sm" onClick={() => openEdit(item)}>编辑</button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item)}>删除</button>
                              </>
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
          <div className="pagination">
            <span style={{ fontSize: 13, color: '#999', marginRight: 16 }}>
              共 {filtered.length} 条记录
            </span>
            <button className="page-btn" disabled>«</button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">»</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editing ? '编辑订单' : '新建销售订单'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>订单号<span className="required">*</span></label>
                  <input value={form.order_no} onChange={e => setForm({ ...form, order_no: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>客户名称<span className="required">*</span></label>
                  <input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} placeholder="如: 一汽集团" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>钢种<span className="required">*</span></label>
                  <select value={form.steel_grade} onChange={e => setForm({ ...form, steel_grade: e.target.value })}>
                    {STEEL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>规格<span className="required">*</span></label>
                  <input value={form.specification} onChange={e => setForm({ ...form, specification: e.target.value })} placeholder="如: 1.5mm*1250mm冷轧卷" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>数量 (吨)<span className="required">*</span></label>
                  <input type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>交货日期<span className="required">*</span></label>
                  <input type="date" value={form.delivery_date} onChange={e => setForm({ ...form, delivery_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>紧急度</label>
                  <select value={form.urgency} onChange={e => setForm({ ...form, urgency: Number(e.target.value) })}>
                    <option value="1">1-普通</option>
                    <option value="2">2-较低</option>
                    <option value="3">3-一般</option>
                    <option value="4">4-较高</option>
                    <option value="5">5-紧急</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>状态</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.value}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editing ? '保存修改' : '创建订单'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesOrders;
