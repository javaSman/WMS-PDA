import store from '@/store'
import { requestWMS as request } from '@/utils/requestMes'
let urlWMS = process.env.VUE_APP_BASE_API_WMS + 'api/business/'

// 根据箱子号获取货位
export function GetBoxInfoByBoxId(boxId) {
  return request({
    url: urlWMS + 'webapi/GetLocationNoByBoxId',
    method: 'get',
    params: {
      boxId
    }
  })
}

// pda管理，用pda的mac地址绑定当前登录
export function PDABindUser(data) {
  return request({
    url: urlWMS + 'webapi/Insert',
    method: 'post',
    data
  })
}

/**
 * 根据箱子号获取箱子内明细
 * @param boxId 箱子号
 */
export function GetBoxDetail(boxId) {
  return request({
    url: urlWMS + 'webapi/GetBoxDetail',
    method: 'get',
    params: {
      boxId
    }
  })
  // return request({
  //   url: 'http://192.168.30.27:8090/9037Wcf/WarehouseService.svc/rest/GetBoxDetail',
  //   method: 'get',
  //   params: {
  //     boxId
  //   }
  // })
}

/**
 * 根据货位号获取货位详情
 * @param locationNo 货位号
 */
export function GetLocationInfo(locationNo) {
  return request({
    url: urlWMS + 'webapi/GetLocationInfoByLocationNo',
    method: 'get',
    params: {
      locationNo
    }
  })
}
// TODO: 目前没有权限，先写死用户工号
/** 根据用户工号获取仓库列表 */
export function GetUserWarehouse() {
  const account = store.getters.account
  return request({
    url: urlWMS + 'userwarehouse/GetUserWarehouse',
    method: 'get',
    params: {
      userId: account
    }
  })
}
/** 获取仓库列表，用于库存箱下架部分 */
export function GetWarehouseForVehicleRemoval() {
  return request({
    url: urlWMS + 'warehouse/all',
    method: 'get'
  })
}
/**
 * 根据仓库获取码头信息
 * @param {*} warehouse
 * @returns
 */
export function GetWharfByWarehouse(warehouse) {
  return request({
    url: urlWMS + 'webapi/GetWharfByWarehouseNo',
    method: 'get',
    params: {
      WarehouseNo: warehouse
    }
  })
}
/**
 *
 * @description 根据仓库编号获取厂区数据
 */
export function getArea(WarehouseNo) {
  return request({
    url: urlWMS + 'area/all',
    method: 'get',
    params: {
      WarehouseNo
    }
  })
}
/**
 *
 * @param Barcodes 条码、可传入一个字符串数组也可传入一个字符串
 * @param ProjectNo 项目号
 * @param StationNo 工位号
 * @param MaterialNo 物料编号
 * @param Type 项目箱号
 * @description 根据上面的信息获取一个条码列表
 */
export function getmaterialBarcodeInfo(Barcodes, ProjectNo, StationNo, MaterialNo, Type) {
  return request({
    url: urlWMS + 'webapi/GetMaterialBarcodeList',
    method: 'get',
    params: {
      Barcodes,
      ProjectNo,
      StationNo,
      MaterialNo,
      Type
    }
  })
}

/** 登录之后根据token去获取用户的权限信息 */
export function getAuthInfo() {
  return request({
    url: urlWMS + 'webapi/GetCurrentUserPermission',
    method: 'get'
  })
}

/** 查询柏塘军令状纳期数据 */
export function getPaymentDataOfMilitaryInfo(data) {
  return request({
    url: 'spawms-api/mes/getDeliveryData',
    method: 'POST',
    data
  })
}
/** 根据物料号或者条码去获取其对应的工厂库位 */
export function getLgortListByMaterialNo(data) {
  return request({
    url: urlWMS + 'webapi/GetLgortListByMaterialNo',
    method: 'GET',
    params: data
  })
}
/** 根据物料号或者条码或者仓库去查询对应物料的库存信息 */
export function getLocationAndBoxListByMaterialNoAndLgort(data) {
  return request({
    url: urlWMS + 'webapi/GetLocationAndBoxListByMaterialNoAndLgort',
    method: 'GET',
    params: data
  })
}
/** 根据条码获取领料单的所有信息 */
export function get261DListForBarcode(data) {
  return request({
    url: urlWMS + 'webapi/Get261DList',
    method: 'GET',
    params: data
  })
}

// 获取库位信息
export function getT001LList() {
  const account = store.getters.account
  return request({
    url: process.env.VUE_APP_BASE_API_SAP + '9037WcfTest/WarehouseService.svc/rest/GetT001LList',
    method: 'GET',
    params: {
      userName: account
    }
  })
}
// 获取工厂信息
export function getFactoryList() {
  const account = store.getters.account
  return request({
    url: process.env.VUE_APP_BASE_API_SAP + '9037WcfTest/WarehouseService.svc/rest/GetFactoryList',
    method: 'GET',
    params: {
      userName: account
    }
  })
}

// 获取通用列表接口
export function getListComments(data) {
  return request({
    url: process.env.VUE_APP_BASE_API_SAP + '9037Wcf/WarehouseService.svc/rest/ZxwmsXmbeCommonListMrp',
    method: 'POST',
    data
  })
}

// 获取条码明细
export function get261ImBarcode(data) {
  return request({
    url: process.env.VUE_APP_BASE_API_SAP + '9037Wcf/WarehouseService.svc/rest/ZftdXmbeList',
    method: 'POST',
    data
  })
}
