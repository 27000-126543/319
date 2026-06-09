import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import { formatDateTime, formatNumber, getQualityResultLabel, getQualityResultColor, todayStr } from '../utils/format.js';

const demoInspections = [
  { id: 1, heat_no: 'H240609001', inspector: '钱质检', stage: '吹炼终检', result: '合格', parameters: '碳0.18%/磷0.015%/硫0.012%', defects: '', inspection_time: '2024-06-09 09:32', remarks: '' },
  { id: 2, heat_no: 'H240609002', inspector: '钱质检', stage: '吹炼终检', result: '不合格', parameters: '碳0.22% (超标)/磷0.018%', defects: '碳含量超标', inspection_time: '2024-06-09 09:48', remarks: '需回炉重新调配', rework_required: 1 },
  { id: 3, heat_no: 'H240609001', inspector: '钱质检', stage: '精炼后', result: '合格', parameters: '温度1608℃/氢1.8ppm', defects: '', inspection_time: '2024-06-09 10:52', remarks: '' },
  { id: 4, heat_no: 'H240609003', inspector: '孙质检', stage: '吹炼终检', result: '合格', parameters: '碳0.14%/温度1652℃', defects: '', inspection_time: '2024-06-09 11:18', remarks: '' },
  { id: 5, heat_no: 'H240609002', inspector: '钱质检', stage: '连铸中', result: '让步接收', parameters: '中心偏析1.5级', defects: '轻微中心偏析', inspection_time: '2024-06-09 12:30', remarks: '降级使用' },
  { id: 6, heat_no: 'H240609001', inspector: '孙质检', stage: '热轧后', result: '合格', parameters: '终轧880℃/卷取620℃', defects: '', inspection_time: '2024-06-09 16:25', remarks: '' },
  { id: 7, heat_no: 'H240608015', inspector: '钱质检', stage: '成品检验', result: '合格', parameters: '力学性能达标/表面合格', defects: '', inspection_time: '2024-06-08 18:10', remarks: '' },
  { id: 8, heat_no: 'H240608012', inspector: '钱质检', stage: '成品检验', result: '不合格', parameters: '屈服强度偏低', defects: '力学性能不达标', inspection_time: '2024-06-08 17:20', remarks: '回炉处理', rework_required: 1 }
];

const qualityTrend = [
  { date: '06-03', 合格: 96.5, 不合格: 2.5, 让步: 1.0, 总量: 2850 },
  { date: '06-04', 合格: 97.8, 不合格: 1.5, 让步: 0.7, 总量: 2920 },
  { date: '06-05', 合格: 96.0, 不合格: 3.2, 让步: 0.8, 总量: 2780 },
  { date: '06-06', 合格: 98.2, 不合格: 1.2, 让步: 0.6, 总量: 3010 },
  { date: '06-07', 合格: 97.5, 不合格: 1.8, 让步: 0.7, 总量: 2980 },
  { date: '06-08', 合格: 97.2, 不合格: 2.1, 让步: 0.7, 总量: 3050 },
  { date: '06-09', 合格: 96.8, 不合格: 2.5, 让步: 0.7, 总量: 2680 }
];

const defectsDist = [
  { name: '成分超标', value: 35, level: 1 },
  { name: '表面缺陷', value: 28, level: 2 },
  { name: '尺寸偏差', value: 18, level: 3 },
  { name: '力学性能', value: 12, level: 4 },
  { name: '中心偏析', value: 15, level: 5 },
  { name: '裂纹', value: 8, level: 6 },
  { name: '夹杂', value: 10, level: 7 }
];

const gradeQuality = [
  { grade: 'Q235B', q: 98.2, total: 3500, defects: 63 },
  { grade: 'DC01', q: 96.5, total: 2800, defects: 98 },
  { grade: 'SPHC', q: 97.8, total: 2200, defects: 48 },
  { grade: 'HC340LA', q: 94.2, total: 1200, defects: 70 },
  { grade: 'AH32', q: 97.0, total: 1500, defects: 45 }
];

function Quality({ user }) {
  const [list, setList] = useState(demoInspections);
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [showTrace, setShowTrace] = useState(null);

  const filtered = list.filter(r => {
    if (resultFilter && r.result !== resultFilter) return false;
    if (stageFilter && r.stage !== stageFilter) return false;
    if (search && !r.heat_no.includes(search)) return false;
    return true;
  });

  const passRate = list.length > 0 ? ((list.filter(r => r.result === '合格').length / list.length) * 100).toFixed(1) : '0.0';
  const defectCount = list.filter(r => r.result === '不合格').length;
  const reworkCount = list.filter(r => r.rework_required).length;
  const todayCount = list.filter(r => r.inspection_time && r.inspection_time.startsWith(todayStr().replace(/-/g, '06-09'))).length;

  const handleResult = (id, newResult) => {
    if (!confirm(`确定将此记录设为【${newResult}】？`)) return;
    setList(list.map(r => r.id === id ? { ...r, result: newResult } : r));
  };

  const handleRework = (id) => {
    if (!confirm('确定将此炉次标记为回炉处理？')) return;
    setList(list.map(r => r.id === id ? { ...r, rework_required: 1, result: '不合格' } : r));
    alert('✅ 已推送回炉处理，系统将：\n1. 扣减相应库存\n2. 生成回炉任务\n3. 通知转炉工段');
  };

  return (
    <div>
      <div className="grid-4 mb-20">
        <div className="stat-card success">
          <div className="stat-label">质检合格率</div>
          <div className="stat-value">{passRate}<span className="stat-unit">%</span></div>
          <div className="stat-change up">↑ 0.3% 周环比</div>
        </div>
        <div className="stat-card primary">
          <div className="stat-label">今日质检</div>
          <div className="stat-value">{todayCount}<span className="stat-unit">次</span></div>
        </div>
        <div className="stat-card danger">
          <div className="stat-label">不合格数</div>
          <div className="stat-value">{defectCount}<span className="stat-unit">项</span></div>
          <div className="stat-change down">{reworkCount} 项需回炉</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">缺陷工单</div>
          <div className="stat-value">{reworkCount + 2}<span className="stat-unit">单</span></div>
          <div className="stat-change" style={{ color: '#999' }}>处理中 3 单</div>
        </div>
      </div>

      <div className="grid-2 mb-20">
        <div className="card">
          <div className="card-header"><span className="card-title">📈 近7天质量趋势</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={qualityTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="合格" stackId="a" fill="#52c41a" />
                <Bar dataKey="让步" stackId="a" fill="#faad14" />
                <Bar dataKey="不合格" stackId="a" fill="#ff4d4f" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">🔍 缺陷类型分布</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={defectsDist} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#ff6b35" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card mb-20">
        <div className="card-header"><span className="card-title">🏷️ 各钢种合格率对比</span></div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="q" name="合格率" unit="%" tick={{ fontSize: 12 }} domain={[90, 100]} />
              <YAxis dataKey="total" name="产量" unit="吨" tick={{ fontSize: 12 }} />
              <ZAxis dataKey="defects" range={[50, 400]} name="缺陷数" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={gradeQuality} fill="#1890ff">
                {gradeQuality.map((entry, index) => (
                  <label key={`label-${index}`} value={entry.grade} position="top" />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <div className="search-box">
              <span>🔍</span>
              <input placeholder="搜索炉次号..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select value={resultFilter} onChange={e => setResultFilter(e.target.value)}>
              <option value="">全部结果</option>
              <option>合格</option>
              <option>不合格</option>
              <option>让步接收</option>
              <option>待检</option>
            </select>
            <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
              <option value="">全部工序</option>
              <option>吹炼终检</option>
              <option>精炼后</option>
              <option>连铸中</option>
              <option>热轧后</option>
              <option>冷轧后</option>
              <option>成品检验</option>
            </select>
          </div>
          <div>
            {user.role === 'inspector' && (
              <button className="btn btn-primary">➕ 录入质检</button>
            )}
            <button className="btn">📄 导出报告</button>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>检验编号</th>
                  <th>炉次号</th>
                  <th>工序</th>
                  <th>检验参数</th>
                  <th>缺陷</th>
                  <th>结果</th>
                  <th>质检员</th>
                  <th>时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} style={{
                    background: item.result === '不合格' ? '#fff1f0' :
                      item.result === '让步接收' ? '#fffbe6' : 'transparent'
                  }}>
                    <td style={{ fontFamily: 'monospace' }}>QC{item.id.toString().padStart(6, '0')}</td>
                    <td style={{ fontWeight: 600 }}>{item.heat_no}</td>
                    <td><span className="tag tag-info">{item.stage}</span></td>
                    <td style={{ fontSize: 12, color: '#666', maxWidth: 220 }}>{item.parameters}</td>
                    <td style={{ color: item.defects ? '#ff4d4f' : '#999', fontSize: 12 }}>
                      {item.defects || '-'}
                    </td>
                    <td>
                      <span className={`tag tag-${getQualityResultColor(item.result)}`}>
                        {getQualityResultLabel(item.result)}
                      </span>
                      {item.rework_required && <span className="tag tag-danger" style={{ marginLeft: 6 }}>回炉</span>}
                    </td>
                    <td>{item.inspector}</td>
                    <td style={{ fontSize: 12 }}>{formatDateTime(item.inspection_time)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-sm" onClick={() => setShowTrace(item.heat_no)}>
                          🔗 追溯
                        </button>
                        {user.role === 'inspector' && item.result === '待检' && (
                          <>
                            <button className="btn btn-sm btn-success" onClick={() => handleResult(item.id, '合格')}>
                              合格
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleResult(item.id, '不合格')}>
                              不合格
                            </button>
                          </>
                        )}
                        {item.result === '不合格' && !item.rework_required && (
                          <button className="btn btn-sm btn-warning" onClick={() => handleRework(item.id)}>
                            🔄 回炉
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showTrace && (
        <div className="modal-overlay" onClick={() => setShowTrace(null)}>
          <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
              🔗 质量全链路追溯 - 炉次 {showTrace}
              </div>
              <button className="modal-close" onClick={() => setShowTrace(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info mb-16">
                <span>📖</span>
                <div>追溯说明：从原料投入到成品出厂，全流程共 <b>47个</b> 数据节点，支持向前追溯至矿石批次，向后追溯至客户订单交付。</div>
              </div>

              <div className="timeline mb-20">
                {[
                  { stage: '原料投入', time: '06-09 07:30', items: ['铁矿石: 580kg (批次 IR-2406-342)', '废钢: 320kg (批次 SC-2406-128)', '焦炭: 95kg (批次 CK-2406-076)'], status: 'success' },
                  { stage: '转炉吹炼', time: '06-09 08:05', items: ['供氧: 16min 4800m³', '温度: 1645℃', '终点成分合格'], status: 'success' },
                  { stage: 'LF精炼', time: '06-09 09:50', items: ['加热: 18min 温度1608℃', '合金: MnFe 180kg/SiFe 85kg', '氩气搅拌: 12min'], status: 'success' },
                  { stage: '连铸', time: '06-09 11:10', items: ['中间包温度: 1542℃', '拉速: 1.2m/min', '铸坯规格: 220×1540mm'], status: 'warning', defect: '轻微表面振痕' },
                  { stage: '加热炉', time: '06-09 13:40', items: ['入炉温度: 常温', '加热温度: 1220℃', '在炉时间: 110min'], status: 'success' },
                  { stage: '热轧', time: '06-09 14:00', items: ['开轧温度: 1080℃', '终轧温度: 880℃', '卷取温度: 620℃', '规格: 3.0×1500mm'], status: 'success' },
                  { stage: '成品检验', time: '06-09 16:25', items: ['力学性能: 合格', '表面质量: 合格', '尺寸精度: 合格'], status: 'success' },
                  { stage: '入库', time: '06-09 17:00', items: ['库位: A区-12排', '数量: 116.8吨', '关联订单: SO-2024-0002'], status: 'success' }
                ].map((item, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className={`timeline-dot ${item.status}`}>
                      {idx + 1}
                    </div>
                    <div className="timeline-content">
                      <div className="flex-between">
                        <span className="timeline-title font-bold">{item.stage}</span>
                        <span className="timeline-time">{item.time}</span>
                      </div>
                      {items.map((it, i) => (
                        <div key={i} className="timeline-desc" style={{ fontSize: 12 }}>• {it}</div>
                      ))}
                      {item.defect && (
                        <div className="alert alert-warning mt-8" style={{ padding: '6px 10px', fontSize: 12 }}>
                          ⚠️ 异常记录：{item.defect}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Quality;
