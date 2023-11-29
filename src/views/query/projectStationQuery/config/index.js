import { formatMaterial } from '@/views/dict'
export const formList = [
  {
    type: 'Input',
    label: '条码',
    prop: 'barcode',
    rules: [{ required: true, message: '请输入条码', trigger: 'onBlur' }]
  },
  {
    type: 'Text',
    label: '项目生产工位',
    prop: 'projectNum'
  }
]
export const showFormList = []
export const tableColumn = [
  { label: '物料编号', prop: 'idnrk', formatter: (data) => formatMaterial(data) },
  { label: '物料描述', prop: 'maktx', type: 'Table/Notice' }
]
