export const formList = [
  { type: 'Input', label: '箱子号', prop: 'wmsTools' },
  { type: 'Input', label: '货位', prop: 'locationNo' },
  { type: 'Input', label: '条码', prop: 'imBarcode' }
]
export const tableColumn = [
  { label: '箱号', prop: 'wmS_TOOLS', type: 'Table/CheckBox' },
  { label: '物料编号', prop: 'materialCode' },
  { label: '物料描述', prop: 'namE1', type: 'Table/Notice' },
  { label: '生产批', prop: 'batch' },
  { label: '工位', prop: 'workp' },
  { label: '已拣数量', prop: 'checkqty' },
  { label: '实际数量', prop: 'erfmg', type: 'Table/NumberInput' },
  { label: '仓位', prop: 'lgort' }
  // { label: '物料状态', prop: 'x2' },
  // { label: '物料位置', prop: 'x3' }
]
