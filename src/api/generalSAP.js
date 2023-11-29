import { requestMIS as request} from '@/utils/requestMiswms'
// let urlSAP = process.env.VUE_APP_BASE_API_SAP + 'Sap/SapService.svc/'

// 查询数据 && 过账
export function getList(data) {
  return request({
    url: url_sap + 'SapService.svc/rest/ExecuteFungtion',
    method: 'post',
    data
  })
}
export const url_sap = getModeUrl()
function getModeUrl() {
  if (process.env.NODE_ENV === 'development') {
    // 外网测试环境
    return process.env.VUE_APP_BASE_API_SAP + 'Wcf/'
  } else {
    // 内网正式环境
    return process.env.VUE_APP_BASE_API_SAP + 'Sap/'
  }
}
