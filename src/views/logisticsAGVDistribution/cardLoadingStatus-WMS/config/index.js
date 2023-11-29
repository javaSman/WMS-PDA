import { Box } from '@/views/dict'
export const formList = [
  { type: 'Input', label: '卡板', prop: 'boxNo', rules: [{ required: true, message: '请输入卡板', trigger: 'onBlur' }] },
  { type: 'Input', label: '当前卡板状态', prop: 'dqstatus', disabled: true },
  { type: 'Dropdown', label: '更新载具装载状态', prop: 'status', options: Box, rules: [{ required: true, message: '请选择载具装载状态', trigger: 'onBlur' }] }
]
