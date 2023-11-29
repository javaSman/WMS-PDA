import { _showFailToast } from '@/utils/message'
import { MISWMSAPI } from '@/api/generalAPI'
const partListAPIName = 'receivingAndWarehousing/findDetailListByMatnr'

const partListTableColumn = [
  { label: '产品名', prop: 'productname' },
  { label: '规格/型号', prop: 'specification' },
  { label: '单位', prop: 'unit' },
  { label: '数量', prop: 'quantity' }
]
export default {
  data() {
    return {
      partListTableColumn
    }
  },
  methods: {
    /**
     * 按钮-配件清单
     * @param key 字段名
     * @param data 整条数据
     * @param index 索引
     */
    getPartList(key, data, index) {
      let matnr = data['matnr'] ? data['matnr'] : data['idnrk']
      // 如果这两个都是空的，那就用外部的key
      if (!matnr) {
        matnr = data[key]
      }
      if (!matnr) {
        _showFailToast('物料号不存在')
        return
      }
      let _this = this
      _this.tableBtnParams.loading[index] = true
      MISWMSAPI.post(partListAPIName, { matnr: Number(matnr) + '' })
        .then((res) => {
          if (res && res.success) {
            _this.partList = res.data
            _this.visible = true
          } else {
            _showFailToast(res.data)
          }
        })
        .finally(() => {
          _this.tableBtnParams.loading[index] = false
        })
    }
  }
}
