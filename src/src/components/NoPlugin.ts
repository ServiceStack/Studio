import { Vue, Component, Prop } from 'vue-property-decorator';
import {bus, log, store} from '../shared';

const messages:{[id:string]:string} = {
    auth: 'Auth',
    autoquery: 'AutoQuery',
};

//TODO: replace with component after we work out why it's not loading
export const siteError = (slug:string,plugin:string) => {
    const error = store.appErrors[slug];
    if (error) {
        return error.errorCode + ": " + error.message;
    }
    return '';
};


@Component({ template: 
    `<div>
        <div v-if="loading" class="noplugin-loading m-3">
            <i class="svg-loading svg-lg mr-1 mb-1" /> loading...
        </div>
        <div v-else>
             <div v-if="siteError" class="noplugin-error alert alert-danger m-3">
                <div>{{siteError.errorCode}}: {{siteError.message}}</div>
                <div v-if="siteError.stackTrace">
                    <button v-if="!showStackTrace" class="btn btn-link" style="margin-left: -1em" @click="showStackTrace=true">
                        <i class="svg-chevron-right svg-lg mb-1" title="expand" />StackTrace</button>
                    <div v-if="showStackTrace" class="stacktrace">{{siteError.stackTrace}}</div>
                </div>
            </div>
             <div v-else class="noplugin-error alert alert-danger m-3">
                {{errorMessage}}
            </div>
            <a href="/" class="ml-4">&lt; home</a>
        </div>
    </div>`
})
export class NoPlugin extends Vue {
    @Prop() slug: string;
    @Prop({ default: null }) plugin: string;
    @Prop({ default: null }) message?: string;
    showStackTrace = false;
    
    get siteError() { return store.appErrors[this.slug]; }
    get loading() { return store.appLoading[this.slug]; }
    
    get errorMessage() {
        return this.message || (messages[this.plugin] || 'This plugin') + ' is not enabled for this site';
    }
  
    protected mounted() {
        log('NoPlugin mounted()')
    }

    public static errorHtml(slug:string,plugin:string) {
        const loading = store.appLoading[slug];
        if (loading) {
            return (`<div class="noplugin-loading m-3">
                    <i class="svg-loading svg-lg mr-1 mb-1"></i> loading...
                </div>`);
        }
        
        const error = store.appErrors[slug];
        if (error) {
            return ('<div class="noplugin-error alert alert-danger m-3">' + error.errorCode + ": " + error.message + 
                (error.stackTrace ? '<div class="stacktrace">' + error.stackTrace + '</div>' : '') +
            '</div>');
        }
        return '<div class="noplugin-error alert alert-danger m-3">' + (messages[plugin] || 'This plugin') + ' is not enabled for this site' + '</div>';
    }
}
export default NoPlugin;
Vue.component('no-plugin', NoPlugin);
