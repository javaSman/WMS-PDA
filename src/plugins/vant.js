// 按需全局引入 vant组件
import 'vant/lib/index.css' // 引入全部样式
import 'vant/lib/icon/local.css'
import '@/styles/index.scss' // 自定义全局样式-需要在vant引入后导入
import Vue from 'vue'
import {
  Button,
  NavBar,
  Form,
  Field,
  Toast,
  Popup,
  Picker,
  List,
  Dialog,
  Tag,
  Calendar,
  SwipeCell,
  Image as VanImage,
  Cell,
  CellGroup,
  RadioGroup,
  Radio,
  Checkbox,
  CheckboxGroup,
  Tabbar,
  TabbarItem,
  Grid,
  GridItem,
  Col,
  Row,
  Empty,
  ActionSheet,
  Search,
  Icon,
  Badge,
  Stepper,
  Pagination
} from 'vant'

Vue.use(Button)
  .use(NavBar)
  .use(Form)
  .use(Field)
  .use(VanImage)
  .use(Cell)
  .use(CellGroup)
  .use(Tabbar)
  .use(TabbarItem)
  .use(Grid)
  .use(GridItem)
  .use(Toast)
  .use(Popup)
  .use(Picker)
  .use(List)
  .use(Dialog)
  .use(Tag)
  .use(Calendar)
  .use(SwipeCell)
  .use(Radio)
  .use(RadioGroup)
  .use(Checkbox)
  .use(CheckboxGroup)
  .use(Col)
  .use(Row)
  .use(Empty)
  .use(ActionSheet)
  .use(Search)
  .use(Icon)
  .use(Badge)
  .use(Stepper)
  .use(Pagination)

// toast展示时长调整-默认2000
Toast.setDefaultOptions({ duration: 1000 })
