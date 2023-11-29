<template>
  <div ref="views_container" class="list">
    <van-checkbox-group v-model="_selection">
      <div v-for="(item, index) in tableData" :key="item.uuid" class="list_item">
        <div v-for="column in tableColumn" :key="column.prop" class="row">
          <div class="label">{{ column.label }}</div>
          <div class="result">
            <input
              v-if="column.type === 'Table/Input'"
              :ref="column.prop + '_' + index"
              v-model="item[column.prop]"
              class="table_input"
              :placeholder="`请输入${column.label}`"
              @keyup.enter="(e) => inputText(column.prop, index)"
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
</template>

<script>
export default {
  name: 'NativeTable',
  props: {
    // 列表数据
    tableData: {
      type: Array,
      default: () => []
    },
    tableColumn: {
      type: Array,
      default: () => []
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
  methods: {
    inputText(key, index) {
      this.$emit('inputTextHandler', key, index)
    }
  }
}
</script>

<style lang="scss" scoped>
.list {
  position: relative;
  font-size: 14px;
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
</style>
