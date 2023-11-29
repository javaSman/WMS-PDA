export const formList = [
  {
    type: 'Input',
    label: '条码',
    prop: 'imBarcode'
    // rules: [{ required: true, message: '请输入条码', trigger: 'onBlur' }]
  },
  { type: 'Text', label: '产品编号', prop: 'material' },
  { type: 'Text', label: '产品名称', prop: 'materialText' },
  { type: 'Text', label: '生产批', prop: 'batch' }
]
export const showFormList = [
  { label: '订单数量', prop: 'targetQuantity', type: 'Text' },
  // 以下四个，没取值
  { label: '已报数量', prop: 'targetQuantity', type: 'Text' },
  { label: '未收货数', prop: 'targetQuantity', type: 'Text' },
  { label: '未入库数', prop: 'targetQuantity', type: 'Text' },
  { label: '已收货数', prop: 'targetQuantity', type: 'Text' }
]
export const tableColumn = [
  { label: '行号', prop: 'index' },
  { label: '组件编号', prop: 'material', formatter: (data) => formatMaterial(data) },
  { label: '组件描述', prop: 'materialDescription' },
  { label: '条码', prop: 'barcode' },
  { label: '工位', prop: 'workp' },
  { label: '需求数量', prop: 'entryQuantity' },
  { label: '领料数量', prop: 'withdrawnQuantity' },
  { label: '单位', prop: 'baseUom' }
]

export function formatMaterial(data) {
  return data.material.replace(/^0+/gi, '')
}
