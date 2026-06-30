import { createApp } from 'vue'
import { createHead } from '@vueuse/head'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './styles/tokens.css'
import './styles/reset.css'
import './styles/global.css'
import './styles/prose.css'
import App from './App.vue'
import { router } from './router'

// ⚠️ 必须早于 app.mount()——ScrollTrigger 在 gsap.core 注册，
//   后续 gsap.from / gsap.to 自动识别 ScrollTrigger 配置
gsap.registerPlugin(ScrollTrigger)

const app = createApp(App)
const head = createHead()

app.use(head)
app.use(router)
app.mount('#app')