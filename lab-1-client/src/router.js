import Vue from 'vue'
import Router from 'vue-router'
import mainPage from './components/MainPage.vue'
import tableList from './components/TableList.vue'
import tableView from './components/TableView.vue'
import tableCreate from './components/TableCreate.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '',
      name: 'namePage',
      component: mainPage
    },
    {
      path: '/tablelist',
      name: 'tableList',
      component: tableList
    },
    {
      path: '/tableview/:tableName',
      props: true,
      name: 'tableView',
      component: tableView
    },
    {
      path: '/tablecreate',
      name: 'tablecreate',
      component: tableCreate
    },
    {
      path: '*',
      component: { template: '<h1>Page Not Found</h1>' }
    }
  ]
})
