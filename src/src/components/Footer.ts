import { Component, Prop, Vue } from 'vue-property-decorator';
import {store, collapsed, argsAsKvps} from '../shared';

@Component({ template: 
    `<footer id="footer" v-if="!collapsed('footer')">
        <i class="text-close" title="close" @click="hideView('footer')"/>
        <div id="panels">
            <div v-for="x in logEntries" class="log-entry">
                <div v-if="x.invoke" class="invoke">
                    <h4><i>{{x.method}}</i><b>{{x.invoke.request}}</b></h4>
                    <div class="body">
                        <dl v-for="x in kvps(x.invoke.args)">
                            <dt>{{x.key}}</dt>
                            <dd>{{x.value}}</dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    </footer>
    <div v-else id="output-group">
        <button class="btn btn-outline-secondary btn-sm" @click="showView('footer')">output</button>        
    </div>`
})
export class Footer extends Vue {
    @Prop() slug: string;
    
    get store() { return store; }
    
    get views() { return this.store.getAppPrefs(this.slug).views || []; }
    
    set views(val) { Vue.set(this.store.getAppPrefs(this.slug), 'views', val); }
    
    collapsed(view:string) { return collapsed(this.slug, view); }

    kvps(args:string[]) { return argsAsKvps(args); }
    
    showView(view:string) {
        this.views = [...this.views, view];
    }
    hideView(view:string) {
        this.views = this.views.filter(x => x != view);
    }
    
    get logEntries() { return this.store.appLogEntries[this.slug] || []; }
}
Vue.component('Footer', Footer);
