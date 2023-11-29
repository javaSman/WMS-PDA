import { API } from '@/api/generalAPI'

let apiColName = 'usertabletemplatedetail'
export default {
  data() {
    return {
      column: [],
      columnDetail: []
    }
  },
  created() {
    this.getCol()
  },
  methods: {
    /** 获取信息表单配置数据 */
    getCol() {
      if (this.colName) {
        API.get(apiColName, null, this.colName).then((res) => {
          this.column = res
          // 暂用
          this.column.forEach((item) => {
            if (item.type === null) {
              item.type = 'Cell'
            }
          })
        })
      }
      if (this.detailColName) {
        API.get(apiColName, null, this.detailColName).then((res) => {
          this.columnDetail = res
        })
      }
    }
  }
}
