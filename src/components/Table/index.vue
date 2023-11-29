<template>
  <div>
    <template v-if="isVirtually">
      <div ref="wrapperRef" class="wrapper" @scroll="onScroll">
        <div class="background" :style="{ height: `${total_height}px` }" />
        <div ref="container" class="list">
          <van-form ref="refForm" :show-error="false" :submit-on-enter="false">
            <van-checkbox-group ref="checkboxGroup" v-model="virtualSelected" @change="handleSelect">
              <van-cell-group v-for="({ data }, index) in runTableData" :key="index" class="tableCellGroup">
                <van-field
                  v-for="item in tableColumn"
                  :key="item.prop"
                  name="switch"
                  :label="item.label"
                  label-width="7em"
                  :required="item.rules && item.rules.length > 0"
                >
                  <template #input>
                    <!-- 第一行：显示复选框 -->
                    <div v-if="item.type === 'Table/CheckBox'" style="width: 100%">
                      <span>{{ (item.formatter && item.formatter(data, data[item.prop])) || data[item.prop] }}</span>
                      <van-checkbox
                        ref="checkbox"
                        :name="data[uniqueKey]"
                        :disabled="disabledChk || data.disabled"
                        shape="square"
                        style="float: right; padding-top: 2px"
                      />
                    </div>
                    <!-- 右侧按钮 -->
                    <div v-else-if="item.type === 'Table/RightBtn'" style="width: 100%">
                      <span>{{ (item.formatter && item.formatter(data, data[item.prop])) || data[item.prop] }}</span>
                      <van-button
                        square
                        type="primary"
                        size="mini"
                        style="float: right"
                        :icon="item.tableBtnParams.icon"
                        :loading="item.tableBtnParams.loading[index]"
                        @click="handleRightBtn(item.prop, data, index)"
                      >
                        {{ item.tableBtnParams.btnText || '配件清单' }}
                      </van-button>
                    </div>
                    <div v-else-if="item.type === 'Table/Input'" style="width: 100%">
                      <van-field
                        :ref="item.prop + '_' + index"
                        v-model="data[item.prop]"
                        :placeholder="'请输入' + item.label"
                        :rules="item.rules"
                        clearable
                        clear-trigger="always"
                        class="table_input"
                        @keyup.enter="inputText(item.prop, index)"
                      />
                    </div>
                    <div v-else-if="item.type === 'Table/NumberInput'" style="width: 100%">
                      <van-field
                        :ref="item.prop + '_' + index"
                        v-model="data[item.prop]"
                        type="number"
                        :name="index + '_' + item.prop"
                        :placeholder="'请输入' + item.label"
                        :rules="item.rules"
                        clearable
                        clear-trigger="always"
                        class="table_input"
                        @blur="inputNum(item.prop, index, data[uniqueKey])"
                      >
                        <template v-if="item.tableNumberParams" #extra>
                          {{ data[item.tableNumberParams.exProp] }}
                        </template>
                      </van-field>
                    </div>
                    <!-- 针对可以输入项自定义设计 -->
                    <div v-else-if="item.type === 'Table/Number'">
                      <van-field
                        v-model="data[item.prop]"
                        type="number"
                        :name="index + '_' + item.prop"
                        :placeholder="'请输入' + item.label"
                        :rules="item.rules"
                        clearable
                        clear-trigger="always"
                        class="cutom_input"
                        @blur="inputNum(item.prop, index)"
                      >
                        <template #extra>
                          x {{ item.multiple }} = {{ computedNum(data[item.prop], item.multiple) + computedUnit(data.erfme, data.gmein) }}
                        </template>
                      </van-field>
                    </div>
                    <!-- 通知滚动显示 -->
                    <div v-else-if="item.type === 'Table/Notice'" style="width: 100%">
                      <van-notice-bar scrollable background="#fff" color="#323233">
                        {{ (item.formatter && item.formatter(data, data[item.prop])) || data[item.prop] }}
                      </van-notice-bar>
                    </div>
                    <!-- 底部清除按钮 -->
                    <div v-else-if="item.prop === 'bottom_clean'" class="bottom_btn">
                      <van-button type="danger" square size="mini" @click="clearItem(data.uuid)">清除</van-button>
                    </div>
                    <!-- 自定义插槽 -->
                    <slot v-else-if="item.type === 'CustomSlot'" :name="item.slot" :row="data" :item="item" :index="index" />
                    <!-- 加这一个是为了那些有授权时，领料人要显示授权人的名字 -->
                    <span v-else-if="item.type === 'operateLocal'">{{ user.authUserInfo.cardname }}</span>
                    <span v-else>{{ (item.formatter && item.formatter(data, data[item.prop])) || data[item.prop] }}</span>
                  </template>
                </van-field>
              </van-cell-group>
              <van-empty v-if="tableData.length === 0" description="暂无数据" image-size="100" style="padding: 0" />
            </van-checkbox-group>
          </van-form>
        </div>
      </div>
    </template>
    <template v-else>
      <van-form ref="refForm" :show-error="false" :submit-on-enter="false">
        <van-checkbox-group ref="checkboxGroup" v-model="selected" @change="handleSelect">
          <van-cell-group v-for="(_data, index) in tableData" :key="index" class="tableCellGroup">
            <van-field
              v-for="item in tableColumn"
              :key="item.prop"
              name="switch"
              :label="item.label"
              label-width="7em"
              :required="item.rules && item.rules.length > 0"
            >
              <template #input>
                <!-- 第一行：显示复选框 -->
                <div v-if="item.type === 'Table/CheckBox'" style="width: 100%">
                  <span>{{ (item.formatter && item.formatter(_data, _data[item.prop])) || _data[item.prop] }}</span>
                  <van-checkbox
                    ref="checkbox"
                    :name="_data[uniqueKey]"
                    :disabled="disabledChk || _data.disabled"
                    shape="square"
                    style="float: right; padding-top: 2px"
                  />
                </div>
                <!-- 右侧按钮 -->
                <div v-else-if="item.type === 'Table/RightBtn'" style="width: 100%">
                  <span>{{ (item.formatter && item.formatter(_data, _data[item.prop])) || _data[item.prop] }}</span>
                  <van-button
                    square
                    type="primary"
                    size="mini"
                    style="float: right"
                    :icon="item.tableBtnParams.icon"
                    :loading="item.tableBtnParams.loading[index]"
                    @click.prevent="handleRightBtn(item.prop, _data, index)"
                  >
                    {{ item.tableBtnParams.btnText || '配件清单' }}
                  </van-button>
                </div>
                <div v-else-if="item.type === 'Table/Input'" style="width: 100%">
                  <van-field
                    :ref="item.prop + '_' + index"
                    v-model="_data[item.prop]"
                    :placeholder="'请输入' + item.label"
                    :rules="item.rules"
                    clearable
                    clear-trigger="always"
                    class="table_input"
                    @keyup.enter="(e) => inputText(item.prop, index)"
                  />
                </div>
                <div v-else-if="item.type === 'Table/NumberInput'" style="width: 100%">
                  <van-field
                    :ref="item.prop + '_' + index"
                    v-model="_data[item.prop]"
                    type="number"
                    :name="index + '_' + item.prop"
                    :placeholder="'请输入' + item.label"
                    :rules="item.rules"
                    clearable
                    clear-trigger="always"
                    class="table_input"
                    @blur="inputNum(item.prop, index)"
                  >
                    <template v-if="item.tableNumberParams" #extra>
                      {{ _data[item.tableNumberParams.exProp] }}
                    </template>
                  </van-field>
                </div>
                <!-- 针对可以输入项自定义设计 -->
                <div v-else-if="item.type === 'Table/Number'">
                  <van-field
                    v-model="_data[item.prop]"
                    type="number"
                    :name="index + '_' + item.prop"
                    :placeholder="'请输入' + item.label"
                    :rules="item.rules"
                    clearable
                    clear-trigger="always"
                    class="cutom_input"
                    @blur="inputNum(item.prop, index)"
                  >
                    <template #extra>
                      x {{ item.multiple }} = {{ computedNum(_data[item.prop], item.multiple) + computedUnit(_data.erfme, _data.gmein) }}
                    </template>
                  </van-field>
                </div>
                <!-- 通知滚动显示 -->
                <div v-else-if="item.type === 'Table/Notice'" style="width: 100%">
                  <van-notice-bar scrollable background="#fff" color="#323233">
                    {{ (item.formatter && item.formatter(_data, _data[item.prop])) || _data[item.prop] }}
                  </van-notice-bar>
                </div>
                <!-- 底部清除按钮 -->
                <div v-else-if="item.prop === 'bottom_clean'" class="bottom_btn">
                  <van-button type="danger" square size="mini" @click="clearItem(_data.uuid)">清除</van-button>
                </div>
                <!-- 自定义插槽 -->
                <slot v-else-if="item.type === 'CustomSlot'" :name="item.slot" :row="_data" :item="item" :index="index" />
                <!-- 加这一个是为了那些有授权时，领料人要显示授权人的名字 -->
                <span v-else-if="item.type === 'operateLocal'">{{ user.authUserInfo.cardname }}</span>
                <span v-else>{{ (item.formatter && item.formatter(_data, _data[item.prop])) || _data[item.prop] }}</span>
              </template>
            </van-field>
          </van-cell-group>
          <van-empty v-if="tableData.length === 0" description="暂无数据" image-size="100" style="padding: 0" />
        </van-checkbox-group>
      </van-form>
    </template>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  name: 'TableVue',
  props: {
    tableData: { type: Array, default: () => [] }, // 表格数据
    tableColumn: { type: Array, default: () => [] }, // 表格字段参数
    selection: { type: Array, default: () => [] }, // 选中项数组
    uniqueKey: { type: String, default: 'uuid' }, // 选中项值字段，tableData 唯一值
    disabledChk: { type: Boolean, default: () => false }, // 禁用所有复选框
    isVirtually: { type: Boolean, default: () => false } // 是否开启虚拟滚动,开启之后选择需要作出更改
  },
  data() {
    return {
      selected: [],
      total_height: 0,
      min_height: 30.8,
      runTableData: [],
      maxNum: 0,
      distance: 0,
      ticking: false,
      cache_screens: 1,
      orignTableData: []
    }
  },
  computed: {
    ...mapGetters(['account', 'name', 'authUserInfo']),
    virtualSelected: {
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
        if (this.isVirtually) {
          if (n.length === 0) {
            this.distance = 0
            this.total_height = 0
            this.runTableData = []
            this.orignTableData = []
            this.$refs.container.style.transform = `translate3d(0,0px,0)`
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
          // this.getRunData()
        }
      },
      deep: true
    },
    'tableData.length': function (n) {
      if (this.isVirtually) {
        // 当前使用的vant的field的高度是30.8一项，那么根据tableColumn的长度即可计算出一个list的高度是多少
        let oneListH = this.tableColumn.length * 30.8
        // 那么总高度就是列表总数据长度*一个list的高度
        this.total_height = oneListH * n
        this.getRunData()
      }
    }
  },
  mounted() {
    if (this.isVirtually) {
      this.init()
    }
  },
  methods: {
    init() {
      // const containerHeight = parseInt(getComputedStyle(this.$refs.wrapperRef).height)
      // // 一屏的最大数量
      // this.maxNum = Math.ceil(containerHeight / this.min_height)
      // console.log('此时的最大数量', this.maxNum)
      // 让一屏幕的数量就是
      this.maxNum = 3
    },
    onScroll(e) {
      let _this = this
      if (this.isVirtually) {
        if (this.ticking) {
          return
        }
        this.ticking = true
        requestAnimationFrame(() => {
          _this.ticking = false
        })
        const scrollTop = e.target.scrollTop
        this.distance = scrollTop
        this.getRunData(this.distance)
      }
    },
    getRunData(distance) {
      if (this.orignTableData.length > 0) {
        // 滚动的总距离
        const scrollTop = distance || this.$refs.container.scrollTop
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
      }
    },
    getStartIndex(scrollTop) {
      if (this.orignTableData.length > 0) {
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
      } else {
        return 0
      }
    },
    handleRightBtn(key, data, index) {
      this.$emit('clickHandlerEvent', key, data, index)
    },
    handleSelect(val) {
      if (this.isVirtually) {
        this.$emit('update:selection', val)
      } else {
        let arr = []
        this.selected = val
        this.tableData.forEach((item) => {
          if (val.includes(item[this.uniqueKey])) arr.push(item)
        })
        this.$emit('update:selection', arr)
      }
    },
    computedNum(num, multiple) {
      return multiple ? num * multiple : num
    },
    clearItem(key) {
      let result = this.tableData.filter((item) => item.uuid !== key)
      // 同时如果清除的是选中的，那么选中的也要删除
      let newSelection = this.selection.filter((item) => item.uuid !== key)
      this.$emit('update:tableData', result)
      this.$emit('update:selection', newSelection)
    },
    inputNum(key, index, id) {
      this.$emit('inputNumHandler', key, index, id)
    },
    inputText(key, index) {
      this.$emit('inputTextHandler', key, index)
    },
    computedUnit(val1, val2) {
      if (val1) {
        return ` | ${val1}`
      } else if (val2) {
        return ` | ${val2}`
      } else {
        return ''
      }
    }
  }
}
</script>

<style scoped lang="scss">
.wrapper {
  position: relative;
  overflow-y: scroll;
  height: calc(100vh - 250px);
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
.vant-table {
  .table {
    border-radius: 0.185185rem;
    text-align: center;
    // border: 1px solid #000;
    margin-top: 10px;
    .th {
      height: 1.074074rem;
      line-height: 1.074074rem;
      background-color: #c2c2c2;
      text-align: center;
    }
    .list-tr {
      height: 1.074074rem;
      line-height: 1.074074rem;
    }
    .list-tr:nth-child(odd) {
      background-color: #e4e4e4;
    }
  }
}
.cutom_input {
  width: 100%;
  padding-left: 0;
  ::v-deep .van-cell__value {
    margin-right: 10px;
  }
}
.bottom_btn {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  width: 100%;
}
.table_input {
  padding-left: 0;
}
::v-deep.van-notice-bar {
  height: 24px;
  padding: 0;
}
</style>
