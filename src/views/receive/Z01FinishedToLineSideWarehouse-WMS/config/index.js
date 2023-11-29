import { formatMaterial } from '@/views/dict'
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
  { type: 'Input', label: '区域', prop: 'locationID', rules: [{ required: true, message: '请输入区域', trigger: 'onBlur' }] },
  { type: 'Input', label: '条码', prop: 'imBarcode' },
  {
    type: 'Calendar',
    label: '过账日期',
    prop: 'postDate',
    rules: [{ required: true, message: '请选择过账日期', trigger: 'onChange' }]
  }
]
export const tableColumn = [
  { label: '行号', prop: 'objnr', type: 'Table/CheckBox' },
  { label: '工厂', prop: 'werks' },
  { label: '工单号', prop: 'aufnr' },
  { label: '物料编号', prop: 'matnr', formatter: formatMaterial },
  { label: '物料描述', prop: 'txz01', type: 'Table/Notice' },
  { label: '单位', prop: 'erfme' },
  { label: '数量', prop: 'erfmg', type: 'Table/NumberInput' },
  { label: '条码数量', prop: '_erfmg' }
]
