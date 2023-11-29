import { MOVE_TYPE, formatLgortConnector, formatLgottConnector, formatEbeln, formatMaterial, formatAufnr } from '@/views/dict'

let minDate = Date.now() - 1000 * 3600 * 24 * 30 * 6
export const formList = [
  {
    type: 'Calendar',
    label: '过账日期',
    prop: 'imPostdate',
    calendarParams: { minDate: new Date(minDate) },
    rules: [{ required: true, message: '请选择过账日期', trigger: 'onChange' }]
  },
  {
    type: 'Dropdown',
    label: '移动类型',
    prop: 'imMovetype',
    options: MOVE_TYPE,
    rules: [{ required: true, message: '请选择移动类型', trigger: 'onChange' }]
  }
]

export const tableColumn = [
  { label: '订单行', prop: 'zeile' },
  { label: '物料凭证', prop: 'mblnr' },
  { label: '物料编号', prop: 'matnr', formatter: (data) => formatMaterial(data) },
  { label: '物料描述', prop: 'maktx', type: 'Table/Notice' },
  { label: '数量', prop: 'erfmg' },
  { label: '来源库位', prop: 'lgott', formatter: formatLgottConnector },
  { label: '目标库位', prop: 'lgort', formatter: formatLgortConnector },
  { label: '生产订单', prop: 'aufnr', formatter: formatAufnr },
  { label: '采购订单', prop: 'ebeln', formatter: formatEbeln },
  { label: '成本中心', prop: 'aufnr' },
  { label: '单号', prop: 'ebeln' },
  { label: '过账时间', prop: 'cputm', formatter: formatCputm }
]
// cpudt cputm
function formatCputm(data, val) {
  let { cpudt, cputm } = data
  if (!cpudt || !cputm) return
  let ymd = cpudt.split(' ')[0]
  let hms = cputm.split(' ')[1]
  return ymd + ' ' + hms
}
