import {formatMaterial, formatAufnr, formatProdbatch} from '@/views/dict'
export const formList = [
  {
    type: 'Dropdown',
    label: '仓库',
    prop: 'warehouseNo',
    options: [],
    optProps: { label: 'warehouseNo', value: 'warehouseNo' },
    rules: [{ required: true, message: '请选择仓库', trigger: 'onChange' }]
  },
  {
    type: 'Input',
    label: '箱子号',
    prop: 'wmsTools',
    rules: [{ required: true, message: '请输入箱子号' }]
  },
  {
    type: 'Input',
    label: '区域',
    prop: 'locationId'
  },
  {
    type: 'Input',
    label: '条码',
    prop: 'imBarcode'
  }
]
export const showFormList = [
  { label: '入库单号', prop: 'reqno', type: 'Text' },
  { label: '过账日期', prop: 'postDate', type: 'Calendar' }
]
export const tableColumn = [
  { label: '工厂库位', prop: 'werks', type: 'Table/CheckBox' },
  { label: '生产订单', prop: 'aufnr', formatter: formatAufnr },
  { label: '入库原因', prop: 'grund', formatter: (data, val) => formatInVentoryReason(data, val) },
  { label: '物料编号', prop: 'matnr', formatter: (data) => formatMaterial(data) },
  { label: '物料描述', prop: 'maktx', type: 'Table/Notice' },
  { label: '退料人', prop: 'operator' },
  { label: '入库数量', prop: 'erfmg', type: 'Table/Number' },
  { label: '批次号码', prop: 'charg', type: 'Table/Input' },
  { label: '生产批', prop: 'prodbatct', formatter: formatProdbatch },
  { label: 'ECN号', prop: 'legln' },
  { label: '工位', prop: 'workp' }
]
// 【目标库位】数据格式化：工厂 | 库位
function formatInVentoryReason(data, val) {
  return `${data.grund} | ${data.grtxt}`
}

// 【目标库位】数据格式化：工厂 | 库位
export function formatLgort(data, val) {
  return `${data.werks} | ${data.lgort}`
}
// 【生产批次/工位】数据格式化：生产批次 / 工位
export function formatCharg(data, val) {
  return `${data.charg} / ${data.workp}`
}
// 【收货数量】数据格式化：收货数量 * 1 = 收货数量
export function formatErfmg(data, val) {
  return `${val}  × 1 = ${Number(val)}`
}
