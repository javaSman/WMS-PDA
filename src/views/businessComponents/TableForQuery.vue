<template>
  <div ref="wrapperRef" class="wrapper" @scroll="onScroll">
    <div class="background" :style="{ height: `${total_height}px` }" />
    <div ref="container" class="list">
      <van-checkbox-group ref="checkboxGroup" v-model="selected" @change="handleSelect">
        <van-cell-group v-for="(_data, index) in runTableData" :key="index" style="margin-top: 5px">
          <van-field v-for="item in tableColumn" :key="item.prop" name="switch" :label="item.label" label-width="7em">
            <template #input>
              <!-- 第一行：显示复选框 -->
              <div v-if="item.type === 'Table/CheckBox'" style="width: 100%">
                <span>
                  {{ (item.formatter && item.formatter(_data.data, _data.data[item.prop])) || _data.data[item.prop] }}
                </span>
                <van-checkbox
                  :name="_data.data[uniqueKey]"
                  :disabled="disabledChk || _data.data.disabled"
                  shape="square"
                  style="float: right; padding-top: 2px"
                />
              </div>
              <!-- 右侧按钮 -->
              <div v-else-if="item.type === 'Table/RightBtn'" style="width: 100%">
                <span>{{ _data.data[item.prop] }}</span>
                <van-button
                  square
                  type="primary"
                  size="mini"
                  style="float: right"
                  :icon="item.tableBtnParams?.icon"
                  :loading="item.tableBtnParams?.loading[index]"
                  @click="handleRightBtn(item.prop, _data.data, index)"
                >
                  {{ item.tableBtnParams?.btnText || '配件清单' }}
                </van-button>
              </div>
              <!-- 针对可以输入项自定义设计 -->
              <div v-else-if="item.type === 'Table/Number'">
                <input v-model="_data[item.prop]" class="cutom_input" type="number" @input="(event) => inputNum(event, item.prop, index)" />
                <span>&nbsp;&nbsp; x {{ item.multiple }}</span>
                <span>&nbsp;&nbsp;=&nbsp;&nbsp;</span>
                <span>{{ computedNum(_data.data[item.prop], item.multiple) }}</span>
              </div>
              <!-- 底部清除按钮 -->
              <div v-else-if="item.prop === 'bottom_clean'" class="bottom_btn">
                <van-button type="danger" square size="mini" @click="clearItem(_data.data.uuid)">清除</van-button>
              </div>
              <!-- 自定义插槽 -->
              <slot v-else-if="item.type === 'CustomSlot'" :name="item.slot" :row="_data.data" :item="item" :index="index" />
              <span v-else>
                {{ (item.formatter && item.formatter(_data.data, _data.data[item.prop])) || _data.data[item.prop] }}
              </span>
            </template>
          </van-field>
        </van-cell-group>
      </van-checkbox-group>
    </div>
  </div>
</template>

<script>
import { CheckboxGroup } from 'vant'

export default {
  name: 'TableVue',
  components: {},
  props: {
    tableData: { type: Array, default: () => [] }, // 表格数据
    tableColumn: { type: Array, default: () => [] }, // 表格字段参数
    selection: { type: Array, default: () => [] }, // 选中项数组
    uniqueKey: { type: String, default: 'uuid' }, // 选中项值字段，tableData 唯一值
    disabledChk: { type: Boolean, default: () => false }, // 禁用所有复选框
    formListLength: { type: Number, default: 2 } // 查询表单的项目数，用于计算可视顶部偏移距离
  },
  data() {
    return {
      checkboxGroup: CheckboxGroup,
      selected: [],
      runTableData: [], // 滚动时表格的内容
      orignTableData: [], // 格式化后的原始数据
      maxNum: 0, // 一屏幕容纳的最大数量
      distance: 0, // 滚动距离缓存
      total_height: 0, // 列表的最大高度
      cache_screens: 1, // 缓冲屏幕的数量
      min_height: 30.8, // list的最小高度(只有一项的时候)
      ticking: false // 每次滚动的节流标识
    }
  },
  computed: {},
  watch: {
    // 监听prop数据，重新构造新数据来适配虚拟滚动
    tableData: {
      handler: function (n) {
        if (n.length === 0) {
          this.runTableData = []
          return
        }
        let total_height_temp = 0
        const list = n.map((data, index) => {
          const height = this.tableColumn.length * 30.8
          const ob = {
            index,
            height,
            top: total_height_temp,
            data
          }
          total_height_temp += height
          return ob
        })
        this.total_height = total_height_temp + 100
        this.orignTableData = list
        this.getRunData()
      }
    },
    // 计算列表总高度
    'tableData.length': {
      handler(n) {
        // 当前使用的vant的field的高度是30.8一项，那么根据tableColumn的长度即可计算出一个list的高度是多少
        let oneListH = this.tableColumn.length * 30.8
        // 那么总高度就是列表总数据长度*一个list的高度
        this.total_height = oneListH * n
      }
    }
  },
  mounted() {
    this.init()
    this.$nextTick(() => {
      this.checkboxGroup = this.$refs.checkboxGroup
    })
  },
  methods: {
    // 初始化虚拟滚动
    init() {
      const containerHeight = parseInt(getComputedStyle(this.$refs.wrapperRef).height)
      // 一屏的最大数量
      this.maxNum = Math.ceil(containerHeight / this.min_height)
    },

    // 当用户滚动时触发的事件
    onScroll(e) {
      if (this.ticking) {
        return
      }
      this.ticking = true
      requestAnimationFrame(() => {
        this.ticking = false
      })
      const scrollTop = e.target.scrollTop
      this.distance = scrollTop
      this.getRunData(this.distance)
    },

    // 动态获取滚动时列表的数据
    getRunData(distance = null) {
      // 滚动的总距离
      const scrollTop = distance || this.$refs.container?.scrollTop
      // 起始索引
      let start_index = this.getStartIndex(scrollTop)
      start_index = start_index < 0 ? 0 : start_index
      // 上屏索引
      let upper_start_index = start_index - this.maxNum * this.cache_screens
      upper_start_index = upper_start_index < 0 ? 0 : upper_start_index
      // 调整offset
      this.$refs.container.style.transform = `translate3d(0,${this.orignTableData[upper_start_index].top}px,0)`
      // 中间屏幕的元素
      const mid_list = this.orignTableData.slice(start_index, start_index + this.maxNum)
      // 上屏
      const upper_list = this.orignTableData.slice(upper_start_index, start_index)
      // 下屏元素
      let down_start_index = start_index + this.maxNum
      down_start_index = down_start_index > this.orignTableData.length - 1 ? this.orignTableData.length : down_start_index
      const down_list = this.orignTableData.slice(down_start_index, down_start_index + this.maxNum * this.cache_screens)
      this.runTableData = [...upper_list, ...mid_list, ...down_list]
    },

    // 获取起点的索引,二分法查找
    getStartIndex(scrollTop) {
      let start = 0
      let end = this.orignTableData.length - 1
      while (start < end) {
        const mid = Math.floor((start + end) / 2)
        const { top, height } = this.orignTableData[mid]
        if (scrollTop >= top && scrollTop < top + height) {
          start = mid
          break
        } else if (scrollTop >= top + height) {
          start = mid + 1
        } else if (scrollTop < top) {
          end = mid - 1
        }
      }
      return start
    },

    // 统一的右键点击方法
    handleRightBtn(key, data, index) {
      this.emit('clickHandler', key, data, index)
    },

    // 勾选方法
    handleSelect(val) {
      let arr = []
      this.selected = val
      this.tableData.forEach((item) => {
        if (val.includes(item[this.uniqueKey])) arr.push(item)
      })
      this.emit('update:selection', arr)
    },

    // 计算当前数量
    computedNum(num, multiple) {
      return multiple ? num * multiple : num
    },
    // 清除某一项方法,借助uuid删除某一项
    clearItem(key) {
      let result = this.tableData.filter((item) => item.uuid !== key)
      // 同时如果清除的是选中的，那么选中的也要删除
      let newSelection = this.selection.filter((item) => item.uuid !== key)
      this.$emit('update:tableData', result)
      this.$emit('update:selection', newSelection)
    },
    // 校验输入时提示
    inputNum(e, key, index) {
      this.$emit('inputNumHandler', key, index)
    }
  }
}
</script>

<style scoped lang="scss">
.wrapper {
  position: relative;
  overflow-y: scroll;
  height: calc(100vh - 191px);
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
  }
}
.cutom_input {
  border: none;
  border-bottom: 1px solid #ccc;
  width: 50%;
}
.bottom_btn {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  width: 100%;
}
</style>
