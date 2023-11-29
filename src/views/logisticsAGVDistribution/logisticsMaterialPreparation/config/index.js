import { formatErfmg, formatMatnr } from '@/views/dict'
export const formList = [
  { type: 'Input', label: '领料单', prop: 'picking', rules: [{ required: true, message: '请输入领料单', trigger: 'onBlur' }] }
]
export const showFormList = [
  { label: '单号', prop: 'reqno', type: 'Text' },
  { label: '过账日期', prop: 'postDate', type: 'Calendar' }
]
export const tableColumn = [
  { label: '工厂库位', prop: 'lgort', formatter: formatLgort, type: 'Table/CheckBox' },
  { label: '条码', prop: 'barcode' },
  { label: '成本中心', prop: 'kostl', formatter: (data) => formatWorkCenter(data) },
  { label: '物料编号', prop: 'matnr', formatter: formatMatnr },
  { label: '物料描述', prop: 'maktx', type: 'Table/Notice' },
  { label: '领料数量', prop: 'erfmg', formatter: formatErfmg },
  { label: '制单人', prop: 'Operator' },
  { label: '备注', prop: 'retext' },
  // { label: '箱子号', prop: 'wmsTools', type: 'CustomSlot', slot: 'wmsTools' },
  // { label: '区域', prop: 'locationId', type: 'CustomSlot', slot: 'locationId' },
  { label: '配送地点', prop: 'location' }
  // { label: '箱子号', prop: 'boxID', type: 'Table/Input', rules: [{ required: true, message: '请输入/扫码箱子号', trigger: 'onBlur' }] },
  // { label: '区域', prop: 'areaID', type: 'Table/Input', rules: [{ required: true, message: '请输入/扫码区域', trigger: 'onBlur' }] }
]

//  【成本中心】数据格式化
export function formatWorkCenter(data) {
  return `${data.kostl} | ${data.ktext}`
}

// 【工厂库位】数据格式化：工厂-库位 | 行号
export function formatLgort(data) {
  return `${data.werks}-${data.lgort} | ${data.rspos}`
}

