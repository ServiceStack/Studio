import { Vue, Component, Watch, Prop } from 'vue-property-decorator';
import {store, bus, client, exec} from '../../shared';
import {MetaAuthProvider, SiteAuthenticate} from "../../shared/dtos";
import {SessionId} from "./SessionId";

@Component({ template: 
    `<div v-if="enabled">
        <form ref="form" @submit.prevent="" :class="{ error:responseStatus, loading }" >
            <div class="form-group">
                <error-summary except="token" :responseStatus="responseStatus" />
            </div>
            <div class="form-group">
                <p class="text-muted">
                    1. Sign In
                </p>
                <div class="mb-3">
                    <button class="btn btn-outline-primary btn-sm mr-1" @click="showOAuthModal='session'">session</button>
                    <button v-for="x in iframeProviders" class="btn btn-outline-primary btn-sm mr-1" @click="showOAuthModal=x.name">{{x.name}}</button>
                </div>
                
                <auth-modal v-if="showOAuthModal" :slug="slug" :provider="oauthModalProvider" @done="modalDone" />
                
                <p class="text-muted">
                    2. Copy Session Id 
                    <span v-if="includesOAuthTokens">or OAuth AccessToken</span>
                </p>
                <ul v-if="tokenProvider" class="nav nav-pills mb-3" id="pills-tab" role="tablist">
                    <li class="nav-item btn-outline-secondary">
                        <span :class="['nav-link','btn-outline-secondary', {active:true}]">{{tokenProvider}}</span>
                    </li>
                </ul>
                <div v-if="tokenProvider" class="tab-content" id="pills-tabContent">
                    <div :class="['tab-pane', {active:true}]" id="pills-session" role="tabpanel">
                        <div class="form-group">
                            <v-input id="token" v-model="token" placeholder="Token" :responseStatus="responseStatus" />
                        </div>
                        <div class="form-group">
                            <button class="btn btn-lg btn-outline-primary" @click="submit">Login</button>
                        </div>
                    </div>
                </div>               
            </div>
        </form>
    </div>`,
})
export class OAuthSecret extends Vue {
    @Prop({ default: null }) slug: string;
    @Prop({ default: [] }) providers: MetaAuthProvider[];

    loading = false;
    responseStatus = null;

    showOAuthModal = '';
    tab = 'session';
    tokenProvider = '';
    token = '';
    
    get iframeProviders() { return this.providers.filter(x => x.meta && x.meta.allows?.indexOf('embed') >= 0); }
    
    get oauthModalProvider() { return this.showOAuthModal === 'session' ? '' : this.showOAuthModal; }
    
    get includesOAuthTokens() { return this.app.plugins.auth.includesOAuthTokens; }

    protected activeTab(tab:string) { return this.tab == tab; }

    get app() { return store.getApp(this.slug); }

    get enabled() { return this.app && this.app.plugins.auth; }

    protected modalDone(e:any) {
        if (e && Object.keys(e).length == 1) {
            this.tokenProvider = Object.keys(e)[0];
            this.token = e[this.tokenProvider];
            if (this.tokenProvider === 'sessionid') {
                this.tokenProvider = 'session';
            }
        }
        this.showOAuthModal = '';
    }

    protected async submit() {
        if (!(this.tokenProvider && this.token)) {
            return;
        }
        await exec(this, async () => {

            const response = await client.post(new SiteAuthenticate({
                slug: this.slug,
                provider: this.tokenProvider,
                accessToken: this.token,
            }));

            bus.$emit('appSession', { slug:this.slug, result:response });
            this.$emit('done');
        });
    }
}
export default OAuthSecret;
Vue.component('oauth-secret', OAuthSecret);
