import { formatMaterial } from '@/views/dict'

export const formList = [
  {
    type: 'Input',
    label: '领料单号',
    prop: 'imBarcode'
  }
]
export const showFormList = [
  { label: '卡板/箱子号', prop: 'wmsTools', type: 'Text' },
  { label: '送货单号', prop: 'delivnum', type: 'Text' },
  { label: '供应商', prop: 'lifnr', type: 'Text' },
  { label: '过账日期', prop: 'postDate', type: 'Calendar' }
]
export const tableColumn = [
  { label: '采购订单', prop: 'ebeln', type: 'Table/CheckBox' },
  { label: '工厂库位', prop: 'werks', formatter: (data, val) => formatLgort(data, val) },
  { label: '物料编号', prop: 'matnr', formatter: (data, val) => formatMaterial(data, val)},
  { label: '物料描述', prop: 'maktx', type: 'Table/Notice' },
  { label: '发料数量', prop: 'erfmg', type: 'Table/Number', multiple: 1 },
  { label: '领料人', prop: 'operator' }
]
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
