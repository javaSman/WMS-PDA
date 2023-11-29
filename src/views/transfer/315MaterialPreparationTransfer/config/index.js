import { formatProdbatch, formatErfmg, formatMaterial, formatAufnr } from '@/views/dict'
export const formList = [
  {
    type: 'Input',
    label: '条码',
    prop: 'imBarcode'
    // rules: [{ required: true, message: '请输入条码', trigger: 'onBlur' }]
  }
]
export const showFormList = [
  { label: '过账日期', prop: 'postDate', type: 'Calendar' }
]
export const tableColumn = [
  { label: '条码', prop: 'objnr', type: 'Table/CheckBox' },
  { label: '工厂库位', prop: 'lgort', formatter: formatLgort },
  { label: '物料编号', prop: 'matnr', formatter: formatMaterial },
  { label: '物料描述', prop: 'maktx', type: 'Table/Notice' },
  { label: '生产订单', prop: 'aufnr', formatter: formatAufnr },
  { label: '领料数量', prop: 'erfmg', formatter: formatErfmg },
  { label: '生产批', prop: 'prodbatch', formatter: formatProdbatch },
  { label: 'ECN号', prop: 'ngeln' }
]

// 【工厂库位】数据格式化：工厂-库位 | 行号
export function formatLgort(data, val) {
  return `${data.werks}-${data.lgort} | ${data.rspos}`
}
