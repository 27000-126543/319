const STORAGE_KEY = 'steel_db_data_v1';

const DEFAULT_DATA = {
  users: [
    { id: 1, username: 'admin', password: 'admin123', name: '系统管理员', role: 'admin', department: '信息部', skills: '系统管理', total_hours: 0, created_at: '2024-01-01 00:00:00' },
    { id: 2, username: 'minister', password: 'min123', name: '张生产', role: 'minister', department: '生产部', skills: '生产管理,质量管理,调度', total_hours: 160, created_at: '2024-01-01 00:00:00' },
    { id: 3, username: 'operator1', password: 'op123', name: '李炼钢', role: 'operator', department: '转炉工段', skills: '转炉操作,精炼操作', total_hours: 168, created_at: '2024-01-01 00:00:00' },
    { id: 4, username: 'operator2', password: 'op456', name: '王连铸', role: 'operator', department: '连铸工段', skills: '连铸操作,中间包更换', total_hours: 172, created_at: '2024-01-01 00:00:00' },
    { id: 5, username: 'operator3', password: 'op789', name: '赵轧制', role: 'operator', department: '轧制工段', skills: '热轧操作,冷轧操作,加热炉', total_hours: 165, created_at: '2024-01-01 00:00:00' },
    { id: 6, username: 'inspector', password: 'ins123', name: '钱质检', role: 'inspector', department: '质检部', skills: '质量检测,缺陷分析,成分分析', total_hours: 160, created_at: '2024-01-01 00:00:00' },
    { id: 7, username: 'maintenance', password: 'mt123', name: '孙维修', role: 'maintenance', department: '设备部', skills: '转炉维修,液压系统,电气维修', total_hours: 168, created_at: '2024-01-01 00:00:00' },
    { id: 8, username: 'zhou', password: '123456', name: '周师傅', role: 'maintenance', department: '设备部', skills: '连铸机维修,机械装配', total_hours: 168, created_at: '2024-01-01 00:00:00' },
    { id: 9, username: 'wu', password: '123456', name: '吴电工', role: 'maintenance', department: '设备部', skills: '电气维修,PLC编程,变频器', total_hours: 160, created_at: '2024-01-01 00:00:00' },
    { id: 10, username: 'zheng', password: '123456', name: '郑班长', role: 'operator', department: '连铸工段', skills: '连铸班长,工艺优化,人员调配', total_hours: 192, created_at: '2024-01-01 00:00:00' },
    { id: 11, username: 'sunqc', password: '123456', name: '孙质检', role: 'inspector', department: '质检部', skills: '成品检验,金相分析', total_hours: 152, created_at: '2024-01-01 00:00:00' }
  ],
  equipment: [
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
  ],
  sales_orders: [
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
  ],
  materials: [
    { id: 1, name: '铁矿石', code: 'MAT-001', category: '原料', unit: '吨', current_stock: 42000, safety_stock: 10000, unit_price: 850, supplier: '鞍钢矿业' },
    { id: 2, name: '废钢', code: 'MAT-002', category: '原料', unit: '吨', current_stock: 5600, safety_stock: 2000, unit_price: 2800, supplier: '本地回收公司' },
    { id: 3, name: '焦炭', code: 'MAT-003', category: '原料', unit: '吨', current_stock: 12000, safety_stock: 3000, unit_price: 2200, supplier: '山西焦化' },
    { id: 4, name: '石灰石', code: 'MAT-004', category: '辅料', unit: '吨', current_stock: 2800, safety_stock: 500, unit_price: 120, supplier: '本地建材' },
    { id: 5, name: '锰铁合金', code: 'MAT-005', category: '合金', unit: '吨', current_stock: 420, safety_stock: 100, unit_price: 6500, supplier: '鄂尔多斯冶金' },
    { id: 6, name: '硅铁合金', code: 'MAT-006', category: '合金', unit: '吨', current_stock: 210, safety_stock: 80, unit_price: 5800, supplier: '青海铁合金' },
    { id: 7, name: '铝脱氧剂', code: 'MAT-007', category: '辅料', unit: '吨', current_stock: 65, safety_stock: 30, unit_price: 15000, supplier: '中铝集团' },
    { id: 8, name: '保护渣', code: 'MAT-008', category: '辅料', unit: '吨', current_stock: 18, safety_stock: 20, unit_price: 8000, supplier: '洛阳耐火材料' },
    { id: 9, name: '中间包', code: 'MAT-009', category: '耐材', unit: '个', current_stock: 5, safety_stock: 10, unit_price: 15000, supplier: '营口青花' },
    { id: 10, name: '轧辊', code: 'MAT-010', category: '备件', unit: '支', current_stock: 12, safety_stock: 5, unit_price: 85000, supplier: '中钢邢机' }
  ]
};

class MemoryDatabase {
  constructor() {
    this.data = this.loadData();
    this.nextIds = {};
    Object.keys(this.data).forEach(table => {
      const rows = this.data[table] || [];
      this.nextIds[table] = rows.length > 0 ? Math.max(...rows.map(r => r.id || 0)) + 1 : 1;
    });
  }

  loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_DATA, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load data from localStorage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save data:', e);
    }
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    this.saveData();
  }

  select(table, where = null, orderBy = null, limit = null) {
    let rows = [...(this.data[table] || [])];
    if (where) {
      rows = rows.filter(r => {
        for (const key in where) {
          if (r[key] !== where[key]) return false;
        }
        return true;
      });
    }
    if (orderBy) {
      const [field, dir = 'asc'] = orderBy.split(' ');
      rows.sort((a, b) => {
        const va = a[field], vb = b[field];
        if (va < vb) return dir === 'asc' ? -1 : 1;
        if (va > vb) return dir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    if (limit) rows = rows.slice(0, limit);
    return rows;
  }

  insert(table, row) {
    if (!this.data[table]) this.data[table] = [];
    if (!this.nextIds[table]) this.nextIds[table] = 1;
    const newRow = { id: this.nextIds[table]++, ...row };
    this.data[table].push(newRow);
    this.saveData();
    return newRow;
  }

  update(table, updates, where) {
    if (!this.data[table]) return 0;
    let count = 0;
    this.data[table] = this.data[table].map(row => {
      let match = true;
      if (where) {
        for (const key in where) {
          if (row[key] !== where[key]) { match = false; break; }
        }
      }
      if (match) {
        count++;
        return { ...row, ...updates };
      }
      return row;
    });
    if (count > 0) this.saveData();
    return count;
  }

  delete(table, where) {
    if (!this.data[table]) return 0;
    const original = this.data[table].length;
    if (!where) {
      this.data[table] = [];
    } else {
      this.data[table] = this.data[table].filter(row => {
        for (const key in where) {
          if (row[key] !== where[key]) return true;
        }
        return false;
      });
    }
    const deleted = original - this.data[table].length;
    if (deleted > 0) this.saveData();
    return deleted;
  }
}

let db = null;
function getDB() {
  if (!db) db = new MemoryDatabase();
  return db;
}

async function query(sql, params) {
  try {
    const db = getDB();
    const sqlUpper = sql.toUpperCase().trim();

    if (sqlUpper.startsWith('SELECT * FROM')) {
      const match = sql.match(/FROM\s+(\w+)/i);
      const orderMatch = sql.match(/ORDER\s+BY\s+([\w\s]+)/i);
      const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s*$)/i);
      const limitMatch = sql.match(/LIMIT\s+(\d+)/i);

      if (match) {
        const table = match[1];
        let where = null;
        if (whereMatch) {
          const conds = whereMatch[1].split(/\s+AND\s+/i);
          where = {};
          conds.forEach(c => {
            const eq = c.match(/(\w+)\s*=\s*\?/);
            if (eq && params && params.length > 0) {
              where[eq[1]] = params.shift();
            }
          });
        }
        const orderBy = orderMatch ? orderMatch[1] : null;
        const limit = limitMatch ? parseInt(limitMatch[1]) : null;
        return { success: true, data: db.select(table, where, orderBy, limit) };
      }
    }

    if (sqlUpper.startsWith('SELECT COUNT')) {
      const match = sql.match(/FROM\s+(\w+)/i);
      if (match) {
        const table = match[1];
        return { success: true, data: [{ cnt: (db.data[table] || []).length }] };
      }
    }

    if (sqlUpper.startsWith('INSERT INTO')) {
      const match = sql.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES/i);
      if (match) {
        const table = match[1];
        const fields = match[2].split(',').map(f => f.trim());
        const row = {};
        fields.forEach((f, i) => { row[f] = params ? params[i] : undefined; });
        const newRow = db.insert(table, row);
        return { success: true, data: { lastInsertRowid: newRow.id, changes: 1 } };
      }
    }

    if (sqlUpper.startsWith('UPDATE')) {
      const match = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE/i);
      const whereMatch = sql.match(/WHERE\s+(.+?)\s*$/i);
      if (match) {
        const table = match[1];
        const setClauses = match[2].split(',').map(s => s.trim());
        const updates = {};
        setClauses.forEach(c => {
          const eq = c.match(/(\w+)\s*=\s*\?/);
          if (eq && params) {
            updates[eq[1]] = params.shift();
          } else {
            const eq2 = c.match(/(\w+)\s*=\s*(.+)$/);
            if (eq2) {
              const val = eq2[2].trim();
              updates[eq2[1]] = val.startsWith("'") ? val.slice(1, -1) : Number(val);
            }
          }
        });
        let where = null;
        if (whereMatch) {
          const conds = whereMatch[1].split(/\s+AND\s+/i);
          where = {};
          conds.forEach(c => {
            const eq = c.match(/(\w+)\s*=\s*\?/);
            if (eq && params && params.length > 0) {
              where[eq[1]] = params.shift();
            } else {
              const eq2 = c.match(/(\w+)\s*=\s*(.+)$/);
              if (eq2) {
                const val = eq2[2].trim();
                where[eq2[1]] = val.startsWith("'") ? val.slice(1, -1) : Number(val);
              }
            }
          });
        }
        const changes = db.update(table, updates, where);
        return { success: true, data: { changes } };
      }
    }

    if (sqlUpper.startsWith('DELETE FROM')) {
      const match = sql.match(/DELETE\s+FROM\s+(\w+)\s+WHERE/i);
      const whereMatch = sql.match(/WHERE\s+(.+?)\s*$/i);
      if (match) {
        const table = match[1];
        let where = null;
        if (whereMatch) {
          const conds = whereMatch[1].split(/\s+AND\s+/i);
          where = {};
          conds.forEach(c => {
            const eq = c.match(/(\w+)\s*=\s*\?/);
            if (eq && params && params.length > 0) {
              where[eq[1]] = params.shift();
            }
          });
        }
        const changes = db.delete(table, where);
        return { success: true, data: { changes } };
      }
    }

    console.warn('Unsupported SQL, returning empty:', sql);
    return { success: true, data: [] };
  } catch (error) {
    console.error('Query error:', error);
    return { success: false, error: error.message, data: [] };
  }
}

async function exec(sql) {
  try {
    const statements = sql.split(';').filter(s => s.trim());
    for (const stmt of statements) {
      if (stmt.trim()) await query(stmt);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function insert(table, data) {
  const result = await query(`INSERT INTO ${table} (${Object.keys(data).join(', ')}) VALUES (${Object.keys(data).map(() => '?').join(', ')})`, Object.values(data));
  return result;
}

async function update(table, data, whereClause, whereParams) {
  const setStr = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const params = [...Object.values(data), ...(whereParams || [])];
  return await query(`UPDATE ${table} SET ${setStr} WHERE ${whereClause}`, params);
}

async function remove(table, whereClause, whereParams) {
  return await query(`DELETE FROM ${table} WHERE ${whereClause}`, whereParams);
}

export default {
  query,
  exec,
  insert,
  update,
  remove,
  getDB,
  resetDB: () => {
    getDB().reset();
  }
};

export { getDB, query, exec, insert, update, remove };
