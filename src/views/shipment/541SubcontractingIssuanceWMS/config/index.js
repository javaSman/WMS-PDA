import {formatMaterial} from '@/views/dict'
export const formList = [
  {
    type: 'Input',
    label: '领料单号',
    prop: 'imBarcode'
    // rules: [{ required: true, message: '请输入领料单号', trigger: 'onBlur' }]
  }
]
export const showFormList = [
  { label: '卡板/箱子号', prop: 'delivnum', type: 'Text' },
  { label: '过账日期', prop: 'postDate', type: 'Calendar' }
]
export const tableColumn = [
  { label: '条码', prop: 'barcode', type: 'Table/CheckBox' },
  { label: '箱子号', prop: 'wmsTools', type: 'CustomSlot', slot: 'wmsTools' },
  { label: '区域', prop: 'locationId', type: 'CustomSlot', slot: 'locationId' },
  { label: '工厂库位', prop: 'werks', formatter: (data, val) => formatLgort(data, val) },
  { label: '成本中心', prop: 'kostl', formatter: (data, val) => formatWorkCenter(data, val) },
  { label: '物料编号', prop: 'matnr', formatter: (data) => formatMaterial(data)},
  { label: '物料描述', prop: 'maktx', type: 'Table/Notice' },
  { label: '发料数量', prop: 'erfmg', type: 'Table/Number', multiple: 1 },
  { label: '领料人', prop: 'operator' }
]

//  【成本中心】数据格式化
export function formatWorkCenter(data, val) {
  return `${data.kostl} | ${data.ktext}`
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
