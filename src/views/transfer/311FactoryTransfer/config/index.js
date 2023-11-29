export const formList = [
  // {
  //   type: 'Input',
  //   label: '卡板/箱子号',
  //   prop: 'wmsTools'
  // },
  {
    type: 'Input',
    label: '条码',
    prop: 'imBarcode'
  },
  {
    type: 'Text',
    label: '来源库位',
    prop: 'receiveWharehouse'
  },
  {
    type: 'Dropdown',
    label: '目标库位',
    prop: 'targetWharehouse',
    options: []
  },
  {
    type: 'Input',
    label: '转移数量',
    prop: 'qty'
  },
  {
    type: 'Text',
    label: '物料编号',
    prop: 'matnr'
  },
  {
    type: 'Text',
    label: '物料描述',
    prop: 'maktx'
  }
]
export const showFormList = [
  { label: '过账日期', prop: 'postDate', type: 'Calendar' }
]
