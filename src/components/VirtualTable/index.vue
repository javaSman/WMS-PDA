<template>
  <div ref="virtual_table_wrapper" class="wrapper" :style="{ top: wrappTop + 150 + 'px', 'min-height': itemHeight + 'px' }" @scroll="onScroll">
    <!-- 这里空标签用来撑开总高度的滚动条的 -->
    <div ref="backgroud" class="background" :style="{ height: `${total_height}px` }" />
    <!-- 这个list是用来承载可视内容的，随着滚动，它应该动态改变自身的位置让其始终在时线内 -->
    <div ref="views_container" class="list">
      <van-checkbox-group v-model="_selection">
        <div v-for="(item, index) in runList" :key="item.uuid" class="list_item">
          <div v-for="column in tableColumn" :key="column.prop" class="row">
            <div class="label">{{ column.label }}</div>
            <div class="result">
              <input
                v-if="column.type === 'Table/Input'"
                :ref="column.prop + '_' + index"
                v-model="item[column.prop]"
                :placeholder="`请输入${column.label}`"
                class="table_input"
                @keyup.enter="(e) => inputText(item, column.prop, index)"
              />
              <span v-else>
                {{ (column.formatter && column.formatter(item, item[column.prop])) || item[column.prop] }}
              </span>
            </div>
            <div v-if="column.type === 'Table/CheckBox'" class="check_btn">
              <van-checkbox shape="square" :name="item.uuid" :disabled="disableChck" />
            </div>
          </div>
        </div>
      </van-checkbox-group>
    </div>
  </div>
</template>

<script>
export default {
  name: 'VirtualTable',
  props: {
    // 缓冲的屏幕数量
    cacheScreens: {
      type: Number,
      default: 1
    },
    // 列表数据
    tableData: {
      type: Array,
      default: () => []
    },
    tableColumn: {
      type: Array,
      default: () => []
    },
    // 列表高度，一项是40
    wrappTop: {
      type: Number,
      default: 360
    },
    selection: {
      type: Array,
      default: () => []
    },
    disableChck: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      runList: [], // 运行时的列表
      total_height: 0, // 列表总高度
      maxNum: 0, // 一屏幕容纳的最大数量
      distance: 0, // 存储滚动的距离
      ticking: false, // 是否可以滚动
      scroll_scale: [], // 缓存滚动阈值
      itemHeight: 316
    }
  },
  computed: {
    _selection: {
      get() {
        return this.selection
      },
      set(val) {
        this.$emit('update:selection', val)
      }
    }
  },
  watch: {
    tableData: {
      handler(n) {
        if (n.length === 0) {
          this.runList = []
          this.$refs.views_container.style.transform = `translate3d(0,0px,0)`
          this.total_height = 0
          this.distance = 0
        }
      },
      deep: true
    },
    'tableData.length': function (n) {
      if (n.length === 0) {
        this.distance = 0
        this.total_height = 0
        return
      }
      if (n > 0) {
        this.init()
        this.getRunData()
      }
    },
    'tableColumn.length': function (n) {
      if (n) {
        this.itemHeight = n * 30 + 10
      }
    }
  },
  methods: {
    init() {
      // 获取外层容器的实际高度
      let containerHeight = parseInt(getComputedStyle(this.$refs.virtual_table_wrapper).height)
      this.total_height = this.tableData.length * this.itemHeight
      // 一屏的最大数量
      this.maxNum = Math.ceil(containerHeight / this.itemHeight)
    },
    inputText(data, key, index) {
      this.$emit('inputTextHandler', data, key, index)
    },
    onScroll(e) {
      if (this.ticking) {
        return
      }
      this.ticking = true
      // 利用此函数进行节流
      requestAnimationFrame(() => {
        this.ticking = false
      })
      const distance = e.target.scrollTop
      this.distance = distance
      this.getRunData(distance)
    },
    /** 二分法计算起点 */
    getStartIndex(scrollTop) {
      let start = 0
      let end = this.tableData.length - 1
      while (start < end) {
        const mid = Math.floor((start + end) / 2)
        // 每一项距离顶部的距离都是它前面的项的高度之和
        const top = this.itemHeight * (mid - 1)
        // 当前滚动距离超过顶部但是不超过它自身+顶部时说明它仍然没有被完全滚出视线
        if (scrollTop >= top && scrollTop < top + this.itemHeight) {
          start = mid
          break
          // 超过了，那么起点就要下移一项
        } else if (scrollTop >= top + this.itemHeight) {
          start = mid + 1
          // 反向滚动，那就是上一项
        } else if (scrollTop < top) {
          end = mid - 1
        }
      }
      return start
    },
    /** 动态判断当前视图应该显示什么内容 */
    getRunData(distance = null) {
      // 滚动的总距离
      const scrollTop = distance || this.$refs.views_container.scrollTop
      // 在哪个范围内不执行滚动
      if (this.scroll_scale.length > 0) {
        // 判断当前滚动值是否落在滚动阈值之间，如果是，那就不滚动，节省性能
        if (scrollTop > this.scroll_scale[0] && scrollTop < this.scroll_scale[1]) {
          return
        }
      }
      // 获取起始索引
      let start_index = this.getStartIndex(scrollTop)
      start_index = start_index < 0 ? 0 : start_index

      // 上屏索引
      let upper_start_index = start_index - this.maxNum * this.cacheScreens
      upper_start_index = upper_start_index < 0 ? 0 : upper_start_index
      // 调整可是区域的offset,达到无论怎么滚动，这部分内容始终在视野之内
      this.$refs.views_container.style.transform = `translate3d(0,${upper_start_index * this.itemHeight}px,0)`
      // 中间屏幕的元素
      const mid_list = this.tableData.slice(start_index, start_index + this.maxNum)
      // 上屏
      const upper_list = this.tableData.slice(upper_start_index, start_index)
      // 下屏元素
      let down_start_index = start_index + this.maxNum
      down_start_index = down_start_index > this.tableData.length - 1 ? this.tableData.length : down_start_index
      // 记录滚动缓冲阈值
      this.scroll_scale = [
        Math.floor(upper_start_index + this.maxNum / 2) * this.itemHeight,
        Math.ceil(start_index + this.maxNum / 2) * this.itemHeight
      ]
      const down_list = this.tableData.slice(down_start_index, down_start_index + this.maxNum * this.cacheScreens)
      this.runList = [...upper_list, ...mid_list, ...down_list]
    }
  }
}
</script>

<style lang="scss" scoped>
.wrapper {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 50px;
  top: 0;
  overflow-y: scroll;
  .background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: -1;
  }
  .list {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    font-size: 13px;
    .list_item {
      display: flex;
      flex-direction: column;
      background-color: #ffff;
      margin-top: 10px;
      .row {
        display: flex;
        justify-self: flex-start;
        flex-direction: row;
        align-items: center;
        line-height: 30px;
        border-bottom: 1px solid #ccc;
        .label {
          width: 26%;
          text-align: left;
          padding-left: 10px;
          border-right: 1px solid #ccc;
        }
        .result {
          width: 60%;
          text-align: left;
          padding-left: 10px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          -o-text-overflow: ellipsis;
          text-overflow: ellipsis;
          .table_input {
            border: none;
            border-bottom: 1px solid #ccc;
            transition: 1s ease;
            &:focus {
              border-bottom: 1px solid rgb(25, 137, 250);
            }
          }
        }
        .check_btn {
          position: absolute;
          right: 10px;
        }
      }
    }
  }
}
</style>
