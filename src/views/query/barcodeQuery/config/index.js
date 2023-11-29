import { formatMaterial } from '@/views/dict'
export const tableColumn = [
  { label: '条码', prop: 'objnr' },
  { label: '来源工厂', prop: 'werks' },
  { label: '来源库位', prop: 'lgort' },
  { label: '物料编码', prop: 'matnr', formatter: (data) => formatMaterial(data) },
  { label: '物料描述', prop: 'maktx', type: 'Table/Notice' },
  { label: '来源生产批', prop: 'prodbatch' },
  { label: '工位', prop: 'workp' },
  { label: '入库日期', prop: 'rkdat' },
  { label: '数量', prop: 'erfmg' },
  { label: '单位', prop: 'gmein' },
  { label: '交货单', prop: 'delivnum' },
  { label: '调入数量', prop: 'minmenge' },
  { label: '数量', prop: 'gamng' },
  { label: '供应商', prop: 'lifnr' },
  { label: '采购订单', prop: 'ebeln' },
  { label: '调拨订单', prop: 'reqno' },
  { label: '创建日期', prop: 'cdate' }
]
