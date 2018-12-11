import Vue from 'vue'
import Router from 'vue-router'
import mainLayout from '@/mainLayout/mainLayout'
import currentProject from '@/components/currentProject'
Vue.use(Router);

export default new Router({
    routes: [
        {
            path: '/',
            name: 'mainLayout',
            component: mainLayout,
        },
        {
            path: '/currentProject',
            name:'currentProject',
            component:currentProject,
        }
    ]
})
