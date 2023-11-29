// import { formatProdbatch, formatErfmg, formatMaterial } from '@/views/dict'

export const formList = [
  { type: 'Input', label: '卡板/箱号', prop: 'wmsTools' },
  { type: 'Input', label: '目标载具', prop: 'targetBoxID', rules: [{ required: true, message: '请输入目标载具', trigger: 'onBlur' }] },
  { type: 'Input', label: '目标区域', prop: 'targetLocation', rules: [{ required: true, message: '请输入目标区域', trigger: 'onBlur' }] },
  { type: 'Input', label: '总单号', prop: 'imBarcode' }
]
export const showFormList = [{ label: '过账日期', prop: 'postDate', type: 'Calendar' }]
export const tableColumn = [
  { label: '条码', prop: 'barcode', type: 'Table/CheckBox' },
  { label: '物料编号', prop: 'materialNo' },
  { label: '物料描述', prop: 'materialDesc', type: 'Table/Notice' },
  { label: '项目', prop: 'projectNo' },
  { label: '工位', prop: 'stationNo' },
  { label: '批次', prop: 'batch' },
  { label: '数量', prop: 'quantity' },
  { label: '工厂库位', prop: 'lgort' },
  { label: '领料人', prop: 'operator' }
]

// 【工厂库位】数据格式化：工厂-库位 | 行号
export function formatLgort(data) {
  return `${data.werks}-${data.lgort} | ${data.rspos}`
}
