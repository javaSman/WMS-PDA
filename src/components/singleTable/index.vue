<!--
 * @Descripttion:
 * @version:
 * @Author: ZmSama
 * @Date: 2023-02-15 11:15:23
-->
<template>
  <van-form ref="refForm">
    <van-radio-group ref="radioGroup" v-model="selected" @change="handleSelect">
      <van-cell-group v-for="(_data, index) in tableData" :key="index" class="tableCellGroup">
        <van-field v-for="item in tableColumn" :key="item.prop" name="switch" :label="item.label" label-width="7em">
          <template #input>
            <!-- 第一行：显示复选框 -->
            <div v-if="item.type === 'Table/RadioBox'" style="width: 100%">
              <span>{{ (item.formatter && item.formatter(_data, _data[item.prop])) || _data[item.prop] }}</span>
              <van-radio :name="_data[uniqueKey]" :disabled="disabledChk || _data.disabled" style="float: right; padding-top: 2px" />
            </div>
            <!-- 右侧按钮 -->
            <div v-else-if="item.type === 'Table/RightBtn'" style="width: 100%">
              <span>{{ (item.formatter && item.formatter(_data, _data[item.prop])) || _data[item.prop] }}</span>
              <van-button
                square
                type="primary"
                size="mini"
                style="float: right"
                :icon="item.tableBtnParams?.icon"
                :loading="item.tableBtnParams?.loading[index]"
                @click="handleRightBtn(item.prop, _data, index)"
              >
                {{ item.tableBtnParams?.btnText || '配件清单' }}
              </van-button>
            </div>
            <div v-else-if="item.type === 'Table/Input'" style="width: 100%">
              <van-field
                v-model="_data[item.prop]"
                :placeholder="'请输入' + item.label"
                :rules="item.rules"
                clearable
                clear-trigger="always"
                class="table_input"
              />
            </div>
            <div v-else-if="item.type === 'Table/NumberInput'" style="width: 100%">
              <van-field
                :ref="(el) => (tableNumberInputRef[item.prop + '_' + index] = el)"
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
            <span v-else-if="item.type === 'operateLocal'">{{ user.authUserInfo?.cardname }}</span>
            <span v-else>{{ (item.formatter && item.formatter(_data, _data[item.prop])) || _data[item.prop] }}</span>
          </template>
        </van-field>
      </van-cell-group>
      <van-empty v-if="tableData.length === 0" description="暂无数据" />
    </van-radio-group>
  </van-form>
</template>

<script>
export default {
  name: 'TableVue',
  props: {
    tableData: { type: Array, default: () => [] }, // 表格数据
    tableColumn: { type: Array, default: () => [] }, // 表格字段参数
    selection: { type: Array, default: () => [] }, // 选中项数组
    uniqueKey: { type: String, default: 'uuid' }, // 选中项值字段，tableData 唯一值
    disabledChk: { type: Boolean, default: () => false } // 禁用所有复选框
  },
  data() {
    return {
      selected: []
    }
  },
  methods: {
    handleRightBtn(key, data, index) {
      this.$emit('clickHandler', key, data, index)
    },
    handleSelect(val) {
      let arr = []
      this.selected = val
      // console.log(selected)
      this._props.tableData.forEach((item) => {
        // console.log(item[props.uniqueKey])
        if (val.includes(item[this._props.uniqueKey])) arr.push(item)
        // console.log(arr)
        // arr = item
      })
      this.$emit('update:selection', arr)
    },
    computedNum(num, multiple) {
      return multiple ? num * multiple : num
    },
    clearItem(key) {
      let result = this._props.tableData.filter((item) => item.uuid !== key)
      // 同时如果清除的是选中的，那么选中的也要删除
      let newSelection = this._props.selection.filter((item) => item.uuid !== key)
      this.$emit('update:tableData', result)
      this.$emit('update:selection', newSelection)
    },
    inputNum(key, index) {
      this.$emit('inputNumHandler', key, index)
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

<style lang="scss" scoped>
.cutom_input {
  width: 100%;
  padding-left: 0;
  :deep(.van-cell__value) {
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
:deep(.van-notice-bar) {
  height: 24px;
  padding: 0;
}
</style>
