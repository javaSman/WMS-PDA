import {formatMaterial, formatAufnr, formatProdbatch} from '@/views/dict'
export const formList = [
  {
    type: 'Input',
    label: '条码',
    prop: 'imBarcode'
  }
]
export const showFormList = [
  { label: '退货单号', prop: 'reqno', type: 'Text' },
  { label: '过账日期', prop: 'postDate', type: 'Calendar' }
]
export const tableColumn = [
  { label: '条码', prop: 'barcode', type: 'Table/CheckBox' },
  { label: '工厂库位', prop: 'werks', formatter: (data, val) => formatLgort(data, val) },
  { label: '退料原因', prop: 'grund', formatter: (data, val) => formatReturnReason(data, val) },
  { label: '生产订单', prop: 'aufnr', formatter: formatAufnr},
  { label: '物料编号', prop: 'matnr', formatter: (data) => formatMaterial(data)},
  { label: '物料描述', prop: 'maktx', type: 'Table/Notice' },
  { label: '退料数量', prop: 'erfmg' },
  { label: 'ECN号', prop: 'ngeln' },
  { label: '批次号', prop: 'charg' },
  { label: '生产批', prop: 'prodbatct', formatter: formatProdbatch },
  { label: '退料人', prop: 'operator' }
]

//  【退料原因】数据格式化
export function formatReturnReason(data, val) {
  return `${data.grund} | ${data.retext}`
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
