import { formatProdbatch, formatErfmg, formatMaterial } from '@/views/dict'

export const formList = [
  { type: 'Input', label: '条码', prop: 'imBarcode'},
  { type: 'Text', label: '入库单号', prop: 'inventroyNumber'}
]
export const showFormList = [
  { label: '过账日期', prop: 'postDate', type: 'Calendar' }
]
export const tableColumn = [
  { label: '工位', prop: 'workp', type: 'Table/CheckBox' },
  { label: '生产订单', prop: 'aufnr', formatter: (data) => data.aufnr.replace(/^0+/gi, '') },
  { label: '机加条码', prop: 'barcode'},
  { label: '库位', prop: 'lgort' },
  { label: '组件', prop: 'sjpno', formatter: formatMaterial},
  { label: '名称', prop: 'namE1', type: 'Table/Notice' },
  { label: '入库数量', prop: 'erfmg', type: 'Table/NumberInput', formatter: formatErfmg },
  { label: '生产批', prop: 'prodbatch', formatter: formatProdbatch }
]
