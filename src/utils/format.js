const eqMap = {
  'converter': { label: '转炉', color: 'primary' },
  'refinery': { label: '精炼炉', color: 'warning' },
  'caster': { label: '连铸机', color: 'info' },
  'rolling_mill': { label: '热轧机', color: 'success' },
  'rolling_mill_cold': { label: '冷轧机', color: 'orange' }
};

const roleMap = {
  'admin': { label: '系统管理员', color: 'primary' },
  'minister': { label: '生产部长', color: 'warning' },
  'operator': { label: '操作员', color: 'info' },
  'inspector': { label: '质检员', color: 'success' },
  'maintenance': { label: '维修人员', color: 'gray' }
};

const scheduleStatusMap = {
  '待审批': { label: '待审批', color: 'warning' },
  '已批准': { label: '已批准', color: 'success' },
  '已驳回': { label: '已驳回', color: 'danger' },
  '已发布': { label: '已发布', color: 'info' },
  '执行中': { label: '执行中', color: 'primary' },
  '已完成': { label: '已完成', color: 'gray' }
};

const itemStatusMap = {
  '待开始': { label: '待开始', color: 'gray' },
  '待确认': { label: '待确认', color: 'warning' },
  '已确认': { label: '已确认', color: 'info' },
  '执行中': { label: '执行中', color: 'primary' },
  '申请调整': { label: '申请调整', color: 'warning' },
  '已完成': { label: '已完成', color: 'success' },
  '已取消': { label: '已取消', color: 'danger' }
};

const heatStatusMap = {
  '待吹炼': { label: '待吹炼', color: 'gray' },
  '吹炼中': { label: '吹炼中', color: 'primary' },
  '吹炼完成': { label: '吹炼完成', color: 'info' },
  '精炼中': { label: '精炼中', color: 'warning' },
  '精炼完成': { label: '精炼完成', color: 'info' },
  '连铸中': { label: '连铸中', color: 'info' },
  '连铸完成': { label: '连铸完成', color: 'info' },
  '热轧中': { label: '热轧中', color: 'info' },
  '热轧完成': { label: '热轧完成', color: 'info' },
  '冷轧中': { label: '冷轧中', color: 'info' },
  '已完成': { label: '已完成', color: 'success' },
  '质量锁定': { label: '质量锁定', color: 'danger' },
  '回炉处理': { label: '回炉处理', color: 'warning' }
};

const urgencyMap = {
  1: { label: '普通', color: 'gray' },
  2: { label: '较低', color: 'info' },
  3: { label: '一般', color: 'primary' },
  4: { label: '较高', color: 'warning' },
  5: { label: '紧急', color: 'danger' }
};

const qualityResultMap = {
  '合格': { label: '合格', color: 'success' },
  '不合格': { label: '不合格', color: 'danger' },
  '让步接收': { label: '让步接收', color: 'warning' },
  '待检': { label: '待检', color: 'gray' }
};

export function getEqTypeLabel(type) {
  return eqMap[type] ? eqMap[type].label : type;
}

export function getEqTypeColor(type) {
  return eqMap[type] ? eqMap[type].color : 'gray';
}

export function getRoleLabel(role) {
  return roleMap[role] ? roleMap[role].label : role;
}

export function getRoleColor(role) {
  return roleMap[role] ? roleMap[role].color : 'gray';
}

export function getScheduleStatusLabel(status) {
  return scheduleStatusMap[status] ? scheduleStatusMap[status].label : status;
}

export function getScheduleStatusColor(status) {
  return scheduleStatusMap[status] ? scheduleStatusMap[status].color : 'gray';
}

export function getItemStatusLabel(status) {
  return itemStatusMap[status] ? itemStatusMap[status].label : status;
}

export function getItemStatusColor(status) {
  return itemStatusMap[status] ? itemStatusMap[status].color : 'gray';
}

export function getHeatStatusLabel(status) {
  return heatStatusMap[status] ? heatStatusMap[status].label : status;
}

export function getHeatStatusColor(status) {
  return heatStatusMap[status] ? heatStatusMap[status].color : 'gray';
}

export function getUrgencyLabel(urgency) {
  return urgencyMap[urgency] ? urgencyMap[urgency].label : urgency;
}

export function getUrgencyColor(urgency) {
  return urgencyMap[urgency] ? urgencyMap[urgency].color : 'gray';
}

export function getQualityResultLabel(result) {
  return qualityResultMap[result] ? qualityResultMap[result].label : result;
}

export function getQualityResultColor(result) {
  return qualityResultMap[result] ? qualityResultMap[result].color : 'gray';
}

export function getStatusDot(status) {
  const statusColors = {
    '空闲': '#52c41a',
    '运行中': '#1890ff',
    '维护中': '#faad14',
    '故障': '#ff4d4f'
  };
  return statusColors[status] || '#999';
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatNumber(num, digits = 2) {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return Number(num).toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function todayStr() {
  const d = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
