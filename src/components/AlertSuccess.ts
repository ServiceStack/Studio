import {Component, Prop, Vue, Watch} from 'vue-property-decorator';

@Component({ template: 
`<div v-if="message" class="alert alert-success">{{message}} <i class="svg svg-lg done-success"></i></div>`
})
export class AlertSuccess extends Vue {
    @Prop({ default: null }) message: string;
}
export default AlertSuccess;
Vue.component('alert-success', AlertSuccess);