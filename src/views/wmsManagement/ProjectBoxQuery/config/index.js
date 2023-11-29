export const formList = [
  { type: 'Input', label: '物料编号', prop: 'materialNo' },
  { type: 'Input', label: '项目-生产批', prop: 'projectBatch' },
  { type: 'Input', label: '工位号', prop: 'stationNo' }
]
export const tableColumn = [
  { label: '行号', prop: 'index' },
  { label: '区域', prop: 'areaNo' },
  { label: '储位类型', prop: 'localType' },
  { label: '货位编码', prop: 'locationNo' },
  { label: '箱子编号', prop: 'boxNo', type: 'Table/RightBtn', tableBtnParams: { btnText: '明细', loading: [] } }
]
export const detailsTableColumn = [
  { label: '行号', prop: 'index' },
  { label: '物料编号', prop: 'materialNo' },
  { label: '物料描述', prop: 'materialDesc' },
  { label: '生产批/工位', prop: 'batchStation', formatter: formatChargWMS },
  { label: '数量', prop: 'quantity' },
  { label: '区域', prop: 'areaNo' }
]

/**
 * 格式化生产批/工位
 * @param data 整条数据
 * @returns 生产批 / 工位
 */
export function formatChargWMS(data) {
  if (!data.batch && !data.stationNo) return ''
  return `${data.batch || ''} / ${data.stationNo || ''}`
}
