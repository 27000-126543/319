import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatNumber } from '../utils/format.js';

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#13c2c2', '#722ed1', '#eb2f96', '#ff6b35'];

const monthlyData = [
  { month: '1月', 产量: 78500, 合格: 76200, 能耗: 568, 设备利用率: 82 },
  { month: '2月', 产量: 72300, 合格: 70500, 能耗: 552, 设备利用率: 78 },
  { month: '3月', 产量: 85600, 合格: 83800, 能耗: 598, 设备利用率: 88 },
  { month: '4月', 产量: 81200, 合格: 79100, 能耗: 578, 设备利用率: 85 },
  { month: '5月', 产量: 89500, 合格: 87600, 能耗: 612, 设备利用率: 90 },
  { month: '6月', 产量: 92300, 合格: 90500, 能耗: 628, 设备利用率: 92 }
];

const lineOutput = [
  { name: '转炉工段', 产量: 32100, 合格率: 97.8, 能耗: 28, OEE: 85.2 },
  { name: '精炼工段', 产量: 31800, 合格率: 98.5, 能耗: 15, OEE: 88.6 },
  { name: '连铸工段', 产量: 31200, 合格率: 98.2, 能耗: 18, OEE: 82.4 },
  { name: '热轧工段', 产量: 30500, 合格率: 97.5, 能耗: 42, OEE: 80.8 },
  { name: '冷轧工段', 产量: 15800, 合格率: 96.8, 能耗: 35, OEE: 78.2 }
];

const teamData = [
  { name: '甲班', 产量: 48200, 合格: 47100, 合格率: 97.7, 能耗: 312, 事故: 1 },
  { name: '乙班', 产量: 45800, 合格: 44800, 合格率: 97.8, 能耗: 302, 事故: 0 },
  { name: '丙班', 产量: 46500, 合格: 45300, 合格率: 97.4, 能耗: 308, 事故: 2 },
  { name: '丁班', 产量: 43800, 合格: 42900, 合格率: 97.9, 能耗: 296, 事故: 0 }
];

const steelGradeDist = [
  { name: 'Q235B', value: 28600, rate: '24.0%' },
  { name: 'Q345B', value: 15200, rate: '12.7%' },
  { name: 'DC01', value: 18500, rate: '15.5%' },
  { name: 'SPHC', value: 14800, rate: '12.4%' },
  { name: 'HC340LA', value: 8500, rate: '7.1%' },
  { name: 'AH32', value: 6200, rate: '5.2%' },
  { name: '其他', value: 26600, rate: '22.3%' }
];

const energyBreakdown = [
  { name: '电耗', value: 42, color: '#1890ff' },
  { name: '煤气', value: 28, color: '#ff6b35' },
  { name: '氧气', value: 12, color: '#52c41a' },
  { name: '氮气', value: 8, color: '#13c2c2' },
  { name: '水耗', value: 6, color: '#722ed1' },
  { name: '其他', value: 4, color: '#faad14' }
];

const equipmentRadar = [
  { subject: '转炉', A: 92, fullMark: 100 },
  { subject: '精炼炉', A: 88, fullMark: 100 },
  { subject: '连铸机', A: 85, fullMark: 100 },
  { subject: '热轧机', A: 80, fullMark: 100 },
  { subject: '冷轧机', A: 78, fullMark: 100 },
  { subject: '辅助设备', A: 90, fullMark: 100 }
];

const defectTrend = [
  { date: 'W1', 成分超标: 12, 表面缺陷: 8, 尺寸偏差: 5, 力学性能: 3 },
  { date: 'W2', 成分超标: 10, 表面缺陷: 10, 尺寸偏差: 6, 力学性能: 2 },
  { date: 'W3', 成分超标: 8, 表面缺陷: 7, 尺寸偏差: 4, 力学性能: 4 },
  { date: 'W4', 成分超标: 6, 表面缺陷: 6, 尺寸偏差: 3, 力学性能: 1 }
];

function Statistics({ user }) {
  const [period, setPeriod] = useState('month');
  const [lineFilter, setLineFilter] = useState('all');

  const summaryStats = {
    totalOutput: 89500 + 92300 + 81200,
    totalQualified: 87600 + 90500 + 79100,
    totalEnergy: 612 + 628 + 578,
    avgEquipmentUtil: ((82 + 78 + 88 + 85 + 90 + 92) / 6).toFixed(1),
    totalMaintenance: 47,
    avgTeamOutput: (48200 + 45800 + 46500 + 43800) / 4
  };

  const exportPDF = async (type) => {
    const doc = new jsPDF();

    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('STEEL PRODUCTION MONTHLY REPORT', 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.text('大型钢铁企业炼钢-连铸-轧制一体化生产调度系统', 105, 25, { align: 'center' });
    doc.setTextColor(51, 51, 51);

    doc.setFontSize(11);
    doc.text(`Report Period: 2024年${type === 'week' ? '第24周' : '06月'}  |  Generated: ${new Date().toLocaleDateString()}`, 14, 45);

    const summary = [
      ['Key Metrics', 'Value', 'Target', 'Status'],
      ['Total Production (t)', formatNumber(summaryStats.totalOutput, 0), '250,000', 'On Track'],
      ['Qualified Rate (%)', ((summaryStats.totalQualified / summaryStats.totalOutput) * 100).toFixed(2), '≥97.0%', '✓ Achieved'],
      ['Energy Consumption (kWh/t)', (summaryStats.totalEnergy / 3).toFixed(1), '≤600', '✓ Achieved'],
      ['Equipment Utilization (%)', summaryStats.avgEquipmentUtil, '≥85%', '✓ Achieved'],
      ['Maintenance Orders', summaryStats.totalMaintenance.toString(), '-', '-'],
      ['Avg Team Output (t)', formatNumber(summaryStats.avgTeamOutput, 0), '-', '-']
    ];

    autoTable(doc, {
      startY: 52,
      head: [summary[0]],
      body: summary.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 95], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: 35, halign: 'right' }, 2: { cellWidth: 30, halign: 'right' }, 3: { cellWidth: 35, halign: 'center' } }
    });

    const lineTable = [
      ['Production Line', 'Output (t)', 'Qualified Rate', 'Energy (kWh/t)', 'OEE (%)'],
      ...lineOutput.map(l => [l.name, formatNumber(l.产量, 0), `${l.合格率}%`, `${l.能耗}`, `${l.OEE.toFixed(1)}%`])
    ];

    autoTable(doc, {
      head: [lineTable[0]],
      body: lineTable.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [24, 144, 255], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 9 }
    });

    const teamTable = [
      ['Shift Team', 'Output (t)', 'Qualified (t)', 'Qualified Rate', 'Accidents'],
      ...teamData.map(t => [t.name, formatNumber(t.产量, 0), formatNumber(t.合格, 0), `${t.合格率}%`, t.事故])
    ];

    autoTable(doc, {
      head: [teamTable[0]],
      body: teamTable.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [82, 196, 26], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 9 }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      doc.text('Confidential - Steel Production Management System', 14, 290);
    }

    doc.save(`Steel_Production_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    alert('✅ 月度报告导出成功！');
  };

  const exportCSV = () => {
    let csv = '月度生产统计报表\n';
    csv += '产线,产量(吨),合格率(%),能耗(kWh/t),OEE(%)\n';
    lineOutput.forEach(l => {
      csv += `${l.name},${l.产量},${l.合格率},${l.能耗},${l.OEE}\n`;
    });
    csv += '\n班组统计\n';
    csv += '班组,产量(吨),合格(吨),合格率(%),事故\n';
    teamData.forEach(t => {
      csv += `${t.name},${t.产量},${t.合格},${t.合格率},${t.事故}\n`;
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `生产统计_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    alert('✅ CSV导出成功！');
  };

  return (
    <div>
      <div className="grid-4 mb-20">
        <div className="stat-card primary">
          <div className="stat-label">期间总产量</div>
          <div className="stat-value">{formatNumber(summaryStats.totalOutput / 1000, 2)}<span className="stat-unit">万吨</span></div>
          <div className="stat-change up">↑ 4.8% 环比</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">综合合格率</div>
          <div className="stat-value">{((summaryStats.totalQualified / summaryStats.totalOutput) * 100).toFixed(2)}<span className="stat-unit">%</span></div>
          <div className="stat-change up">↑ 0.3% 环比</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">平均能耗</div>
          <div className="stat-value">{(summaryStats.totalEnergy / 3).toFixed(1)}<span className="stat-unit">kWh/t</span></div>
          <div className="stat-change down">↓ 2.1% 环比</div>
        </div>
        <div className="stat-card info">
          <div className="stat-label">设备综合效率</div>
          <div className="stat-value">{summaryStats.avgEquipmentUtil}<span className="stat-unit">%</span></div>
          <div className="stat-change up">↑ 1.2% 环比</div>
        </div>
      </div>

      <div className="card mb-20">
        <div className="card-header">
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <select value={period} onChange={e => setPeriod(e.target.value)}>
              <option value="week">本周</option>
              <option value="month">本月</option>
              <option value="quarter">本季度</option>
              <option value="year">本年度</option>
            </select>
            <select value={lineFilter} onChange={e => setLineFilter(e.target.value)}>
              <option value="all">全部产线</option>
              <option value="converter">转炉工段</option>
              <option value="caster">连铸工段</option>
              <option value="rolling">轧制工段</option>
            </select>
          </div>
          <div className="flex gap-8">
            <button className="btn" onClick={() => exportCSV()}>
              📊 导出CSV
            </button>
            <button className="btn btn-primary" onClick={() => exportPDF(period)}>
              📄 导出月度PDF报告
            </button>
          </div>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="产量" stackId="1" stroke="#1890ff" fill="#1890ff" fillOpacity={0.3} />
              <Area yAxisId="left" type="monotone" dataKey="合格" stackId="2" stroke="#52c41a" fill="#52c41a" fillOpacity={0.3} />
              <Line yAxisId="right" type="monotone" dataKey="能耗" stroke="#ff6b35" strokeWidth={2} dot={{ r: 5 }} />
              <Line yAxisId="right" type="monotone" dataKey="设备利用率" stroke="#722ed1" strokeWidth={2} dot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2 mb-20">
        <div className="card">
          <div className="card-header"><span className="card-title">🏭 各产线产量与合格率</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={lineOutput}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" domain={[90, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="产量" fill="#1890ff" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="合格率" stroke="#ff4d4f" strokeWidth={2} dot={{ r: 5, fill: '#ff4d4f' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">🥧 钢种产量分布</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={steelGradeDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, rate }) => `${name} ${rate}`}
                  labelLine={{ stroke: '#999' }}
                >
                  {steelGradeDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatNumber(v, 0) + ' 吨'} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid-2 mb-20">
        <div className="card">
          <div className="card-header"><span className="card-title">👥 班组绩效对比</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={teamData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={50} />
                <Tooltip />
                <Legend />
                <Bar dataKey="产量" fill="#1890ff" stackId="a" />
                <Bar dataKey="合格" fill="#52c41a" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">⚡ 能耗构成</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={energyBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {energyBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid-2 mb-20">
        <div className="card">
          <div className="card-header"><span className="card-title">📊 设备OEE雷达图</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={equipmentRadar}>
                <PolarGrid stroke="#e8e8e8" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="OEE" dataKey="A" stroke="#1890ff" fill="#1890ff" fillOpacity={0.5} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">⚠️ 缺陷类型趋势（周）</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={defectTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="成分超标" stroke="#ff4d4f" strokeWidth={2} />
                <Line type="monotone" dataKey="表面缺陷" stroke="#faad14" strokeWidth={2} />
                <Line type="monotone" dataKey="尺寸偏差" stroke="#1890ff" strokeWidth={2} />
                <Line type="monotone" dataKey="力学性能" stroke="#722ed1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">📋 统计明细 - 班组绩效</span></div>
        <div className="card-body" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>班组</th>
                <th>产量 (吨)</th>
                <th>合格 (吨)</th>
                <th>合格率</th>
                <th>能耗 (万kWh)</th>
                <th>单位能耗 (kWh/t)</th>
                <th>事故数</th>
                <th>综合评分</th>
              </tr>
            </thead>
            <tbody>
              {teamData.map((t, idx) => {
                const score = (t.合格率 - 95) * 15 - t.事故 * 5 + (t.产量 / 50000) * 10;
                return (
                  <tr key={idx}>
                    <td className="font-bold">{t.name}</td>
                    <td className="text-right">{formatNumber(t.产量, 0)}</td>
                    <td className="text-right">{formatNumber(t.合格, 0)}</td>
                    <td>
                      <span style={{ color: t.合格率 >= 97.5 ? '#52c41a' : '#faad14', fontWeight: 600 }}>
                        {t.合格率}%
                      </span>
                    </td>
                    <td className="text-right">{formatNumber(t.能耗, 1)}</td>
                    <td className="text-right">{((t.能耗 * 10000) / t.产量).toFixed(1)}</td>
                    <td>
                      <span className={`tag ${t.事故 === 0 ? 'tag-success' : t.事故 === 1 ? 'tag-warning' : 'tag-danger'}`}>
                        {t.事故} 起
                      </span>
                    </td>
                    <td>
                      <div className="flex-between" style={{ gap: 8 }}>
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${Math.max(50, Math.min(100, score + 60))}%`,
                              background: score >= 90 ? '#52c41a' : score >= 75 ? '#1890ff' : score >= 60 ? '#faad14' : '#ff4d4f'
                            }}
                          />
                        </div>
                        <b style={{ fontSize: 12, minWidth: 30 }}>{Math.floor(score + 60)}分</b>
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
  );
}

export default Statistics;
