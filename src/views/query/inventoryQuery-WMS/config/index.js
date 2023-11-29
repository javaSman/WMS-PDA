export const formList = [
  { type: 'Input', label: '条码', prop: 'barcode' },
  { type: 'Input', label: '物料编号', prop: 'matnr' },
  {
    type: 'Dropdown',
    label: '工厂库位',
    prop: 'lgort',
    options: []
  }
]

export const tableColumn = [
  { label: '箱子号', prop: 'boxNo' },
  { label: '区域', prop: 'locationNo' },
  { label: '物料编号', prop: 'materialNo'},
  { label: '物料描述', prop: 'materialDesc'},
  { label: '库存数', prop: 'quantity'}
]
