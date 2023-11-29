import { Toast } from 'vant'

/**
 * 失败提示工具
 * @param delay 延迟，默认5s
 */
const _showFailToast = (opt) => {
  Toast.fail({
    message: typeof opt === 'string' ? opt : opt.message,
    duration: typeof opt === 'string' ? 5 * 1000 : opt.duration
  })
}

const _showSuccessToast = (opt) => {
  Toast.success({
    message: typeof opt === 'string' ? opt : opt.message,
    duration: typeof opt === 'string' ? 5 * 1000 : opt.duration
  })
}
export { _showFailToast, _showSuccessToast }
