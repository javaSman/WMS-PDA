import { formatLgort, formatMaterial, formatAufnr, formatProdbatch } from '@/views/dict'
export const formList = [
  {
    type: 'Dropdown',
    label: '仓库',
    prop: 'warehouseNo',
    options: [],
    optProps: { label: 'warehouseNo', value: 'warehouseNo' },
    rules: [{ required: true, message: '请选择仓库', trigger: 'onChange' }]
  },
  { type: 'Input', label: '箱子号', prop: 'boxID', rules: [{ required: true, message: '请输入箱子号', trigger: 'onBlur' }] },
  { type: 'Input', label: '条码', prop: 'imBarcode' }
]
export const showFormList = [{ label: '过账日期', prop: 'postDate', type: 'Calendar' }]
export const tableColumn = [
  { label: '条码', prop: 'objnr', type: 'Table/CheckBox' },
  { label: '工厂库位', prop: 'werks', formatter: (data) => formatLgort(data) },
  { label: '物料编号', prop: 'matnr', formatter: (data) => formatMaterial(data) },
  { label: '物料描述', prop: 'maktx', type: 'Table/Notice' },
  { label: '生产订单', prop: 'aufnr', formatter: formatAufnr },
  { label: '领料数量', prop: 'erfmg'},
  { label: '生产批', prop: 'prodbatch', formatter: formatProdbatch },
  { label: 'ECN号', prop: 'ngeln' },
  { label: '领料人', prop: 'operator' }
]
