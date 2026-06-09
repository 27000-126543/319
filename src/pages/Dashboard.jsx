import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { query } from '../utils/api.js';
import { formatDateTime, formatNumber, todayStr, getEqTypeLabel, getStatusDot } from '../utils/format.js';

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#13c2c2', '#722ed1', '#eb2f96'];

const dailyOutputData = [
  { date: '06-03', 产量: 2850, 合格: 2780, 能耗: 185 },
  { date: '06-04', 产量: 2920, 合格: 2860, 能耗: 190 },
  { date: '06-05', 产量: 2780, 合格: 2710, 能耗: 182 },
  { date: '06-06', 产量: 3010, 合格: 2950, 能耗: 195 },
  { date: '06-07', 产量: 2980, 合格: 2920, 能耗: 188 },
  { date: '06-08', 产量: 3050, 合格: 2995, 能耗: 192 },
  { date: '06-09', 产量: 2680, 合格: 2640, 能耗: 175 }
];

const steelGradeData = [
  { name: 'Q235B', value: 3500, rate: '28.6%' },
  { name: 'DC01', value: 2800, rate: '22.9%' },
  { name: 'SPHC', value: 2200, rate: '18.0%' },
  { name: 'AH32', value: 1500, rate: '12.3%' },
  { name: 'HC340LA', value: 1200, rate: '9.8%' },
  { name: 'ST14', value: 1050, rate: '8.6%' }
];

const energyData = [
  { time: '00', 电耗: 1200, 气耗: 850, 水耗: 320 },
  { time: '04', 电耗: 950, 气耗: 680, 水耗: 280 },
  { time: '08', 电耗: 1800, 气耗: 1250, 水耗: 450 },
  { time: '12', 电耗: 2100, 气耗: 1480, 水耗: 520 },
  { time: '16', 电耗: 2050, 气耗: 1420, 水耗: 510 },
  { time: '20', 电耗: 1650, 气耗: 1150, 水耗: 420 }
];

const equipmentStatus = [
  { id: 1, name: '1号转炉', type: 'converter', status: '运行中', temp: 1650, progress: 68 },
  { id: 2, name: '2号转炉', type: 'converter', status: '运行中', temp: 1580, progress: 42 },
  { id: 3, name: '3号转炉', type: 'converter', status: '维护中', temp: 0, progress: 0 },
  { id: 4, name: 'RH精炼炉', type: 'refinery', status: '运行中', temp: 1620, progress: 75 },
  { id: 5, name: 'LF精炼炉', type: 'refinery', status: '空闲', temp: 0, progress: 0 },
  { id: 6, name: '1号连铸机', type: 'caster', status: '运行中', temp: 1540, progress: 55 },
  { id: 7, name: '2号连铸机', type: 'caster', status: '运行中', temp: 1520, progress: 38 },
  { id: 8, name: '1号热轧机', type: 'rolling_mill', status: '运行中', temp: 1100, progress: 82 },
  { id: 9, name: '2号热轧机', type: 'rolling_mill', status: '空闲', temp: 0, progress: 0 },
  { id: 10, name: '1号冷轧机', type: 'rolling_mill_cold', status: '运行中', temp: 45, progress: 62 },
  { id: 11, name: '2号冷轧机', type: 'rolling_mill_cold', status: '运行中', temp: 52, progress: 48 }
];

const recentAlerts = [
  { id: 1, type: '质量报警', level: 'danger', content: '炉次H240609003碳含量超标: 0.22% (标准≤0.20%)', time: '14:32:15', heat: 'H240609003' },
  { id: 2, type: '库存预警', level: 'warning', content: '中间包库存低于安全库存 (50/10)', time: '14:15:42', heat: '-' },
  { id: 3, type: '设备预警', level: 'warning', content: '1号转炉振动值偏高: 4.2mm/s', time: '13:58:20', heat: 'H240609002' },
  { id: 4, type: '质量报警', level: 'danger', content: '炉次H240609001终轧温度偏低', time: '12:45:08', heat: 'H240609001' },
  { id: 5, type: '调整申请', level: 'info', content: '李炼钢申请调整2号转炉排程', time: '11:30:55', heat: '-' }
];

const activeHeats = [
  { heat_no: 'H240609012', stage: '吹炼中', converter: '1号转炉', grade: 'Q235B', weight: 120, progress: 68, start: '14:15' },
  { heat_no: 'H240609011', stage: '精炼中', caster: 'RH精炼炉', grade: 'DC01', weight: 118, progress: 75, start: '13:40' },
  { heat_no: 'H240609010', stage: '连铸中', caster: '1号连铸机', grade: 'Q235B', weight: 115, progress: 55, start: '12:50' },
  { heat_no: 'H240609009', stage: '热轧中', mill: '1号热轧机', grade: 'SPHC', weight: 112, progress: 82, start: '11:20' },
  { heat_no: 'H240609008', stage: '冷轧中', mill: '1号冷轧机', grade: 'DC01', weight: 108, progress: 62, start: '09:45' },
  { heat_no: 'H240609007', stage: '质量锁定', grade: 'HC340LA', weight: 110, progress: 100, start: '08:10' }
];

function Dashboard({ user }) {
  const [stats, setStats] = useState({
    todayOutput: 2680,
    todayQualified: 2640,
    pendingOrders: 18,
    runningEquip: 8,
    totalEquip: 11,
    energyConsumption: 18560,
    maintenanceOrders: 5,
    qualityAlerts: 3
  });

  const [heats, setHeats] = useState(activeHeats);
  const [equips, setEquips] = useState(equipmentStatus);

  useEffect(() => {
    loadData();
    const interval = setInterval(updateRealtime, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const eqList = await query('SELECT * FROM equipment ORDER BY code');
      if (eqList && eqList.length > 0) {
        setEquips(eqList);
      }
    } catch (e) {
      console.log('Using demo data');
    }
  };

  const updateRealtime = () => {
    setHeats(prev => prev.map(h => ({
      ...h,
      progress: h.stage !== '质量锁定' ? Math.min(100, h.progress + Math.random() * 2) : h.progress
    })));
  };

  const qualifiedRate = ((stats.todayQualified / stats.todayOutput) * 100).toFixed(1);
  const equipUtilization = ((stats.runningEquip / stats.totalEquip) * 100).toFixed(1);

  return (
    <div style={{ minHeight: '100%' }}>
      <div className="grid-4 mb-20">
        <div className="stat-card primary">
          <div className="stat-label">今日产量</div>
          <div className="stat-value">{stats.todayOutput}<span className="stat-unit">吨</span></div>
          <div className="stat-change up">↑ 2.8% 较昨日</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">合格率</div>
          <div className="stat-value">{qualifiedRate}<span className="stat-unit">%</span></div>
          <div className="stat-change up">↑ 0.5% 较昨日</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">待排程订单</div>
          <div className="stat-value">{stats.pendingOrders}<span className="stat-unit">笔</span></div>
          <div className="stat-change" style={{ color: '#999' }}>共需排产 8,670 吨</div>
        </div>
        <div className="stat-card info">
          <div className="stat-label">设备利用率</div>
          <div className="stat-value">{equipUtilization}<span className="stat-unit">%</span></div>
          <div className="stat-change" style={{ color: '#999' }}>{stats.runningEquip}/{stats.totalEquip} 台运行</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-label">能耗 (今日)</div>
          <div className="stat-value">{formatNumber(stats.energyConsumption, 0)}<span className="stat-unit">kWh</span></div>
          <div className="stat-change down">↓ 3.2% 较昨日</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">在制炉次</div>
          <div className="stat-value">{heats.filter(h => !h.stage.includes('锁定') && !h.stage.includes('完成')).length}<span className="stat-unit">炉</span></div>
          <div className="stat-change" style={{ color: '#999' }}>3 炉待开始</div>
        </div>
        <div className="stat-card primary">
          <div className="stat-label">待处理维保</div>
          <div className="stat-value">{stats.maintenanceOrders}<span className="stat-unit">单</span></div>
          <div className="stat-change" style={{ color: '#faad14' }}>⚠ 2 单紧急</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-label">质量报警</div>
          <div className="stat-value">{stats.qualityAlerts}<span className="stat-unit">条</span></div>
          <div className="stat-change down">1 炉锁定待处理</div>
        </div>
      </div>

      <div className="grid-2 mb-20">
        <div className="card">
          <div className="card-header">
            <span className="card-title">📊 近7天产量与合格率趋势</span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dailyOutputData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="产量" fill="#1890ff" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="合格" fill="#52c41a" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="能耗" stroke="#faad14" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">🥧 今日钢种产量分布</span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={steelGradeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, rate }) => `${name} ${rate}`}
                  labelLine={{ stroke: '#999' }}
                >
                  {steelGradeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card mb-20">
        <div className="card-header">
          <span className="card-title">⚙️ 设备实时运行状态</span>
          <span style={{ fontSize: 12, color: '#999' }}>
            <span className="tag tag-success">运行中</span>
            <span className="tag tag-gray" style={{ marginLeft: 8 }}>空闲</span>
            <span className="tag tag-warning" style={{ marginLeft: 8 }}>维护中</span>
            <span className="tag tag-danger" style={{ marginLeft: 8 }}>故障</span>
          </span>
        </div>
        <div className="card-body">
          <div className="grid-4">
            {equips.map(eq => (
              <div key={eq.id} className="card" style={{
                borderLeft: `4px solid ${getStatusDot(eq.status)}`,
                margin: 0
              }}>
                <div className="card-body" style={{ padding: 16 }}>
                  <div className="flex-between mb-12">
                    <div>
                      <div className="font-bold">{eq.name}</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                        {getEqTypeLabel(eq.type)} · {eq.code}
                      </div>
                    </div>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: getStatusDot(eq.status),
                        boxShadow: eq.status === '运行中' ? `0 0 8px ${getStatusDot(eq.status)}` : 'none'
                      }}
                    />
                  </div>
                  {eq.status === '运行中' && (
                    <>
                      <div className="progress-bar mb-8">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${eq.progress || Math.floor(Math.random() * 80 + 20)}%`,
                            background: eq.type.includes('cold') ? '#13c2c2' :
                              eq.type === 'rolling_mill' ? '#52c41a' :
                              eq.type === 'caster' ? '#1890ff' :
                              eq.type === 'refinery' ? '#faad14' : '#ff6b35'
                          }}
                        />
                      </div>
                      <div className="flex-between" style={{ fontSize: 12, color: '#666' }}>
                        <span>进度: {eq.progress || 45}%</span>
                        {eq.temp > 0 && <span>温度: {eq.temp || Math.floor(Math.random() * 500 + 1100)}℃</span>}
                      </div>
                    </>
                  )}
                  {eq.status !== '运行中' && (
                    <div style={{ fontSize: 13, color: '#999', textAlign: 'center', padding: '12px 0' }}>
                      {eq.status === '维护中' ? '🔧 预计18:00完成' : eq.status === '故障' ? '⚠️ 等待维修' : '⏸ 等待排产'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2 mb-20">
        <div className="card">
          <div className="card-header">
            <span className="card-title">🔥 在制炉次追踪</span>
          </div>
          <div className="card-body" style={{ padding: 12 }}>
            <table>
              <thead>
                <tr>
                  <th>炉次号</th>
                  <th>工序</th>
                  <th>钢种</th>
                  <th>进度</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {heats.map(h => (
                  <tr key={h.heat_no}>
                    <td className="font-bold" style={{ fontFamily: 'monospace' }}>{h.heat_no}</td>
                    <td>{h.converter || h.caster || h.mill || '-'}</td>
                    <td><span className="tag tag-primary">{h.grade}</span></td>
                    <td style={{ minWidth: 120 }}>
                      <div className="flex-between" style={{ fontSize: 12, marginBottom: 4 }}>
                        <span>{h.start}</span>
                        <span>{Math.floor(h.progress)}%</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${h.progress}%`,
                            background: h.stage.includes('锁定') ? '#ff4d4f' :
                              h.stage.includes('吹炼') ? '#ff6b35' :
                              h.stage.includes('精炼') ? '#faad14' :
                              h.stage.includes('连铸') ? '#1890ff' :
                              h.stage.includes('热轧') ? '#52c41a' : '#13c2c2'
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <span className={`tag ${h.stage.includes('锁定') ? 'tag-danger' :
                        h.stage.includes('吹炼') ? 'tag-primary' :
                        h.stage.includes('热轧') || h.stage.includes('冷轧') ? 'tag-success' : 'tag-info'}`}>
                        {h.stage}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">📢 实时报警与通知</span>
            <span className="tag tag-danger">{recentAlerts.filter(a => a.level === 'danger').length} 紧急</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="timeline" style={{ padding: '8px 20px' }}>
              {recentAlerts.map(a => (
                <div className="timeline-item" key={a.id}>
                  <div className={`timeline-dot ${a.level}`}>
                    {a.level === 'danger' ? '!' : a.level === 'warning' ? '⚠' : 'ℹ'}
                  </div>
                  <div className="timeline-content">
                    <div className="flex-between">
                      <span className="timeline-title">
                        <span className={`tag ${a.level === 'danger' ? 'tag-danger' :
                          a.level === 'warning' ? 'tag-warning' : 'tag-info'}`}>
                          {a.type}
                        </span>
                        {a.heat !== '-' && <span style={{ marginLeft: 8, fontSize: 12, fontFamily: 'monospace' }}>
                          炉次: {a.heat}
                        </span>}
                      </span>
                      <span style={{ fontSize: 12, color: '#999' }}>{a.time}</span>
                    </div>
                    <div className="timeline-desc" style={{ marginTop: 6 }}>
                      {a.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">⚡ 今日能耗曲线 (分时)</span>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={energyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="电耗" stackId="1" stroke="#1890ff" fill="#1890ff" fillOpacity={0.6} />
              <Area type="monotone" dataKey="气耗" stackId="1" stroke="#ff6b35" fill="#ff6b35" fillOpacity={0.6} />
              <Area type="monotone" dataKey="水耗" stackId="1" stroke="#13c2c2" fill="#13c2c2" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
