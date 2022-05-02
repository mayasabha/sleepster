import { createApp } from 'vue'

window.M = require('./vendor/materialize/materialize.min.js')

import '../css/materialize.min.css'

const app = createApp({})

app.component('client-component', require('./vue/components/client/ClientComponent.vue').default)

app.mount('#app')