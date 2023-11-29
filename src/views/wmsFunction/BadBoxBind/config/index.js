export const formList = [
  {
    type: 'Input',
    label: '箱子号',
    prop: 'wmsTools'
  },
  { type: 'Input', label: '条码', prop: 'imBarcode' }
]
export const showFormList = [{ label: '过账日期', prop: 'postDate', type: 'Calendar' }]
export const tableColumn = [
  { label: '物料编号', prop: 'matnr', type: 'Table/CheckBox', formatter: (data) => data.matnr.replace(/^0+/gi, '') },
  { label: '物料描述', prop: 'txz01', type: 'Table/Notice' },
  { label: '数量', prop: 'scrqty' }
]
