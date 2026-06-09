const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db = null;

function getDatabase() {
  return db;
}

function startServer() {
  const dbDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(path.join(dbDir, 'steel_production.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  initializeTables();
  seedData();
}

function initializeTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT,
      skills TEXT,
      total_hours REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT '空闲',
      capacity REAL,
      efficiency REAL DEFAULT 1.0,
      total_heats INTEGER DEFAULT 0,
      maintenance_interval INTEGER DEFAULT 50,
      last_maintenance_heats INTEGER DEFAULT 0,
      specification TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS sales_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      steel_grade TEXT NOT NULL,
      specification TEXT NOT NULL,
      quantity REAL NOT NULL,
      urgency INTEGER DEFAULT 1,
      delivery_date TEXT NOT NULL,
      status TEXT DEFAULT '待排程',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS production_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_date TEXT NOT NULL,
      version INTEGER DEFAULT 1,
      status TEXT DEFAULT '待审批',
      approved_by INTEGER,
      approved_at TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (approved_by) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS schedule_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id INTEGER NOT NULL,
      order_id INTEGER,
      equipment_id INTEGER NOT NULL,
      heat_no TEXT NOT NULL,
      steel_grade TEXT NOT NULL,
      planned_start_time TEXT NOT NULL,
      planned_end_time TEXT NOT NULL,
      actual_start_time TEXT,
      actual_end_time TEXT,
      status TEXT DEFAULT '待开始',
      tundish_life INTEGER,
      process_switch_time INTEGER DEFAULT 30,
      sequence INTEGER,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (schedule_id) REFERENCES production_schedules(id),
      FOREIGN KEY (order_id) REFERENCES sales_orders(id),
      FOREIGN KEY (equipment_id) REFERENCES equipment(id)
    );

    CREATE TABLE IF NOT EXISTS schedule_adjustments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_item_id INTEGER NOT NULL,
      requested_by INTEGER NOT NULL,
      reason TEXT NOT NULL,
      original_plan TEXT,
      new_plan TEXT,
      status TEXT DEFAULT '待审批',
      reviewed_by INTEGER,
      reviewed_at TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (schedule_item_id) REFERENCES schedule_items(id),
      FOREIGN KEY (requested_by) REFERENCES users(id),
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS heats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      heat_no TEXT UNIQUE NOT NULL,
      schedule_item_id INTEGER,
      converter_id INTEGER,
      caster_id INTEGER,
      rolling_mill_id INTEGER,
      steel_grade TEXT NOT NULL,
      target_weight REAL,
      actual_weight REAL,
      status TEXT DEFAULT '待吹炼',
      blowing_start_time TEXT,
      blowing_end_time TEXT,
      refining_start_time TEXT,
      refining_end_time TEXT,
      casting_start_time TEXT,
      casting_end_time TEXT,
      hot_rolling_start_time TEXT,
      hot_rolling_end_time TEXT,
      cold_rolling_start_time TEXT,
      cold_rolling_end_time TEXT,
      quality_locked INTEGER DEFAULT 0,
      lock_reason TEXT,
      rework_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (schedule_item_id) REFERENCES schedule_items(id),
      FOREIGN KEY (converter_id) REFERENCES equipment(id),
      FOREIGN KEY (caster_id) REFERENCES equipment(id),
      FOREIGN KEY (rolling_mill_id) REFERENCES equipment(id)
    );

    CREATE TABLE IF NOT EXISTS quality_parameters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      heat_id INTEGER NOT NULL,
      parameter_name TEXT NOT NULL,
      stage TEXT NOT NULL,
      standard_value REAL NOT NULL,
      tolerance_min REAL,
      tolerance_max REAL,
      actual_value REAL,
      record_time TEXT DEFAULT (datetime('now', 'localtime')),
      is_alarm INTEGER DEFAULT 0,
      alarm_message TEXT,
      FOREIGN KEY (heat_id) REFERENCES heats(id)
    );

    CREATE TABLE IF NOT EXISTS quality_inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      heat_id INTEGER NOT NULL,
      inspector_id INTEGER,
      inspection_stage TEXT NOT NULL,
      result TEXT NOT NULL,
      defects TEXT,
      rework_required INTEGER DEFAULT 0,
      remarks TEXT,
      inspection_time TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (heat_id) REFERENCES heats(id),
      FOREIGN KEY (inspector_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      current_stock REAL DEFAULT 0,
      safety_stock REAL DEFAULT 100,
      unit_price REAL DEFAULT 0,
      supplier TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS material_consumptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      heat_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      consumption_time TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (heat_id) REFERENCES heats(id),
      FOREIGN KEY (material_id) REFERENCES materials(id)
    );

    CREATE TABLE IF NOT EXISTS purchase_warnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      warning_level TEXT NOT NULL,
      current_stock REAL NOT NULL,
      safety_stock REAL NOT NULL,
      suggested_quantity REAL,
      status TEXT DEFAULT '待处理',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (material_id) REFERENCES materials(id)
    );

    CREATE TABLE IF NOT EXISTS spare_parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      equipment_type TEXT NOT NULL,
      unit TEXT NOT NULL,
      current_stock REAL DEFAULT 0,
      safety_stock REAL DEFAULT 20,
      unit_price REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS maintenance_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      equipment_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      reason TEXT,
      status TEXT DEFAULT '待分配',
      assigned_team TEXT,
      assigned_to INTEGER,
      spare_parts_used TEXT,
      started_at TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (equipment_id) REFERENCES equipment(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS work_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_date TEXT NOT NULL,
      shift TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      equipment_id INTEGER,
      work_type TEXT NOT NULL,
      hours REAL DEFAULT 8,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (equipment_id) REFERENCES equipment(id)
    );

    CREATE TABLE IF NOT EXISTS energy_consumptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      heat_id INTEGER,
      schedule_item_id INTEGER,
      energy_type TEXT NOT NULL,
      consumption REAL NOT NULL,
      unit TEXT NOT NULL,
      record_time TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (heat_id) REFERENCES heats(id),
      FOREIGN KEY (schedule_item_id) REFERENCES schedule_items(id)
    );

    CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
}

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, password, name, role, department, skills, total_hours)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run('admin', 'admin123', '系统管理员', 'admin', '信息部', '系统管理', 0);
    insertUser.run('minister', 'min123', '张生产', 'minister', '生产部', '生产管理,质量管理', 160);
    insertUser.run('operator1', 'op123', '李炼钢', 'operator', '转炉工段', '转炉操作,精炼', 168);
    insertUser.run('operator2', 'op456', '王连铸', 'operator', '连铸工段', '连铸操作,中间包更换', 172);
    insertUser.run('operator3', 'op789', '赵轧制', 'operator', '轧制工段', '热轧操作,冷轧操作', 165);
    insertUser.run('inspector', 'ins123', '钱质检', 'inspector', '质检部', '质量检测,缺陷分析', 160);
    insertUser.run('maintenance', 'mt123', '孙维修', 'maintenance', '设备部', '设备维修,电气维修', 168);
  }

  const eqCount = db.prepare('SELECT COUNT(*) as cnt FROM equipment').get().cnt;
  if (eqCount === 0) {
    const insertEq = db.prepare(`
      INSERT INTO equipment (name, type, code, status, capacity, efficiency, maintenance_interval, specification)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertEq.run('1号转炉', 'converter', 'LD-001', '空闲', 120, 0.95, 50, '120吨顶底复吹转炉');
    insertEq.run('2号转炉', 'converter', 'LD-002', '空闲', 120, 0.93, 50, '120吨顶底复吹转炉');
    insertEq.run('3号转炉', 'converter', 'LD-003', '维护中', 150, 0.97, 60, '150吨顶底复吹转炉');
    insertEq.run('RH精炼炉', 'refinery', 'RH-001', '空闲', 120, 0.98, 80, 'RH真空精炼炉');
    insertEq.run('LF精炼炉', 'refinery', 'LF-001', '空闲', 120, 0.96, 80, 'LF钢包精炼炉');
    insertEq.run('1号连铸机', 'caster', 'CC-001', '空闲', 0, 0.94, 100, '板坯连铸机-双流');
    insertEq.run('2号连铸机', 'caster', 'CC-002', '空闲', 0, 0.92, 100, '方坯连铸机-八流');
    insertEq.run('1号热轧机', 'rolling_mill', 'HR-001', '空闲', 0, 0.95, 200, '1780mm热连轧机组');
    insertEq.run('2号热轧机', 'rolling_mill', 'HR-002', '空闲', 0, 0.93, 200, '2250mm热连轧机组');
    insertEq.run('1号冷轧机', 'rolling_mill_cold', 'CR-001', '空闲', 0, 0.94, 250, '1420mm冷连轧机组');
    insertEq.run('2号冷轧机', 'rolling_mill_cold', 'CR-002', '空闲', 0, 0.91, 250, '1550mm冷连轧机组');
  }

  const materialCount = db.prepare('SELECT COUNT(*) as cnt FROM materials').get().cnt;
  if (materialCount === 0) {
    const insertMat = db.prepare(`
      INSERT INTO materials (name, code, category, unit, current_stock, safety_stock, unit_price, supplier)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertMat.run('铁矿石', 'MAT-001', '原料', '吨', 50000, 10000, 850, '鞍钢矿业');
    insertMat.run('废钢', 'MAT-002', '原料', '吨', 8000, 2000, 2800, '本地回收公司');
    insertMat.run('焦炭', 'MAT-003', '原料', '吨', 15000, 3000, 2200, '山西焦化');
    insertMat.run('石灰石', 'MAT-004', '辅料', '吨', 3000, 500, 120, '本地建材');
    insertMat.run('锰铁合金', 'MAT-005', '合金', '吨', 500, 100, 6500, '鄂尔多斯冶金');
    insertMat.run('硅铁合金', 'MAT-006', '合金', '吨', 300, 80, 5800, '青海铁合金');
    insertMat.run('铝脱氧剂', 'MAT-007', '辅料', '吨', 150, 30, 15000, '中铝集团');
    insertMat.run('保护渣', 'MAT-008', '辅料', '吨', 80, 20, 8000, '洛阳耐火材料');
    insertMat.run('中间包', 'MAT-009', '耐材', '个', 50, 10, 15000, '营口青花');
    insertMat.run('轧辊', 'MAT-010', '备件', '支', 20, 5, 85000, '中钢邢机');
  }

  const orderCount = db.prepare('SELECT COUNT(*) as cnt FROM sales_orders').get().cnt;
  if (orderCount === 0) {
    const insertOrder = db.prepare(`
      INSERT INTO sales_orders (order_no, customer_name, steel_grade, specification, quantity, urgency, delivery_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const today = new Date();
    const addDays = (d, days) => {
      const nd = new Date(d);
      nd.setDate(nd.getDate() + days);
      return nd.toISOString().split('T')[0];
    };

    insertOrder.run('SO-2024-0001', '一汽集团', 'DC01', '1.5mm*1250mm冷轧卷', 500, 5, addDays(today, 7), '待排程');
    insertOrder.run('SO-2024-0002', '上汽集团', 'SPHC', '3.0mm*1500mm热轧卷', 1200, 3, addDays(today, 14), '待排程');
    insertOrder.run('SO-2024-0003', '宝钢加工', 'Q235B', '150mm*150mm方坯', 800, 1, addDays(today, 21), '待排程');
    insertOrder.run('SO-2024-0004', '中船重工', 'AH32', '20mm*2000mm船板', 600, 4, addDays(today, 10), '待排程');
    insertOrder.run('SO-2024-0005', '海尔集团', 'ST14', '0.8mm*1000mm冷轧卷', 350, 2, addDays(today, 18), '待排程');
    insertOrder.run('SO-2024-0006', '比亚迪汽车', 'HC340LA', '2.0mm*1200mm冷轧卷', 420, 5, addDays(today, 5), '待排程');
  }
}

module.exports = {
  startServer,
  getDatabase
};
