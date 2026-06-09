import React, { useState, useEffect, useMemo } from 'react';
import { query, insert, update, list } from '../utils/api.js';
import { formatDateTime, formatDate, formatNumber, todayStr,
  getScheduleStatusLabel, getScheduleStatusColor,
  getItemStatusLabel, getItemStatusColor } from '../utils/format.js';

const demoSchedules = [
  {
    id: 1,
    schedule_date: todayStr(),
    version: 2,
    status: '待审批',
    created_by: 1,
    created_at: '2024-06-09 08:30:00',
    items: [
      { id: 1, schedule_id: 1, order_id: 1, equipment_id: 1, heat_no: 'H240609001', steel_grade: 'Q235B', planned_start_time: '08:00', planned_end_time: '09:30', status: '待开始', sequence: 1, tundish_life: 8, process_switch_time: 30 },
      { id: 2, schedule_id: 1, order_id: 1, equipment_id: 4, heat_no: 'H240609001', steel_grade: 'Q235B', planned_start_time: '09:30', planned_end_time: '10:30', status: '待开始', sequence: 1 },
      { id: 3, schedule_id: 1, order_id: 1, equipment_id: 6, heat_no: 'H240609001', steel_grade: 'Q235B', planned_start_time: '10:45', planned_end_time: '13:00', status: '待开始', sequence: 1 },
      { id: 4, schedule_id: 1, order_id: 1, equipment_id: 8, heat_no: 'H240609001', steel_grade: 'Q235B', planned_start_time: '14:00', planned_end_time: '16:30', status: '待开始', sequence: 1 },
      { id: 5, schedule_id: 1, order_id: 1, equipment_id: 10, heat_no: 'H240609001', steel_grade: 'DC01', planned_start_time: '16:45', planned_end_time: '19:00', status: '待开始', sequence: 1 },

      { id: 6, schedule_id: 1, order_id: 6, equipment_id: 2, heat_no: 'H240609002', steel_grade: 'HC340LA', planned_start_time: '08:15', planned_end_time: '09:45', status: '待确认', sequence: 1, tundish_life: 6, process_switch_time: 30 },
      { id: 7, schedule_id: 1, order_id: 6, equipment_id: 4, heat_no: 'H240609002', steel_grade: 'HC340LA', planned_start_time: '10:00', planned_end_time: '11:20', status: '待确认', sequence: 1 },
      { id: 8, schedule_id: 1, order_id: 6, equipment_id: 7, heat_no: 'H240609002', steel_grade: 'HC340LA', planned_start_time: '11:30', planned_end_time: '13:45', status: '待确认', sequence: 1 },
      { id: 9, schedule_id: 1, order_id: 6, equipment_id: 8, heat_no: 'H240609002', steel_grade: 'HC340LA', planned_start_time: '14:30', planned_end_time: '17:00', status: '待确认', sequence: 1 },
      { id: 10, schedule_id: 1, order_id: 6, equipment_id: 11, heat_no: 'H240609002', steel_grade: 'HC340LA', planned_start_time: '17:30', planned_end_time: '19:30', status: '待确认', sequence: 1 },

      { id: 11, schedule_id: 1, order_id: 4, equipment_id: 1, heat_no: 'H240609003', steel_grade: 'AH32', planned_start_time: '09:45', planned_end_time: '11:15', status: '执行中', sequence: 2, tundish_life: 10, process_switch_time: 45 },
      { id: 12, schedule_id: 1, order_id: 4, equipment_id: 5, heat_no: 'H240609003', steel_grade: 'AH32', planned_start_time: '11:30', planned_end_time: '12:50', status: '待开始', sequence: 2 },
      { id: 13, schedule_id: 1, order_id: 4, equipment_id: 6, heat_no: 'H240609003', steel_grade: 'AH32', planned_start_time: '13:15', planned_end_time: '15:30', status: '待开始', sequence: 2 },
      { id: 14, schedule_id: 1, order_id: 4, equipment_id: 9, heat_no: 'H240609003', steel_grade: 'AH32', planned_start_time: '16:00', planned_end_time: '18:30', status: '待开始', sequence: 2 }
    ]
  }
];

function getPendingOrdersFromDB() {
  try {
    const all = list('sales_orders', 'urgency DESC, delivery_date ASC');
    return (all || []).filter(o => ['待排程', '已排程'].includes(o.status)).map(o => ({
      id: o.id,
      order_no: o.order_no,
      customer_name: o.customer,
      steel_grade: o.steel_grade,
      quantity: o.quantity,
      urgency: o.urgency,
      delivery_date: o.delivery_date
    }));
  } catch (e) {
    console.error('读取销售订单失败:', e);
    return [];
  }
}

let PENDING_ORDERS = [];

const EQUIPMENTS = [
  { id: 1, name: '1号转炉', type: 'converter' },
  { id: 2, name: '2号转炉', type: 'converter' },
  { id: 4, name: 'RH精炼炉', type: 'refinery' },
  { id: 5, name: 'LF精炼炉', type: 'refinery' },
  { id: 6, name: '1号连铸机', type: 'caster' },
  { id: 7, name: '2号连铸机', type: 'caster' },
  { id: 8, name: '1号热轧机', type: 'rolling_mill' },
  { id: 9, name: '2号热轧机', type: 'rolling_mill' },
  { id: 10, name: '1号冷轧机', type: 'rolling_mill_cold' },
  { id: 11, name: '2号冷轧机', type: 'rolling_mill_cold' }
];

const TIME_SLOTS = [];
for (let h = 6; h <= 22; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

const PROCESS_TIMES = {
  converter: 90,
  refinery: 60,
  caster: 120,
  rolling_mill: 150,
  rolling_mill_cold: 120
};

const PROCESS_ORDER = ['converter', 'refinery', 'caster', 'rolling_mill'];

function parseTimeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function timeToPosition(timeStr) {
  return parseTimeToMinutes(timeStr);
}

function getProcessColor(steel_grade, status) {
  if (status === '执行中') return '#1890ff';
  if (status === '质量锁定') return '#ff4d4f';
  const colors = {
    'Q235B': '#52c41a',
    'Q345B': '#13c2c2',
    'DC01': '#1890ff',
    'DC04': '#722ed1',
    'ST14': '#eb2f96',
    'SPHC': '#fa8c16',
    'HC340LA': '#faad14',
    'B340LA': '#a0d911',
    'AH32': '#2f54eb',
    'HRB400E': '#f5222d'
  };
  return colors[steel_grade] || '#999';
}

function generateSchedule(orders, equipments) {
  const converters = equipments.filter(e => e.type === 'converter');
  const refineries = equipments.filter(e => e.type === 'refinery');
  const casters = equipments.filter(e => e.type === 'caster');
  const rollingMills = equipments.filter(e => e.type === 'rolling_mill');
  const coldMills = equipments.filter(e => e.type === 'rolling_mill_cold');

  const sortedOrders = [...orders].sort((a, b) => b.urgency - a.urgency || new Date(a.delivery_date) - new Date(b.delivery_date));

  const eqSchedule = {};
  equipments.forEach(e => { eqSchedule[e.id] = 6 * 60; });

  const items = [];
  const date = todayStr();
  let heatCounter = 1;

  sortedOrders.forEach((order, orderIdx) => {
    const heatsNeeded = Math.ceil(order.quantity / 110);

    for (let h = 0; h < Math.min(heatsNeeded, 2); h++) {
      const heatNo = `H${date.replace(/-/g, '').slice(2)}${String(heatCounter).padStart(3, '0')}`;
      heatCounter++;

      const needsColdRolling = ['DC01', 'DC04', 'ST14', 'HC340LA', 'B340LA'].includes(order.steel_grade);

      const stages = needsColdRolling ? ['converter', 'refinery', 'caster', 'rolling_mill', 'rolling_mill_cold']
        : ['converter', 'refinery', 'rolling_mill'];

      stages.forEach((stageType, stageIdx) => {
        const pool = stageType === 'converter' ? converters :
          stageType === 'refinery' ? refineries :
          stageType === 'caster' ? casters :
          stageType === 'rolling_mill' ? rollingMills : coldMills;

        if (!pool || pool.length === 0) return;

        let bestEq = pool[0];
        let earliestStart = eqSchedule[bestEq.id];
        pool.forEach(eq => {
          if (eqSchedule[eq.id] < earliestStart) {
            earliestStart = eqSchedule[eq.id];
            bestEq = eq;
          }
        });

        if (stageIdx > 0) {
          const prevStage = items.find(it => it.heat_no === heatNo && it.sequence === stageIdx);
          if (prevStage) {
            const prevEnd = parseTimeToMinutes(prevStage.planned_end_time);
            earliestStart = Math.max(earliestStart, prevEnd + 15);
          }
        }

        if (stageType === 'caster' && items.length > 0) {
          const prevCaster = items.filter(it => it.equipment_id === bestEq.id).slice(-1)[0];
          if (prevCaster) {
            const prevGrade = prevCaster.steel_grade;
            if (prevGrade !== order.steel_grade) {
              earliestStart += 30;
            }
          }
        }

        const duration = PROCESS_TIMES[stageType] || 90;
        const endTime = earliestStart + duration;

        items.push({
          id: items.length + 1,
          order_id: order.id,
          equipment_id: bestEq.id,
          heat_no: heatNo,
          steel_grade: order.steel_grade,
          planned_start_time: minutesToTime(earliestStart),
          planned_end_time: minutesToTime(endTime),
          status: orderIdx < 3 ? (h === 0 ? '执行中' : '待确认') : '待开始',
          sequence: stageIdx + 1,
          tundish_life: stageType === 'caster' ? (8 + Math.floor(Math.random() * 5)) : undefined,
          process_switch_time: stageType === 'caster' ? (order.steel_grade !== 'Q235B' ? 45 : 30) : undefined
        });

        eqSchedule[bestEq.id] = endTime + (stageType === 'caster' ? 20 : 10);
      });
    }
  });

  return items;
}

function Schedule({ user }) {
  const [activeTab, setActiveTab] = useState('gantt');
  const [pendingOrders, setPendingOrders] = useState([]);
  const [schedules, setSchedules] = useState(demoSchedules);
  const [selectedSchedule, setSelectedSchedule] = useState(demoSchedules[0]);
  const [scheduleDate, setScheduleDate] = useState(todayStr());
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ reason: '', new_plan: '' });
  const [adjustments, setAdjustments] = useState([
    { id: 1, schedule_item_id: 8, requested_by: 3, reason: '2号连铸机液压系统需紧急检查', status: '待审批', original_plan: '11:30-13:45 @2号连铸机', new_plan: '推迟至14:30开始', created_at: '2024-06-09 09:15' }
  ]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    PENDING_ORDERS = getPendingOrdersFromDB();
    setPendingOrders(PENDING_ORDERS);
    if (PENDING_ORDERS.length > 0) {
      const generatedItems = generateSchedule(PENDING_ORDERS.slice(0, 5), EQUIPMENTS);
      const autoSchedule = {
        id: 999,
        schedule_date: todayStr(),
        version: 1,
        status: '已生成',
        created_by: user?.id || 1,
        created_at: new Date().toLocaleString(),
        items: generatedItems
      };
      setSchedules([autoSchedule, ...demoSchedules]);
      setSelectedSchedule(autoSchedule);
    }
  }, []);

  const currentSchedule = schedules.find(s => s.schedule_date === scheduleDate) || schedules[0];

  const itemsByEquipment = useMemo(() => {
    if (!currentSchedule || !currentSchedule.items) return {};
    const map = {};
    EQUIPMENTS.forEach(eq => { map[eq.id] = { ...eq, items: [] }; });
    currentSchedule.items.forEach(item => {
      if (map[item.equipment_id]) map[item.equipment_id].items.push(item);
    });
    return map;
  }, [currentSchedule]);

  const heatGroups = useMemo(() => {
    if (!currentSchedule || !currentSchedule.items) return {};
    const groups = {};
    currentSchedule.items.forEach(it => {
      if (!groups[it.heat_no]) groups[it.heat_no] = [];
      groups[it.heat_no].push(it);
    });
    return groups;
  }, [currentSchedule]);

  const stats = useMemo(() => {
    if (!currentSchedule || !currentSchedule.items) return { total: 0, heats: 0, running: 0, pending: 0, completed: 0 };
    const heatNos = new Set(currentSchedule.items.map(i => i.heat_no));
    return {
      total: currentSchedule.items.length,
      heats: heatNos.size,
      running: currentSchedule.items.filter(i => i.status === '执行中').length,
      pending: currentSchedule.items.filter(i => i.status === '待开始' || i.status === '待确认').length,
      adjustments: adjustments.length
    };
  }, [currentSchedule, adjustments]);

  const handleGenerateSchedule = async () => {
    setGenerating(true);
    PENDING_ORDERS = getPendingOrdersFromDB();
    setPendingOrders(PENDING_ORDERS);
    setTimeout(() => {
      const ordersToSchedule = selectedOrders.length > 0
        ? PENDING_ORDERS.filter(o => selectedOrders.includes(o.id))
        : PENDING_ORDERS;
      const newItems = generateSchedule(ordersToSchedule, EQUIPMENTS);
      const newSchedule = {
        id: (schedules.length + 1),
        schedule_date: scheduleDate,
        version: (currentSchedule?.version || 0) + 1,
        status: '待审批',
        created_by: user?.id || 1,
        created_at: new Date().toLocaleString(),
        items: newItems
      };
      setSchedules([newSchedule, ...schedules]);
      setSelectedSchedule(newSchedule);
      setShowGenerateModal(false);
      setGenerating(false);
      setSelectedOrders([]);
      alert('✅ 排程生成成功！\n\n排程说明：\n· 按紧急度+交货期排序\n· 考虑转炉-连铸时序约束\n· 中间包寿命8-12炉\n· 钢种切换时间30-45分钟\n· 能耗优化（低负荷时段优先安排');
    }, 1500);
  };

  const handleApprove = () => {
    if (!confirm('确定批准此排程？批准后将推送至各工段终端。')) return;
    const updated = { ...currentSchedule, status: '已批准', approved_by: user?.id, approved_at: formatDateTime(new Date()) };
    setSchedules(schedules.map(s => s.id === currentSchedule.id ? updated : s));
    setSelectedSchedule(updated);
  };

  const handleReject = () => {
    const reason = prompt('请输入驳回理由：');
    if (!reason) return;
    const updated = { ...currentSchedule, status: '已驳回' };
    setSchedules(schedules.map(s => s.id === currentSchedule.id ? updated : s));
    setSelectedSchedule(updated);
  };

  const handleConfirm = (item) => {
    if (!confirm(`确认接收炉次 ${item.heat_no}？`)) return;
    const updatedItems = currentSchedule.items.map(it =>
      it.id === item.id ? { ...it, status: '已确认' } : it
    );
    const updated = { ...currentSchedule, items: updatedItems };
    setSchedules(schedules.map(s => s.id === currentSchedule.id ? updated : s));
    setSelectedSchedule(updated);
  };

  const handleRequestAdjust = (item) => {
    setAdjustItem(item);
    const eq = EQUIPMENTS.find(e => e.id === item.equipment_id);
    setAdjustForm({
      reason: '',
      new_plan: `${item.heat_no} @${eq?.name} 原计划: ${item.planned_start_time}-${item.planned_end_time}\n建议调整为: `
    });
    setShowAdjustModal(true);
  };

  const submitAdjust = () => {
    if (!adjustForm.reason) { alert('请填写调整原因'); return; }
    setAdjustments([{
      id: adjustments.length + 1,
      schedule_item_id: adjustItem.id,
      requested_by: user?.id || 3,
      reason: adjustForm.reason,
      original_plan: `${adjustItem.heat_no} 原计划`,
      new_plan: adjustForm.new_plan,
      status: '待审批',
      created_at: formatDateTime(new Date())
    }, ...adjustments]);
    setShowAdjustModal(false);
    alert('调整申请已提交，等待部长审批');
  };

  const handleApproveAdjust = (adj) => {
    setAdjustments(adjustments.map(a => a.id === adj.id ? { ...a, status: '已批准', reviewed_by: user?.id, reviewed_at: formatDateTime(new Date()) } : a));
    alert('调整已批准');
  };

  const handleRejectAdjust = (adj) => {
    setAdjustments(adjustments.map(a => a.id === adj.id ? { ...a, status: '已驳回' } : a));
  };

  const toggleOrderSelect = (id) => {
    setSelectedOrders(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllOrders = () => {
    if (selectedOrders.length === pendingOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(pendingOrders.map(o => o.id));
    }
  };

  const COLUMN_WIDTH = 55;
  const DAY_START_MIN = 6 * 60;
  const DAY_END_MIN = 23 * 60;
  const TOTAL_WIDTH = (DAY_END_MIN - DAY_START_MIN) / 30 * COLUMN_WIDTH;

  const renderGantt = () => (
    <div className="gantt-container">
      <div style={{ minWidth: TOTAL_WIDTH + 200 }}>
        <div className="gantt-header">
          <div className="gantt-header-cell task-name">设备 / 时间</div>
          {TIME_SLOTS.map(t => (
            <div key={t} className="gantt-header-cell" style={{ width: COLUMN_WIDTH, minWidth: COLUMN_WIDTH }}>
              {t}
            </div>
          ))}
        </div>

        {EQUIPMENTS.map(eq => {
          const eqData = itemsByEquipment[eq.id];
          const eqItems = eqData?.items || [];
          return (
            <div key={eq.id} className="gantt-row">
              <div className="gantt-cell task-name">
                <div style={{ fontSize: 12, fontWeight: 600 }}>{eq.name}</div>
                <div style={{ fontSize: 11, color: '#999' }}>
                  {eq.type === 'converter' ? '转炉' : eq.type === 'refinery' ? '精炼炉' : eq.type === 'caster' ? '连铸机' : eq.type === 'rolling_mill' ? '热轧机' : '冷轧机'}
                </div>
              </div>
              <div style={{
                position: 'relative',
                flex: 1,
                height: 56,
                borderRight: '1px solid #e8e8e8'
              }}>
                {TIME_SLOTS.map((t, i) => {
                  const mins = parseTimeToMinutes(t);
                  const left = (mins - DAY_START_MIN) / 30 * COLUMN_WIDTH;
                  return (
                    <div
                      key={t}
                      style={{
                        position: 'absolute',
                        left: left,
                        top: 0,
                        bottom: 0,
                        width: COLUMN_WIDTH,
                        borderLeft: i % 2 === 0 ? '1px solid #f5f5f5' : 'none',
                        backgroundColor: (i % 4 === 0 ? 'rgba(24, 144, 255, 0.03)' : 'transparent')
                      }}
                    />
                  );
                })}

                {eqItems.map((item, idx) => {
                  const startMin = parseTimeToMinutes(item.planned_start_time);
                  const endMin = parseTimeToMinutes(item.planned_end_time);
                  const left = Math.max(0, (startMin - DAY_START_MIN) / 30 * COLUMN_WIDTH);
                  const width = Math.max(40, (endMin - startMin) / 30 * COLUMN_WIDTH - 4);
                  const color = getProcessColor(item.steel_grade, item.status);
                  return (
                    <div
                      key={item.id}
                      className="gantt-bar"
                      title={`${item.heat_no} | ${item.steel_grade} | ${item.planned_start_time}-${item.planned_end_time} | ${getItemStatusLabel(item.status)}`}
                      style={{
                        left: left + 2,
                        width: width,
                        background: color,
                        opacity: item.status === '待开始' ? 0.75 : 1,
                        border: item.status === '执行中' ? '2px solid #096dd9' : 'none',
                        boxShadow: item.status === '执行中' ? '0 0 8px rgba(24,144,255,0.5)' : 'none'
                      }}
                      onClick={() => {
                        if (user.role === 'operator' && item.status === '待确认') {
                          handleConfirm(item);
                        }
                      }}
                    >
                      {width > 80 ? `${item.heat_no.slice(-4)} ${item.steel_grade}` : item.heat_no.slice(-3)}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      <div className="grid-4 mb-20">
        <div className="stat-card primary">
          <div className="stat-label">排程工序</div>
          <div className="stat-value">{stats.total}<span className="stat-unit">项</span></div>
        </div>
        <div className="stat-card steel-orange">
          <div className="stat-label">计划炉次</div>
          <div className="stat-value">{stats.heats}<span className="stat-unit">炉</span></div>
        </div>
        <div className="stat-card info">
          <div className="stat-label">执行中</div>
          <div className="stat-value">{stats.running}<span className="stat-unit">项</span></div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">调整申请</div>
          <div className="stat-value">{adjustments.filter(a => a.status === '待审批').length}<span className="stat-unit">单</span></div>
        </div>
      </div>

      <div className="card mb-20">
        <div className="card-header">
          <div className="flex gap-16">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 13, color: '#666' }}>排程日期:</label>
              <input
                type="date"
                value={scheduleDate}
                onChange={e => setScheduleDate(e.target.value)}
              />
            </div>
            <select
              value={currentSchedule?.version || 1}
              style={{ minWidth: 100 }}
              onChange={e => {
                const v = Number(e.target.value);
                const s = schedules.find(x => x.version === v);
                if (s) setSelectedSchedule(s);
              }}
            >
              {schedules.map(s => <option key={s.id} value={s.version}>版本 v{s.version}</option>)}
            </select>
            <span className={`tag tag-${getScheduleStatusColor(currentSchedule?.status)}`}>
              {getScheduleStatusLabel(currentSchedule?.status)}
            </span>
          </div>
          <div className="flex gap-8">
            {(user.role === 'admin' || user.role === 'minister') && (
              <>
                <button className="btn" onClick={() => setShowGenerateModal(true)}>
                  🤖 智能排程
                </button>
                {currentSchedule?.status === '待审批' && (
                  <>
                    <button className="btn btn-success" onClick={handleApprove}>
                      ✅ 批准排程
                    </button>
                    <button className="btn btn-danger" onClick={handleReject}>
                      ❌ 驳回
                    </button>
                  </>
                )}
              </>
            )}
            <button className="btn">📄 导出Excel</button>
          </div>
        </div>
        <div className="card-body">
          <div className="tabs">
            <div className={`tab-item ${activeTab === 'gantt' ? 'active' : ''}`} onClick={() => setActiveTab('gantt')}>
              📊 甘特图
            </div>
            <div className={`tab-item ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
              📋 排程明细
            </div>
            <div className={`tab-item ${activeTab === 'adjust' ? 'active' : ''}`} onClick={() => setActiveTab('adjust')}>
              🔄 调整审批 {adjustments.filter(a => a.status === '待审批').length > 0 ? `(${adjustments.filter(a => a.status === '待审批').length})` : ''}
            </div>
            <div className={`tab-item ${activeTab === 'heat' ? 'active' : ''}`} onClick={() => setActiveTab('heat')}>
              🔥 炉次关联
            </div>
          </div>

          {activeTab === 'gantt' && (
            <>
              <div className="flex gap-16 mb-16" style={{ flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#666' }}>
                  钢种图例：
                </span>
                {['Q235B', 'Q345B', 'DC01', 'HC340LA', 'AH32', 'SPHC'].map(g => (
                  <span key={g} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                    <span style={{
                      display: 'inline-block',
                      width: 14,
                      height: 14,
                      background: getProcessColor(g),
                      borderRadius: 3
                    }} />
                    {g}
                  </span>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#666' }}>
                  💡 提示: 点击高亮框=执行中，浅色=待开始；操作员点击"待确认"任务可确认接收
                </span>
              </div>
              {renderGantt()}
            </>
          )}

          {activeTab === 'list' && (
            <div className="table-container">
              <table>
                <thead>
                <tr>
                  <th>炉次号</th>
                  <th>钢种</th>
                  <th>工序</th>
                  <th>设备</th>
                  <th>计划开始</th>
                  <th>计划结束</th>
                  <th>中间包寿命</th>
                  <th>切换时间</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {currentSchedule?.items?.map((item, idx) => {
                  const eq = EQUIPMENTS.find(e => e.id === item.equipment_id);
                  const order = pendingOrders.find(o => o.id === item.order_id);
                  return (
                    <tr key={item.id} style={{
                      borderLeft: `3px solid ${getProcessColor(item.steel_grade)}`
                    }}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.heat_no}</td>
                      <td><span className="tag tag-primary">{item.steel_grade}</span></td>
                      <td>工序{item.sequence}
                        {item.tundish_life && <span className="tag tag-warning" style={{ marginLeft: 6 }}>
                          中间包:{item.tundish_life}炉
                        </span>}
                      </td>
                      <td>{eq?.name}</td>
                      <td>{item.planned_start_time}</td>
                      <td>{item.planned_end_time}</td>
                      <td>{item.tundish_life || '-'}</td>
                      <td>{item.process_switch_time ? `${item.process_switch_time}min` : '-'}</td>
                      <td>
                        <span className={`tag tag-${getItemStatusColor(item.status)}`}>
                          {getItemStatusLabel(item.status)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {user.role === 'operator' && item.status === '待确认' && (
                            <button className="btn btn-sm btn-success" onClick={() => handleConfirm(item)}>
                              确认接收
                            </button>
                          )}
                          {user.role === 'operator' && ['待确认', '已确认'].includes(item.status) && (
                            <button className="btn btn-sm btn-warning" onClick={() => handleRequestAdjust(item)}>
                              申请调整
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
          )}

          {activeTab === 'adjust' && (
            <div>
              {adjustments.length === 0 ? (
                <div className="empty-state">📭 暂无调整申请</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>申请时间</th>
                      <th>申请人</th>
                      <th>原计划</th>
                      <th>调整原因</th>
                      <th>建议调整</th>
                      <th>状态</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adjustments.map(a => {
                      const item = currentSchedule?.items?.find(i => i.id === a.schedule_item_id);
                      return (
                        <tr key={a.id}>
                          <td style={{ fontSize: 12 }}>{a.created_at}</td>
                          <td>李炼钢</td>
                          <td style={{ fontSize: 12 }}>{a.original_plan}</td>
                          <td style={{ fontSize: 12 }}>{a.reason}</td>
                          <td style={{ fontSize: 12, color: '#1890ff' }}>{a.new_plan}</td>
                          <td>
                            <span className={`tag tag-${a.status === '待审批' ? 'warning' : a.status === '已批准' ? 'success' : 'danger'}`}>
                              {a.status}
                            </span>
                          </td>
                          <td>
                            {a.status === '待审批' && (user.role === 'admin' || user.role === 'minister') && (
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button className="btn btn-sm btn-success" onClick={() => handleApproveAdjust(a)}>
                                  批准
                                </button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleRejectAdjust(a)}>
                                  驳回
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'heat' && (
            <div className="grid-2" style={{ gap: 16 }}>
              {Object.entries(heatGroups).map(([heatNo, stages]) => {
                const first = stages[0];
                return (
                  <div key={heatNo} className="card">
                    <div className="card-header" style={{ padding: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{
                          fontFamily: 'monospace',
                        fontSize: 15,
                        fontWeight: 700,
                        padding: '4px 12px',
                        background: getProcessColor(first.steel_grade),
                        color: '#fff',
                        borderRadius: 4
                      }}>
                        {heatNo}
                      </span>
                        <span className="tag tag-primary">{first.steel_grade}</span>
                        <span style={{ fontSize: 12, color: '#999' }}>共 {stages.length} 工序</span>
                      </div>
                    </div>
                    <div className="card-body" style={{ padding: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                        {stages.sort((a, b) => a.sequence - b.sequence).map((s, i) => {
                          const eq = EQUIPMENTS.find(e => e.id === s.equipment_id);
                          return (
                            <React.Fragment key={s.id}>
                              <div style={{
                                padding: '8px 10px',
                                background: s.status === '执行中' ? '#e6f7ff' : '#fafafa',
                                border: `1px solid ${s.status === '执行中' ? '#91d5ff' : '#e8e8e8'}`,
                                borderRadius: 6,
                                minWidth: 100,
                                textAlign: 'center',
                                flex: 1
                              }}>
                                <div style={{ fontSize: 11, color: '#999' }}>工序{s.sequence}</div>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{eq?.name}</div>
                                <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                                  {s.planned_start_time}~{s.planned_end_time}
                                </div>
                                <div style={{ marginTop: 4 }}>
                                  <span className={`tag tag-${getItemStatusColor(s.status)}`} style={{ fontSize: 11 }}>
                                    {getItemStatusLabel(s.status)}
                                  </span>
                                </div>
                              </div>
                              {i < stages.length - 1 && (
                                <span style={{ color: '#ccc', fontWeight: 700 }}>→</span>
                              )}
                            </React.Fragment>
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

      {showGenerateModal && (
        <div className="modal-overlay" onClick={() => setShowGenerateModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">🤖 智能排程生成器</div>
              <button className="modal-close" onClick={() => setShowGenerateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info mb-16">
                <span>ℹ️</span>
                <div>
                  <div className="font-bold mb-8">排程优化算法说明：</div>
                  <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                    · <b>优先级排序</b>：订单紧急度 (权重50%) + 交货期 (权重30%) + 钢种工艺相似度 (权重20%)<br/>
                    · <b>设备约束</b>：转炉单炉90分钟、精炼60分钟、连铸120分钟、轧制150分钟<br/>
                    · <b>时序约束</b>：上一工序完成后15分钟才能开始下一工序（钢水吊运时间）<br/>
                    · <b>中间包寿命</b>：连铸机中间包寿命8~12炉，超过自动切换<br/>
                    · <b>工艺切换</b>：不同钢种切换需30~45分钟换渣/清罐时间<br/>
                    · <b>能耗优化</b>：峰电时段(08-11,18-21)优先安排高能耗工序
                  </div>
                </div>
              </div>

              <div className="form-row mb-16">
                <div className="form-group">
                  <label>排程日期</label>
                  <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>优化目标</label>
                  <select>
                    <option value="balanced">综合平衡（默认）</option>
                    <option value="urgency">优先紧急订单</option>
                    <option value="energy">优先能耗优化</option>
                    <option value="efficiency">优先设备利用率</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>钢水库存 (吨)</label>
                  <input type="number" defaultValue={240} />
                </div>
              </div>

              <div className="mb-8 font-bold" style={{ fontSize: 14 }}>选择需排程订单（不选则全部）：</div>
              <div style={{ border: '1px solid #e8e8e8', borderRadius: 6, maxHeight: 320, overflowY: 'auto' }}>
                <div style={{
                  padding: '10px 16px',
                  background: '#fafafa',
                  borderBottom: '1px solid #e8e8e8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
                onClick={toggleSelectAllOrders}>
                  <input type="checkbox" checked={selectedOrders.length === pendingOrders.length && pendingOrders.length > 0} readOnly />
                  <span>全选</span>
                  <span style={{ marginLeft: 'auto', color: '#999', fontSize: 12 }}>
                    共 {pendingOrders.length} 笔 / {pendingOrders.reduce((s, o) => s + o.quantity, 0)} 吨
                  </span>
                </div>
                {pendingOrders.map(order => (
                  <div key={order.id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                      background: selectedOrders.includes(order.id) ? '#f6ffed' : '#fff'
                    }}
                    onClick={() => toggleOrderSelect(order.id)}
                  >
                    <input type="checkbox" checked={selectedOrders.includes(order.id)} readOnly />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{order.order_no}</span>
                        <span className="tag tag-primary">{order.steel_grade}</span>
                        <span className={`tag tag-${order.urgency >= 4 ? 'danger' : order.urgency >= 3 ? 'warning' : 'gray'}`}>
                          紧急度{order.urgency}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                        {order.customer_name} · {order.quantity}吨 · 交货 {order.delivery_date}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      约{Math.ceil(order.quantity / 110)}炉
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowGenerateModal(false)}>取消</button>
              <button
                className="btn btn-primary"
                onClick={handleGenerateSchedule}
                disabled={generating}
              >
                {generating ? '⏳ 生成中...' : '🚀 开始智能排程'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdjustModal && (
        <div className="modal-overlay" onClick={() => setShowAdjustModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">📝 申请排程调整</div>
              <button className="modal-close" onClick={() => setShowAdjustModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {adjustItem && (
                <>
                  <div className="alert alert-warning mb-16">
                    <div>
                      <b>炉次：</b>{adjustItem.heat_no} <b>钢种：</b>{adjustItem.steel_grade}<br/>
                      <b>原计划：</b>{adjustItem.planned_start_time} ~ {adjustItem.planned_end_time}<br/>
                      <b>设备：</b>{EQUIPMENTS.find(e => e.id === adjustItem.equipment_id)?.name}
                    </div>
                  </div>
                  <div className="form-group mb-16">
                    <label>调整原因<span className="required">*</span></label>
                    <textarea
                      value={adjustForm.reason}
                      onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                      placeholder="请详细说明调整原因，如设备故障、工艺问题、物料延迟等"
                    />
                  </div>
                  <div className="form-group">
                    <label>建议调整方案</label>
                    <textarea
                      value={adjustForm.new_plan}
                      onChange={e => setAdjustForm({ ...adjustForm, new_plan: e.target.value })}
                      placeholder="请描述您建议的调整方案"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowAdjustModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={submitAdjust}>提交申请</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Schedule;
