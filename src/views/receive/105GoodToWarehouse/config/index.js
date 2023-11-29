import { formatCharg, formatLgortConnector, formatMaterial } from '@/views/dict'

export const formList = [
  {
    type: 'Input',
    label: '条码',
    prop: 'imBarcode'
    // rules: [{ required: true, message: '请输入条码', trigger: 'onBlur' }]
  }
]
export const showFormList = [
  { label: '送货条码', prop: 'delivnum', type: 'Text' },
  { label: '送货单号', prop: 'sgtxt4', type: 'Text' },
  { label: '凭证号码', prop: 'mblnr', type: 'Text' },
  { label: '供应商', prop: 'lifnr', type: 'Text' },
  { label: '采购订单', prop: 'ebeln', type: 'Text' },
  { label: '过账日期', prop: 'postDate', type: 'Calendar' }
]
export const tableColumn = [
  { label: '订单行', prop: 'rspos', type: 'Table/CheckBox' },
  { label: '条码', prop: 'objnr' },
  { label: '采购订单', prop: 'ebelp', formatter: formatEbeln },
  { label: '目标库位', prop: 'lgort', formatter: formatLgortConnector },
  { label: '物料编号', prop: 'matnr', formatter: (data) => formatMaterial(data) },
  { label: '物料描述', prop: 'txz01', type: 'Table/Notice' },
  { label: '生产批/工位', prop: 'charg', formatter: formatCharg },
  { label: '良品数量', prop: 'qcqty' },
  { label: '特采数量', prop: 'tcqty' }
]

export function formatEbeln(data, val) {
  return `${data.ebeln || ''}-${Number(data.ebelp) || ''}`
}
