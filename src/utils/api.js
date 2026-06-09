const STEEL_STORAGE_KEY = 'steel_production_database_v2';

const STEEL_TABLE_SCHEMA = {
  users: 'id INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR(50) UNIQUE, password VARCHAR(50), name VARCHAR(50), role VARCHAR(20), phone VARCHAR(20), skill_tags TEXT, created_at DATETIME',
  equipment: 'id INTEGER PRIMARY KEY AUTOINCREMENT, equip_no VARCHAR(30) UNIQUE, name VARCHAR(100), type VARCHAR(20), location VARCHAR(100), manufacturer VARCHAR(100), install_date DATE, capacity DECIMAL(12,2), status VARCHAR(20), run_hours INTEGER, maintenance_cycle INTEGER, next_maintenance_date DATE, description TEXT',
  sales_orders: 'id INTEGER PRIMARY KEY AUTOINCREMENT, order_no VARCHAR(50) UNIQUE, customer VARCHAR(100), steel_grade VARCHAR(30), specification VARCHAR(100), quantity DECIMAL(12,2), order_date DATE, delivery_date DATE, urgency INTEGER, status VARCHAR(30), actual_output DECIMAL(12,2), quality_rate DECIMAL(5,2), note TEXT, created_at DATETIME, updated_at DATETIME',
  materials: 'id INTEGER PRIMARY KEY AUTOINCREMENT, material_code VARCHAR(30) UNIQUE, name VARCHAR(100), category VARCHAR(30), spec VARCHAR(100), unit VARCHAR(10), stock DECIMAL(12,2), safe_stock DECIMAL(12,2), max_stock DECIMAL(12,2), unit_price DECIMAL(12,2), supplier VARCHAR(100), location VARCHAR(50), last_update DATETIME',
  production_heats: 'id INTEGER PRIMARY KEY AUTOINCREMENT, heat_no VARCHAR(30) UNIQUE, order_id INTEGER, steel_grade VARCHAR(30), plan_weight DECIMAL(12,2), actual_weight DECIMAL(12,2), status VARCHAR(20), converter_no INTEGER, lf_time INTEGER, rh_time INTEGER, tundish_life INTEGER, start_time DATETIME, end_time DATETIME, quality_locked INTEGER DEFAULT 0, locked_reason TEXT, operator VARCHAR(50)',
  maintenance_orders: 'id INTEGER PRIMARY KEY AUTOINCREMENT, workorder_no VARCHAR(30) UNIQUE, equip_id INTEGER, type VARCHAR(20), priority VARCHAR(10), content TEXT, status VARCHAR(20), team VARCHAR(30), plan_start DATETIME, plan_end DATETIME, actual_start DATETIME, actual_end DATETIME, parts_used TEXT, created_at DATETIME',
  quality_records: 'id INTEGER PRIMARY KEY AUTOINCREMENT, record_no VARCHAR(30) UNIQUE, heat_id INTEGER, process_step VARCHAR(30), inspector VARCHAR(50), result VARCHAR(20), defect_type TEXT, defect_desc TEXT, chemical_analysis TEXT, mechanical_test TEXT, inspection_time DATETIME, note TEXT',
  workforce_shifts: 'id INTEGER PRIMARY KEY AUTOINCREMENT, shift_date DATE, shift_type VARCHAR(10), user_id INTEGER, user_name VARCHAR(50), position VARCHAR(30), work_hours DECIMAL(4,1), overtime_hours DECIMAL(4,1), note TEXT, created_at DATETIME',
  schedules: 'id INTEGER PRIMARY KEY AUTOINCREMENT, schedule_date DATE, schedule_type VARCHAR(20), status VARCHAR(20), approved_by VARCHAR(50), approved_at DATETIME, remark TEXT, created_at DATETIME',
  schedule_items: 'id INTEGER PRIMARY KEY AUTOINCREMENT, schedule_id INTEGER, order_id INTEGER, equip_id INTEGER, equip_type VARCHAR(30), sequence INTEGER, plan_start DATETIME, plan_end DATETIME, steel_grade VARCHAR(30), weight DECIMAL(12,2), actual_start DATETIME, actual_end DATETIME, progress INTEGER, status VARCHAR(20), remark TEXT',
  inventory_records: 'id INTEGER PRIMARY KEY AUTOINCREMENT, record_no VARCHAR(30) UNIQUE, material_id INTEGER, type VARCHAR(10), quantity DECIMAL(12,2), operator VARCHAR(50), reason TEXT, related_order VARCHAR(50), created_at DATETIME'
};

function genSteelId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 7).toUpperCase(); }

function getTodayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function getDateTimeISO(offsetHours = 0) {
  const d = new Date();
  d.setHours(d.getHours() + offsetHours);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

class SteelMemoryDatabase {
  constructor() {
    this.tables = {};
    this.autoInc = {};
    this.load();
    if (!this._hasData()) this._initSteelSeedData();
  }

  _hasData() {
    return this.tables.users && this.tables.users.length > 0 &&
           this.tables.sales_orders && this.tables.sales_orders.length > 0 &&
           this.tables.equipment && this.tables.equipment.length > 0;
  }

  load() {
    try {
      Object.keys(STEEL_TABLE_SCHEMA).forEach(t => { this.tables[t] = []; this.autoInc[t] = 1; });
      const saved = localStorage.getItem(STEEL_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        Object.keys(STEEL_TABLE_SCHEMA).forEach(t => {
          if (data.tables && data.tables[t]) {
            this.tables[t] = data.tables[t];
            this.autoInc[t] = (data.autoInc && data.autoInc[t]) ? data.autoInc[t] : (this.tables[t].length + 1);
          }
        });
      }
    } catch (e) {
      console.error('加载钢铁数据库失败:', e);
      this._initSteelSeedData();
    }
  }

  save() {
    try {
      localStorage.setItem(STEEL_STORAGE_KEY, JSON.stringify({ tables: this.tables, autoInc: this.autoInc }));
    } catch (e) { console.error('保存钢铁数据库失败:', e); }
  }

  _insert(table, row) {
    if (!this.tables[table]) this.tables[table] = [];
    if (!row.id) row.id = this.autoInc[table]++;
    else if (row.id >= this.autoInc[table]) this.autoInc[table] = row.id + 1;
    this.tables[table].push(row);
    this.save();
    return row.id;
  }

  _update(table, where, data) {
    if (!this.tables[table]) return 0;
    let count = 0;
    this.tables[table] = this.tables[table].map(row => {
      if (this._matchWhere(row, where)) { count++; return { ...row, ...data }; }
      return row;
    });
    this.save();
    return count;
  }

  _delete(table, where) {
    if (!this.tables[table]) return 0;
    const before = this.tables[table].length;
    this.tables[table] = this.tables[table].filter(row => !this._matchWhere(row, where));
    this.save();
    return before - this.tables[table].length;
  }

  _matchWhere(row, where) {
    if (!where) return true;
    return Object.keys(where).every(k => row[k] === where[k]);
  }

  _select(table, where, orderBy, limit) {
    if (!this.tables[table]) return [];
    let rows = this.tables[table].filter(r => this._matchWhere(r, where));
    if (orderBy) {
      const [field, dir] = orderBy.split(' ');
      rows.sort((a, b) => {
        const va = a[field], vb = b[field];
        if (va < vb) return dir === 'DESC' ? 1 : -1;
        if (va > vb) return dir === 'DESC' ? -1 : 1;
        return 0;
      });
    }
    if (limit) rows = rows.slice(0, limit);
    return rows.map(r => ({ ...r }));
  }

  _initSteelSeedData() {
    this.tables = {};
    Object.keys(STEEL_TABLE_SCHEMA).forEach(t => { this.tables[t] = []; this.autoInc[t] = 1; });

    const users = [
      { username: 'admin',       password: 'admin123', name: '系统管理员', role: 'admin',       phone: '13900000000', skill_tags: '系统,排程,质检,设备,库存', created_at: getDateTimeISO(-720) },
      { username: 'minister',    password: 'min123',   name: '李建国',     role: 'minister',    phone: '13900000001', skill_tags: '生产管理,排程审批,质量', created_at: getDateTimeISO(-700) },
      { username: 'operator1',   password: 'op123',    name: '张师傅',     role: 'operator',    phone: '13900000002', skill_tags: '转炉,LF精炼',           created_at: getDateTimeISO(-680) },
      { username: 'operator2',   password: 'op123',    name: '王师傅',     role: 'operator',    phone: '13900000003', skill_tags: '连铸,热轧',              created_at: getDateTimeISO(-660) },
      { username: 'operator3',   password: 'op123',    name: '刘师傅',     role: 'operator',    phone: '13900000004', skill_tags: '冷轧,精整',              created_at: getDateTimeISO(-640) },
      { username: 'inspector',   password: 'ins123',   name: '赵质检',     role: 'inspector',   phone: '13900000005', skill_tags: '成分分析,力学性能,探伤', created_at: getDateTimeISO(-620) },
      { username: 'maintenance', password: 'mnt123',   name: '钱维修',     role: 'maintenance', phone: '13900000006', skill_tags: '机械,液压,电气',         created_at: getDateTimeISO(-600) },
      { username: 'storekeeper', password: 'stk123',   name: '孙库管',     role: 'admin',       phone: '13900000007', skill_tags: '原料,成品,备件',         created_at: getDateTimeISO(-580) },
      { username: 'scheduler',   password: 'sch123',   name: '周调度',     role: 'minister',    phone: '13900000008', skill_tags: '排程,甘特图,产能',       created_at: getDateTimeISO(-560) },
      { username: 'operator4',   password: 'op123',    name: '陈师傅',     role: 'operator',    phone: '13900000009', skill_tags: '加热炉,热处理',          created_at: getDateTimeISO(-540) }
    ];
    users.forEach(u => this._insert('users', u));

    const equipment = [
      { equip_no: 'CONV-001', name: '1号转炉',      type: '转炉',   location: '炼钢车间A区', manufacturer: '中冶京诚', install_date: '2020-03-15', capacity: 120, status: '运行中', run_hours: 58320, maintenance_cycle: 500,  next_maintenance_date: getTodayISO(12), description: '120吨顶底复吹转炉，氧枪高度自动控制' },
      { equip_no: 'CONV-002', name: '2号转炉',      type: '转炉',   location: '炼钢车间A区', manufacturer: '中冶京诚', install_date: '2020-05-20', capacity: 120, status: '运行中', run_hours: 57810, maintenance_cycle: 500,  next_maintenance_date: getTodayISO(8),  description: '120吨顶底复吹转炉，副枪在线检测' },
      { equip_no: 'CONV-003', name: '3号转炉',      type: '转炉',   location: '炼钢车间B区', manufacturer: '中冶赛迪', install_date: '2021-01-10', capacity: 150, status: '运行中', run_hours: 46980, maintenance_cycle: 550,  next_maintenance_date: getTodayISO(15), description: '150吨智能转炉，自动出钢系统' },
      { equip_no: 'LF-001',   name: '1号LF精炼炉',  type: '精炼炉', location: '炼钢车间A区', manufacturer: '西门子',   install_date: '2020-04-18', capacity: 120, status: '运行中', run_hours: 54210, maintenance_cycle: 800,  next_maintenance_date: getTodayISO(20), description: '钢包精炼炉，双工位，电极自动升降' },
      { equip_no: 'RH-001',   name: 'RH真空精炼炉', type: '精炼炉', location: '炼钢车间A区', manufacturer: '三菱日立', install_date: '2020-06-22', capacity: 120, status: '运行中', run_hours: 49870, maintenance_cycle: 1000, next_maintenance_date: getTodayISO(25), description: 'RH真空脱气，处理超低碳钢、IF钢' },
      { equip_no: 'CC-001',   name: '1号连铸机',    type: '连铸机', location: '连铸车间1线', manufacturer: '达涅利',   install_date: '2020-07-08', capacity: 220, status: '运行中', run_hours: 52150, maintenance_cycle: 600,  next_maintenance_date: getTodayISO(10), description: '板坯连铸机，厚度200-250mm，宽度900-1600mm' },
      { equip_no: 'CC-002',   name: '2号连铸机',    type: '连铸机', location: '连铸车间2线', manufacturer: '西马克',   install_date: '2021-02-15', capacity: 260, status: '运行中', run_hours: 43680, maintenance_cycle: 650,  next_maintenance_date: getTodayISO(18), description: '大板坯连铸机，厚度220-300mm，宽度1000-2000mm' },
      { equip_no: 'HF-001',   name: '1号加热炉',    type: '加热炉', location: '热轧车间入口', manufacturer: ' Stein',  install_date: '2020-08-30', capacity: 320, status: '运行中', run_hours: 50320, maintenance_cycle: 1200, next_maintenance_date: getTodayISO(30), description: '步进梁式加热炉，蓄热式燃烧，小时产量320t' },
      { equip_no: 'HRM-001',  name: '1号热轧机',    type: '热轧机', location: '热轧车间主轧线', manufacturer: 'SMS',    install_date: '2020-09-12', capacity: 350, status: '运行中', run_hours: 49820, maintenance_cycle: 900,  next_maintenance_date: getTodayISO(22), description: '1+7热连轧，粗轧立辊+7机架精轧' },
      { equip_no: 'CRM-001',  name: '1号冷轧机',    type: '冷轧机', location: '冷轧车间1线', manufacturer: '三菱日立', install_date: '2021-03-25', capacity: 180, status: '维护中', run_hours: 39210, maintenance_cycle: 700,  next_maintenance_date: getTodayISO(2),  description: '6辊HC冷连轧机，厚度0.3-3.0mm' },
      { equip_no: 'CRM-002',  name: '2号冷轧机',    type: '冷轧机', location: '冷轧车间2线', manufacturer: '西马克',   install_date: '2021-06-10', capacity: 200, status: '运行中', run_hours: 35680, maintenance_cycle: 750,  next_maintenance_date: getTodayISO(28), description: '5机架冷连轧机，带AGC厚度自动控制' }
    ];
    equipment.forEach(e => this._insert('equipment', e));

    const steelGradeList = [
      { grade: 'Q235B',  category: '碳素结构钢',  typical: '1250×200' },
      { grade: 'Q345B',  category: '低合金高强度', typical: '1500×220' },
      { grade: 'DC01',   category: '深冲冷轧',    typical: '1000×1.5' },
      { grade: 'DC04',   category: '超深冲冷轧',  typical: '1200×0.8' },
      { grade: 'SPHC',   category: '热轧酸洗',    typical: '1250×3.0' },
      { grade: 'SPCC',   category: '冷轧通用',    typical: '1000×1.0' },
      { grade: 'AH32',   category: '船板钢',      typical: '2200×25'  },
      { grade: 'AH36',   category: '船板钢',      typical: '2400×30'  },
      { grade: 'HC340LA',category: '汽车高强钢',  typical: '1500×1.8' },
      { grade: 'HC420LA',category: '汽车高强钢',  typical: '1400×2.0' },
      { grade: 'Q550D',  category: '工程机械钢',  typical: '2000×50'  },
      { grade: 'Q690D',  category: '高强结构钢',  typical: '1800×40'  }
    ];

    const customerList = [
      '中国第一汽车集团有限公司',
      '上海汽车集团股份有限公司',
      '比亚迪汽车工业有限公司',
      '中船黄埔文冲船舶有限公司',
      '三一重工股份有限公司',
      '中联重科股份有限公司',
      '上汽大众汽车有限公司',
      '长城汽车股份有限公司',
      '海尔集团公司',
      '美的集团股份有限公司',
      '中车长春轨道客车股份有限公司',
      '东方电气集团东方锅炉股份有限公司'
    ];

    const orders = [];
    for (let i = 0; i < 15; i++) {
      const grade = steelGradeList[i % steelGradeList.length];
      const qty = 200 + Math.floor(Math.random() * 1800);
      const urgency = Math.min(5, 1 + Math.floor(Math.random() * 5));
      const deliveryOffset = 3 + Math.floor(Math.random() * 25);
      let status = '待排程';
      if (i < 2) status = '已完成';
      else if (i < 5) status = '生产中';
      else if (i < 8) status = '待排程';
      else if (i < 11) status = '已排程';
      else if (i < 13) status = '临期待交付';
      const orderDate = getTodayISO(-Math.floor(Math.random() * 20));
      orders.push({
        order_no: `SO-2026-${String(i + 1).padStart(4, '0')}`,
        customer: customerList[i % customerList.length],
        steel_grade: grade.grade,
        specification: grade.typical,
        quantity: qty,
        order_date: orderDate,
        delivery_date: getTodayISO(deliveryOffset),
        urgency,
        status,
        actual_output: status === '已完成' ? qty * (0.95 + Math.random() * 0.04) : (status === '生产中' ? qty * (0.3 + Math.random() * 0.4) : 0),
        quality_rate: status === '已完成' ? 96 + Math.random() * 3.8 : (status === '生产中' ? 94 + Math.random() * 4 : null),
        note: `${grade.category}，用于${customerList[i % customerList.length].slice(0, 6)}的${['底盘结构件', '车门外板', '船体外板', '动臂结构', '电机壳体', '制冷盘管'][i % 6]}，执行标准${['GB/T 700', 'GB/T 1591', 'EN 10130', 'JIS G 3131', 'GB 712'][i % 5]}`,
        created_at: getDateTimeISO(-720 + i * 10),
        updated_at: getDateTimeISO(-5 + i)
      });
    }
    orders.forEach(o => this._insert('sales_orders', o));

    const materials = [
      { material_code: 'MAT-FE-001', name: '铁矿粉（澳矿）',   category: '炼铁原料', spec: 'Fe≥62%，-200目≥80%', unit: '吨', stock: 85000,  safe_stock: 50000, max_stock: 150000, unit_price: 820,  supplier: '必和必拓中国',     location: '原料场A1区', last_update: getDateTimeISO(-2) },
      { material_code: 'MAT-FE-002', name: '铁矿粉（巴西矿）', category: '炼铁原料', spec: 'Fe≥65%，SiO₂≤4.5%',  unit: '吨', stock: 42000,  safe_stock: 30000, max_stock: 100000, unit_price: 910,  supplier: '淡水河谷中国',     location: '原料场A2区', last_update: getDateTimeISO(-1) },
      { material_code: 'MAT-FE-003', name: '废钢（重型）',     category: '炼钢原料', spec: '厚度≥6mm，长度≤600mm', unit: '吨', stock: 12800, safe_stock: 8000,  max_stock: 30000,  unit_price: 2680, supplier: '本地回收加工集团', location: '废钢场B区',  last_update: getDateTimeISO(-6) },
      { material_code: 'MAT-AL-001', name: '铝粒（脱氧用）',   category: '合金原料', spec: 'Al≥99%，Φ5-20mm',    unit: '吨', stock: 186,    safe_stock: 120,   max_stock: 400,    unit_price: 16500,supplier: '中铝集团',           location: '合金库103',  last_update: getDateTimeISO(-4) },
      { material_code: 'MAT-MN-001', name: '高碳锰铁',         category: '合金原料', spec: 'Mn≥78%，C≤7.5%',     unit: '吨', stock: 420,    safe_stock: 280,   max_stock: 800,    unit_price: 8900, supplier: '鄂尔多斯电冶',     location: '合金库105',  last_update: getDateTimeISO(-8) },
      { material_code: 'MAT-SI-001', name: '硅铁',             category: '合金原料', spec: 'Si≥75%，Al≤2%',      unit: '吨', stock: 560,    safe_stock: 350,   max_stock: 900,    unit_price: 6200, supplier: '青海百通',         location: '合金库106',  last_update: getDateTimeISO(-3) },
      { material_code: 'MAT-CA-001', name: '活性石灰',         category: '造渣原料', spec: 'CaO≥92%，活性度≥360', unit: '吨', stock: 3200,   safe_stock: 2000,  max_stock: 6000,   unit_price: 480,  supplier: '本厂石灰车间',     location: '粉料仓C3',   last_update: getDateTimeISO(-1) },
      { material_code: 'MAT-RF-001', name: '镁碳砖',           category: '耐火材料', spec: 'MgO≥80%，C≥14%',     unit: '吨', stock: 98,     safe_stock: 70,    max_stock: 200,    unit_price: 12800,supplier: '辽宁青花集团',     location: '耐材库201',  last_update: getDateTimeISO(-12)},
      { material_code: 'MAT-RG-001', name: '连铸保护渣',       category: '辅助材料', spec: '碱度R=1.2，熔点1100℃', unit: '吨', stock: 36,    safe_stock: 25,    max_stock: 80,     unit_price: 5600, supplier: '河南熔金',         location: '耐材库203',  last_update: getDateTimeISO(-5) },
      { material_code: 'MAT-GS-001', name: '中间包涂抹料',     category: '辅助材料', spec: 'MgO质，1800℃耐侵蚀', unit: '吨', stock: 72,     safe_stock: 50,    max_stock: 150,    unit_price: 3800, supplier: '营口青花',         location: '耐材库204',  last_update: getDateTimeISO(-10)},
      { material_code: 'MAT-SP-001', name: '轧制乳化液',       category: '工艺介质', spec: '5%浓度，PH7-8',       unit: '吨', stock: 120,    safe_stock: 80,    max_stock: 300,    unit_price: 9800, supplier: '奎克化学',         location: '油化库301',  last_update: getDateTimeISO(-7) },
      { material_code: 'MAT-HY-001', name: '液压油（46#）',    category: '润滑介质', spec: 'ISO VG46，抗磨',      unit: '桶', stock: 320,    safe_stock: 200,   max_stock: 600,    unit_price: 2800, supplier: '美孚工业',         location: '油化库302',  last_update: getDateTimeISO(-15)},
      { material_code: 'MAT-FG-001', name: '氩气',             category: '气体介质', spec: 'Ar≥99.999%，瓶装',   unit: '瓶', stock: 560,    safe_stock: 400,   max_stock: 1000,   unit_price: 180,  supplier: '林德气体',         location: '气体站',     last_update: getDateTimeISO(-1) },
      { material_code: 'MAT-FG-002', name: '氧气',             category: '气体介质', spec: 'O₂≥99.5%，管道供应', unit: 'Nm³', stock: 120000, safe_stock: 80000, max_stock: 250000, unit_price: 0.85, supplier: '本厂空分',         location: '管网',       last_update: getDateTimeISO(-0) },
      { material_code: 'MAT-N2-001', name: '氮气',             category: '气体介质', spec: 'N₂≥99.99%，管道供应', unit: 'Nm³', stock: 180000, safe_stock: 120000,max_stock: 350000, unit_price: 0.42, supplier: '本厂空分',         location: '管网',       last_update: getDateTimeISO(-0) }
    ];
    materials.forEach(m => this._insert('materials', m));

    const heats = [
      { heat_no: `HEAT-${getTodayISO().replace(/-/g, '')}-001`, order_id: 3,  steel_grade: 'SPHC',  plan_weight: 150, actual_weight: 148.6, status: '连铸中',   converter_no: 1, lf_time: 38, rh_time: 0,   tundish_life: 7,  start_time: getDateTimeISO(-6), end_time: null,               quality_locked: 0, operator: '张师傅' },
      { heat_no: `HEAT-${getTodayISO().replace(/-/g, '')}-002`, order_id: 3,  steel_grade: 'SPHC',  plan_weight: 150, actual_weight: 149.2, status: 'RH精炼', converter_no: 2, lf_time: 32, rh_time: 18,  tundish_life: 8,  start_time: getDateTimeISO(-4), end_time: null,               quality_locked: 0, operator: '张师傅' },
      { heat_no: `HEAT-${getTodayISO().replace(/-/g, '')}-003`, order_id: 4,  steel_grade: 'AH32',  plan_weight: 180, actual_weight: 0,     status: 'LF精炼', converter_no: 3, lf_time: 45, rh_time: 0,   tundish_life: 1,  start_time: getDateTimeISO(-2), end_time: null,               quality_locked: 0, operator: '张师傅' },
      { heat_no: `HEAT-${getTodayISO().replace(/-/g, '')}-004`, order_id: 5,  steel_grade: 'Q345B', plan_weight: 120, actual_weight: 119.0, status: '转炉吹炼',converter_no: 1, lf_time: 0,  rh_time: 0,   tundish_life: 0,  start_time: getDateTimeISO(-1), end_time: null,               quality_locked: 0, operator: '王师傅' },
      { heat_no: `HEAT-${getTodayISO().replace(/-/g, '')}-005`, order_id: 9,  steel_grade: 'Q235B', plan_weight: 120, actual_weight: 118.5, status: '连铸等待',converter_no: 2, lf_time: 40, rh_time: 0,   tundish_life: 5,  start_time: getDateTimeISO(-3), end_time: null,               quality_locked: 1, locked_reason: 'S含量超标0.008%，标准≤0.005%', operator: '王师傅' },
      { heat_no: `HEAT-${getTodayISO(-1).replace(/-/g, '')}-028`, order_id: 1, steel_grade: 'DC01',   plan_weight: 120, actual_weight: 118.2, status: '热轧完成', converter_no: 1, lf_time: 36, rh_time: 22, tundish_life: 9,  start_time: getDateTimeISO(-22), end_time: getDateTimeISO(-18), quality_locked: 0, operator: '王师傅' },
      { heat_no: `HEAT-${getTodayISO(-1).replace(/-/g, '')}-029`, order_id: 2, steel_grade: 'DC04',   plan_weight: 120, actual_weight: 119.5, status: '冷轧完成', converter_no: 2, lf_time: 40, rh_time: 28, tundish_life: 10, start_time: getDateTimeISO(-20), end_time: getDateTimeISO(-12), quality_locked: 0, operator: '刘师傅' }
    ];
    heats.forEach(h => this._insert('production_heats', h));

    const maint = [
      { workorder_no: `WO-${Date.now()}-001`, equip_id: 10, type: '预防性', priority: '高', content: '1号冷轧机工作辊更换+传动齿轮箱检查+液压系统换油', status: '维修中', team: '冷轧机械班', plan_start: getDateTimeISO(-4), plan_end: getDateTimeISO(8), actual_start: getDateTimeISO(-4), actual_end: null, parts_used: '工作辊×2、齿轮油46#×200L、密封件×8', created_at: getDateTimeISO(-80) },
      { workorder_no: `WO-${Date.now()}-002`, equip_id: 6,  type: '预防性', priority: '中', content: '1号连铸机结晶器铜板检查，扇形段1-5段对中调整', status: '待执行', team: '连铸机械班', plan_start: getDateTimeISO(24), plan_end: getDateTimeISO(36), actual_start: null, actual_end: null, parts_used: '结晶器铜板×2', created_at: getDateTimeISO(-72) },
      { workorder_no: `WO-${Date.now()}-003`, equip_id: 8,  type: '预测性', priority: '中', content: '1号加热炉蓄热体吹扫、换热器检查（振动监测预警）', status: '待执行', team: '热轧机械班', plan_start: getDateTimeISO(48), plan_end: getDateTimeISO(56), actual_start: null, actual_end: null, parts_used: '蓄热陶瓷体备件', created_at: getDateTimeISO(-60) },
      { workorder_no: `WO-${Date.now()}-004`, equip_id: 2,  type: '故障性', priority: '高', content: '2号转炉氧枪升降液压缸渗漏处理', status: '待执行', team: '炼钢液压班', plan_start: getDateTimeISO(2),  plan_end: getDateTimeISO(6),  actual_start: null, actual_end: null, parts_used: '密封件×1套、液压油46#×200L', created_at: getDateTimeISO(-2) },
      { workorder_no: `WO-${Date.now()}-005`, equip_id: 1,  type: '预防性', priority: '低', content: '1号转炉倾动减速机定期换油', status: '待审批', team: '炼钢机械班', plan_start: getDateTimeISO(168),plan_end: getDateTimeISO(172),actual_start: null, actual_end: null, parts_used: '工业齿轮油220#×400L', created_at: getDateTimeISO(-100) }
    ];
    maint.forEach(m => this._insert('maintenance_orders', m));

    const quality = [
      { record_no: `QR-${Date.now()}-001`, heat_id: 5,  process_step: '转炉终点',   inspector: '赵质检', result: '不合格', defect_type: '成分异常',   defect_desc: 'S含量0.008%超出标准上限0.005%，P=0.018%合格', chemical_analysis: 'C=0.16%,Si=0.22%,Mn=0.55%,S=0.008%,P=0.018%', mechanical_test: null, inspection_time: getDateTimeISO(-2), note: '建议LF深脱硫后评审是否放行' },
      { record_no: `QR-${Date.now()}-002`, heat_id: 6,  process_step: '热轧成品',   inspector: '赵质检', result: '合格',   defect_type: null,          defect_desc: null, chemical_analysis: 'C=0.02%,Si=0.01%,Mn=0.18%,S=0.005%,P=0.010%,Als=0.035%', mechanical_test: 'Rp=142MPa,Rm=278MPa,A50=46%', inspection_time: getDateTimeISO(-14), note: '深冲性能良好' },
      { record_no: `QR-${Date.now()}-003`, heat_id: 7,  process_step: '冷轧成品',   inspector: '赵质检', result: '合格',   defect_type: null,          defect_desc: null, chemical_analysis: 'C=0.005%,Si≤0.01%,Mn=0.15%,S=0.003%,P=0.008%,Als=0.040%', mechanical_test: 'Rp=122MPa,Rm=258MPa,A80=52%,n=0.24,r=2.2', inspection_time: getDateTimeISO(-8),  note: '超深冲DC04性能指标全部达标' },
      { record_no: `QR-${Date.now()}-004`, heat_id: 1,  process_step: 'LF精炼',     inspector: '赵质检', result: '合格',   defect_type: null,          defect_desc: null, chemical_analysis: 'C=0.06%,Si=0.02%,Mn=0.28%,S=0.005%,P=0.012%', mechanical_test: null, inspection_time: getDateTimeISO(-5), note: null },
      { record_no: `QR-${Date.now()}-005`, heat_id: 2,  process_step: 'RH真空',     inspector: '赵质检', result: '合格',   defect_type: null,          defect_desc: null, chemical_analysis: '[H]=1.2ppm,[N]=28ppm,[O]=12ppm', mechanical_test: null, inspection_time: getDateTimeISO(-3), note: '真空度0.25Torr，保持22min，脱气良好' }
    ];
    quality.forEach(q => this._insert('quality_records', q));

    const shiftDate = getTodayISO();
    const shifts = [
      { shift_date: shiftDate, shift_type: '早班(08-16)', user_id: 3,  user_name: '张师傅', position: '转炉主操',  work_hours: 8, overtime_hours: 0, note: null },
      { shift_date: shiftDate, shift_type: '早班(08-16)', user_id: 4,  user_name: '王师傅', position: '连铸主操',  work_hours: 8, overtime_hours: 2, note: '处理1号连铸机结晶器液位异常，加班2小时' },
      { shift_date: shiftDate, shift_type: '早班(08-16)', user_id: 6,  user_name: '赵质检', position: '理化检验',  work_hours: 8, overtime_hours: 0, note: null },
      { shift_date: shiftDate, shift_type: '中班(16-24)', user_id: 5,  user_name: '刘师傅', position: '冷轧主操',  work_hours: 8, overtime_hours: 0, note: null },
      { shift_date: shiftDate, shift_type: '中班(16-24)', user_id: 7,  user_name: '钱维修', position: '机械维修',  work_hours: 8, overtime_hours: 3, note: '1号冷轧机工作辊更换抢修' },
      { shift_date: shiftDate, shift_type: '中班(16-24)', user_id: 10, user_name: '陈师傅', position: '加热炉主操',work_hours: 8, overtime_hours: 0, note: null },
      { shift_date: shiftDate, shift_type: '夜班(00-08)', user_id: 3,  user_name: '张师傅', position: '转炉主操',  work_hours: 0, overtime_hours: 0, note: '休息' },
      { shift_date: shiftDate, shift_type: '夜班(00-08)', user_id: 4,  user_name: '王师傅', position: '连铸主操',  work_hours: 0, overtime_hours: 0, note: '休息' }
    ];
    shifts.forEach(s => { s.created_at = getDateTimeISO(-24); this._insert('workforce_shifts', s); });

    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
    const schId = 1;
    this._insert('schedules', {
      schedule_date: shiftDate, schedule_type: '日常生产', status: '待审批',
      approved_by: null, approved_at: null,
      remark: '今日重点：完成SO-2026-0003一汽SPHC订单；跟踪SO-2026-0005的Q345B船板钢；1号冷轧机继续更换工作辊',
      created_at: getDateTimeISO(-8)
    });

    const scheduleStartHour = 6;
    const items = [];
    for (let i = 0; i < 12; i++) {
      const order = orders[i % orders.length];
      const equip = equipment[i % equipment.length];
      const hr = scheduleStartHour + i * 1.5;
      const startH = Math.floor(hr), startM = Math.floor((hr % 1) * 60);
      const endH = Math.floor(hr + 1.3), endM = Math.floor(((hr + 1.3) % 1) * 60);
      items.push({
        schedule_id: schId, order_id: order.id, equip_id: equip.id, equip_type: equip.type, sequence: i + 1,
        plan_start: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')} ${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00`,
        plan_end:   `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')} ${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`,
        steel_grade: order.steel_grade, weight: order.quantity / 4,
        actual_start: i < 5 ? `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')} ${String(startH).padStart(2, '0')}:${String(startM + 3).padStart(2, '0')}:00` : null,
        actual_end:   i < 3 ? `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')} ${String(endH).padStart(2, '0')}:${String(Math.max(0, endM - 8)).padStart(2, '0')}:00` : null,
        progress: i < 3 ? 100 : (i === 3 ? 68 : (i === 4 ? 25 : 0)),
        status: i < 3 ? '已完成' : (i < 5 ? '执行中' : '待开始'),
        remark: null
      });
    }
    items.forEach(it => this._insert('schedule_items', it));

    const records = [
      { record_no: `IR-${Date.now()}-001`, material_id: 3,  type: '出', quantity: 128, operator: '孙库管', reason: '3号转炉第003炉次投料', related_order: orders[2].order_no, created_at: getDateTimeISO(-6) },
      { record_no: `IR-${Date.now()}-002`, material_id: 4,  type: '出', quantity: 0.36,operator: '孙库管', reason: '第001/002炉次脱氧剂添加', related_order: orders[0].order_no, created_at: getDateTimeISO(-5) },
      { record_no: `IR-${Date.now()}-003`, material_id: 5,  type: '出', quantity: 0.48,operator: '孙库管', reason: '合金化添加',               related_order: orders[1].order_no, created_at: getDateTimeISO(-4) },
      { record_no: `IR-${Date.now()}-004`, material_id: 1,  type: '入', quantity: 24000,operator: '孙库管', reason: '原料船"远洋12号"到港卸货', related_order: null,            created_at: getDateTimeISO(-2) },
      { record_no: `IR-${Date.now()}-005`, material_id: 13, type: '入', quantity: 120,  operator: '孙库管', reason: '林德气体月度供应补库',   related_order: null,            created_at: getDateTimeISO(-1) }
    ];
    records.forEach(r => this._insert('inventory_records', r));

    this.save();
    console.log('✅ 钢铁数据库种子数据初始化完成：',
      `${this.tables.users.length}用户 / ${this.tables.equipment.length}设备 / ${this.tables.sales_orders.length}订单 / ` +
      `${this.tables.materials.length}物料 / ${this.tables.production_heats.length}炉次 / ${this.tables.quality_records.length}质检记录`);
  }
}

let STEEL_DB_INSTANCE = null;
function getSteelDb() {
  if (!STEEL_DB_INSTANCE) STEEL_DB_INSTANCE = new SteelMemoryDatabase();
  return STEEL_DB_INSTANCE;
}

export function query(sql, params = []) {
  const db = getSteelDb();
  sql = sql.trim();
  try {
    if (sql.toUpperCase().startsWith('INSERT INTO')) {
      const match = sql.match(/INSERT INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES/i);
      if (!match) throw new Error('INSERT语法错误');
      const [, table, colsStr] = match;
      const cols = colsStr.split(',').map(c => c.trim().replace(/^['"`]|['"`]$/g, ''));
      const paramList = Array.isArray(params[0]) ? params : [params];
      let count = 0;
      paramList.forEach(pArr => {
        const row = {};
        cols.forEach((c, i) => { row[c] = pArr[i]; });
        db._insert(table, row);
        count++;
      });
      return { success: true, inserted: count };
    }
    if (sql.toUpperCase().startsWith('UPDATE')) {
      const match = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?\s*;?$/i);
      if (!match) throw new Error('UPDATE语法错误');
      const [, table, setStr, whereStr] = match;
      const data = {};
      const setMatches = setStr.match(/(\w+)\s*=\s*\?/g) || [];
      let pi = 0;
      setMatches.forEach(s => { const m = s.match(/(\w+)\s*=\s*\?/); if (m) data[m[1]] = params[pi++]; });
      const where = whereStr ? _parseSimpleWhere(whereStr, params.slice(pi)) : {};
      const count = db._update(table, where, data);
      return { success: true, updated: count };
    }
    if (sql.toUpperCase().startsWith('DELETE FROM')) {
      const match = sql.match(/DELETE FROM\s+(\w+)(?:\s+WHERE\s+(.+))?\s*;?$/i);
      if (!match) throw new Error('DELETE语法错误');
      const [, table, whereStr] = match;
      const where = whereStr ? _parseSimpleWhere(whereStr, params) : {};
      const count = db._delete(table, where);
      return { success: true, deleted: count };
    }
    if (sql.toUpperCase().startsWith('SELECT')) {
      const match = sql.match(/SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER BY\s+(.+?))?(?:\s+LIMIT\s+(\d+))?\s*;?$/i);
      if (!match) throw new Error('SELECT语法错误');
      const [, , table, whereStr, orderBy, limit] = match;
      const where = whereStr ? _parseSimpleWhere(whereStr, params) : {};
      return db._select(table, where, orderBy, limit ? parseInt(limit) : null);
    }
    throw new Error('不支持的SQL类型');
  } catch (e) {
    console.error('❌ 钢铁SQL执行错误:', e.message, sql, params);
    throw e;
  }
}

function _parseSimpleWhere(whereStr, params) {
  const where = {};
  let pi = 0;
  const parts = whereStr.split(/\s+AND\s+/i);
  parts.forEach(p => {
    const m = p.match(/(\w+)\s*=\s*\?/);
    if (m) where[m[1]] = params[pi++];
  });
  return where;
}

export function insert(table, data) { const db = getSteelDb(); return db._insert(table, { ...data }); }
export function update(table, id, data) { const db = getSteelDb(); return db._update(table, { id }, data); }
export function remove(table, id) { const db = getSteelDb(); return db._delete(table, { id }); }
export function list(table, orderBy, limit) { const db = getSteelDb(); return db._select(table, {}, orderBy, limit); }
export function findById(table, id) { const db = getSteelDb(); const rows = db._select(table, { id }); return rows[0] || null; }
export function findAll(table, where, orderBy) { const db = getSteelDb(); return db._select(table, where, orderBy); }

export function getSteelKpiDashboard() {
  const db = getSteelDb();
  const orders = db._select('sales_orders');
  const heats = db._select('production_heats');
  const equips = db._select('equipment');
  const maints = db._select('maintenance_orders');
  const quality = db._select('quality_records');
  const finishedOrders = orders.filter(o => o.status === '已完成');
  const todayOutput = finishedOrders.reduce((s, o) => s + (o.actual_output || 0), 0);
  const pendingMaint = maints.filter(m => ['待执行', '维修中', '待审批'].includes(m.status)).length;
  const qualWarn = quality.filter(q => q.result === '不合格').length;
  const lockedHeats = heats.filter(h => h.quality_locked).length;
  const equipRunning = equips.filter(e => e.status === '运行中').length;
  const materials = db._select('materials');
  const lowStock = materials.filter(m => m.stock <= m.safe_stock).length;
  return {
    today_output: Math.round(todayOutput),
    today_quality_rate: finishedOrders.length ? Math.round(finishedOrders.reduce((s, o) => s + (o.quality_rate || 0), 0) / finishedOrders.length * 10) / 10 : 98.2,
    pending_orders: orders.filter(o => ['待排程', '已排程'].includes(o.status)).length,
    pending_orders_weight: Math.round(orders.filter(o => ['待排程', '已排程'].includes(o.status)).reduce((s, o) => s + o.quantity, 0)),
    equipment_utilization: Math.round(equipRunning / Math.max(1, equips.length) * 1000) / 10,
    today_energy: 18650,
    in_progress_heats: heats.filter(h => ['转炉吹炼', 'LF精炼', 'RH精炼', '连铸中', '连铸等待', '热轧中', '冷轧中'].includes(h.status)).length,
    pending_maintenance: pendingMaint,
    quality_alarms: qualWarn,
    locked_heats: lockedHeats,
    equipment_running: equipRunning,
    equipment_total: equips.length,
    low_stock_warning: lowStock,
    overdue_orders: orders.filter(o => o.status === '临期待交付').length
  };
}

export function resetSteelDatabase() {
  localStorage.removeItem(STEEL_STORAGE_KEY);
  STEEL_DB_INSTANCE = null;
  getSteelDb();
}

export const STEEL_INFO = {
  system_name: '大型钢铁企业炼钢-连铸-轧制一体化生产调度与质量追溯系统',
  storage_key: STEEL_STORAGE_KEY,
  tables: Object.keys(STEEL_TABLE_SCHEMA)
};
