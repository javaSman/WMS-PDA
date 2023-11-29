export const WAREHOUSE_LIST = [
  { text: 'WH001', value: 'WH001' },
  { text: 'WH002', value: 'WH002' },
  { text: 'WH003', value: 'WH003' },
  { text: 'WH004', value: 'WH004' },
  { text: 'WH005', value: 'WH005' }
]
/**
 * 移动类型
 */
export const MOVE_TYPE = [
  { text: '101采购订单收货', value: '101采购订单收货' },
  { text: '161采购单退货', value: '161采购单退货' },
  { text: '103收货到库存冻结状态', value: '103收货到库存冻结状态' },
  { text: '105良品入库', value: '105良品入库' },
  { text: '105现返入库', value: '105现返入库' },
  { text: '122采购订单退货', value: '122采购订单退货' },
  { text: '124不良品退货', value: '124不良品退货' },
  { text: '非生产性物料备料单过账', value: '非生产性物料备料单过账' },
  { text: '201部门领料', value: '201部门领料' },
  { text: '202部门退料', value: '202部门退料' },
  { text: '241工程物资发料', value: '241工程物资发料' },
  { text: '242工程物资退料', value: '242工程物资退料' },
  { text: '261胚料发料', value: '261胚料发料' },
  { text: '261生产领料', value: '261生产领料' },
  { text: '262胚料退料', value: '262胚料退料' },
  { text: '261生产退料', value: '261生产退料' },
  { text: '301工厂内转移', value: '301工厂内转移' },
  { text: '311工厂内转移', value: '311工厂内转移' },
  { text: '315拣货到备料仓', value: '315拣货到备料仓' },
  { text: '生产物料拣货到备料仓', value: '生产物料拣货到备料仓' },
  { text: '生产性物料备料单确认过账', value: '生产性物料备料单确认过账' },
  { text: '315工具领料拣货到备料仓', value: '315工具领料拣货到备料仓' },
  { text: '501客供料收货', value: '501客供料收货' },
  { text: '511免费收货入库', value: '511免费收货入库' },
  { text: '531副产品收货', value: '531副产品收货' },
  { text: '541委外发料', value: '541委外发料' },
  { text: 'Z03工具领料', value: 'Z03工具领料' },
  { text: 'Z04工具退料', value: 'Z04工具退料' },
  { text: 'Z05本返入库', value: 'Z05本返入库' },
  { text: 'Z31转移到计算仓/样机仓', value: 'Z31转移到计算仓/样机仓' },
  { text: 'Z41维修品出库', value: 'Z41维修品出库' },
  { text: 'Z42维修品收货', value: 'Z42维修品收货' },
  { text: '新发料功能', value: '新发料功能' },
  { text: '机加件入库', value: '机加件入库' },
  { text: '601公司间发货', value: '601公司间发货' },
  { text: 'ZZ1自制机加件入库查询', value: 'ZZ1自制机加件入库查询' }
]

// export const Box = [
//   { text: '空', value: '空' },
//   { text: '未满', value: '未满' },
// ]

export const Box = [
  { text: '空', value: '空' },
  { text: '未满', value: '未满' },
  { text: '已满', value: '已满' }
]
/**
 * 格式化订单
 * @param data 整条数据
 * @param val 订单
 * @returns 订单-？
 */
export function formatEbeln(data) {
  if (!data.ebeln && !data.ebelp) return ''
  return `${data.ebeln || ''}-${data.ebelp || ''}`
}
/**
 * 格式化物料号
 * @param data 整条数据
 * @param val 物料号
 * @returns 去零物料号
 */
export function formatMatnr(data, val) {
  return val ? Number(val) + '' : ''
}
/**
 * 格式化物料号，WMS业务有机加件和外购件之分，有的取值matnr有的取值idnrk，在调用接口之前无法区分
 * @param data 整条数据
 * @param val 物料号
 * @returns 去零物料号
 */
export function formatMaterial(data) {
  let { matnr, idnrk } = data
  let _val = matnr || idnrk
  return _val.replace(/^0+/gi, '')
  // return Number(_val) + ''
}

/**
 * 格式化生产订单，移除前面的0显示
 * @param {*} data
 * @returns
 */
export function formatAufnr(data) {
  return data.aufnr ? data.aufnr.replace(/^0+/gi, '') : ''
}
/**
 * 格式化数量
 * @param data 整条数据
 * @param val 数量
 * @returns 数量 | 单位
 */
export function formatErfmg(data, val) {
  return `${val || ''} ${data.erfme || ''}`
}
/**
 * 格式化数量，乘数
 */
export function formatErfmgMultiple(data, val) {
  if (!val) return ''
  return `${val} × 1 = ${val} ${data.erfme || ''}`
}
/**
 * 格式化生产批/工位
 * @param data 整条数据
 * @param val 生产批
 * @returns 生产批 / 工位
 */
export function formatCharg(data) {
  if (!data.charg && !data.workp) return ''
  return `${data.charg || ''} / ${data.workp || ''}`
}
/**
 * 格式化生产批 | 工位
 * @param data 整条数据
 * @param val 生产批
 * @returns 生产批 | 工位
 */
export function formatProdbatch(data) {
  if (!data.prodbatch && !data.workp) return ''
  return `${data.prodbatch || ''} | ${data.workp || ''}`
}
/**
 * 格式化生产批/工位
 * @param data 整条数据
 * @param val 生产批
 * @returns 生产批/工位
 */
export function formatProdbatchBySlash(data) {
  if (!data.prodbatch && !data.workp) return ''
  return `${data.prodbatch || ''}/${data.workp || ''}`
}
/**
 * 格式化目标库位
 * @param data 整条数据
 * @param val 库位
 * @returns 工厂 | 库位
 */
export function formatLgort(data) {
  if (!data.werks && !data.lgort) return ''
  return `${data.werks || ''} | ${data.lgort || ''}`
}
/**
 * 格式化工厂库位
 * @param data 整条数据
 * @param val 库位
 * @returns 工厂-库位
 */
export function formatLgortConnector(data) {
  if (!data.werks && !data.lgort) return ''
  return `${data.werks || ''}-${data.lgort || ''}`
}

/**
 * 格式化工厂库位
 * @param data 整条数据
 * @param val 库位
 * @returns 工厂 | 库位
 */
export function formatLgott(data) {
  if (!data.werkt && !data.lgott) return ''
  return `${data.werkt || ''} | ${data.lgott || ''}`
}
/**
 * 格式化工厂库位
 * @param data 整条数据
 * @param val 库位
 * @returns 工厂-库位
 */
export function formatLgottConnector(data) {
  if (!data.werks && !data.lgott) return ''
  return `${data.werks || ''}-${data.lgott || ''}`
}
//  【成本中心】数据格式化
export function formatWorkCenter(data) {
  return `${data.kostl} | ${data.ktext}`
}
