import { createApp } from 'vue'
import { createHead } from '@vueuse/head'
import './styles/tokens.css'
import './styles/reset.css'
import './styles/global.css'
import './styles/prose.css'
import App from './App.vue'
import { router } from './router'

const app = createApp(App)
const head = createHead()

app.use(head)
app.use(router)
app.mount('#app')