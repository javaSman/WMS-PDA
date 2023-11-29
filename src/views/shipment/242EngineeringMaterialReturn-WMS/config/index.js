import { formatLgort, formatMaterial, formatWorkCenter } from '@/views/dict'
export const formList = [
  {
    type: 'Dropdown',
    label: '仓库',
    prop: 'warehouseNo',
    options: [],
    optProps: { label: 'warehouseNo', value: 'warehouseNo' }
    // rules: [{ required: true, message: '请选择仓库', trigger: 'onChange' }]
  },
  {
    type: 'Input',
    label: '领料单号',
    prop: 'imBarcode'
    // rules: [{ required: true, message: '请输入领料单号', trigger: 'onBlur' }]
  }
]
export const showFormList = [
  { label: '退料单号', prop: 'reqno', type: 'Text' },
  { label: '过账日期', prop: 'postDate', type: 'Calendar' }
]
export const tableColumn = [
  { label: '工厂库位', prop: 'werks', formatter: (data) => formatLgort(data), type: 'Table/CheckBox' },
  { label: '箱子号', prop: 'wmsTools', type: 'Table/Input', rules: [{ require: true, message: '箱子号不能为空', trigger: 'onChange' }] },
  { label: '区域', prop: 'locationId', type: 'Table/Input', rules: [{ require: true, message: '区域不能为空', trigger: 'onChange' }] },
  { label: '成本中心', prop: 'kostl', formatter: (data) => formatWorkCenter(data) },
  { label: '物料编号', prop: 'matnr', formatter: (data) => formatMaterial(data) },
  { label: '物料描述', prop: 'maktx', type: 'Table/Notice' },
  { label: '退料数量', prop: 'erfmg' },
  { label: '批次号', prop: 'charg' },
  { label: '备注', prop: 'retext' },
  { label: '领料人', prop: 'operator' }
]
