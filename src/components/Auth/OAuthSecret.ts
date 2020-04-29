import { Vue, Component, Watch, Prop } from 'vue-property-decorator';
import {store, bus, client, exec, splitOnFirst, log, openUrl} from '../../shared';
import {MetaAuthProvider, SiteAuthenticate} from "../../shared/dtos";
import {clipboard, sendToForeground} from '@servicestack/desktop';

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
                    <button v-for="x in authProviders" class="btn btn-outline-primary btn-sm mr-1" @click="showProvider(x.name)">{{x.name}}</button>
                </div>
                
                <auth-modal v-if="showOAuthModal" :slug="slug" :provider="oauthModalProvider" @done="modalDone" />
                
                <p class="text-muted">
                    2. Copy Session Id 
                    <span v-if="includesOAuthTokens">or OAuth AccessToken</span>
                </p>
                
                <ul class="nav nav-pills mb-3" id="pills-tab" role="tablist">
                    <li class="nav-item btn-outline-secondary" @click="selectedProvider='session'">
                        <span :class="['nav-link','btn-outline-secondary', {active:selectedProvider=='session'}]">sessionId</span>
                    </li>
                    <li v-if="tokenProvider != 'session'" class="nav-item btn-outline-secondary" @click="selectedProvider=tokenProvider">
                        <span :class="['nav-link','btn-outline-secondary', {active:selectedProvider==tokenProvider}]">{{tokenProvider}}</span>
                    </li>
                </ul>
                <div class="tab-content">
                    <div :class="['tab-pane', {active:selectedProvider=='session'}]" role="tabpanel">
                        <div class="form-group">
                            <v-input id="sessionId" v-model="sessionId" placeholder="Session Id" :responseStatus="responseStatus" />
                        </div>
                    </div>
                    <div v-if="tokenProvider != 'session'" :class="['tab-pane', {active:selectedProvider==tokenProvider}]" role="tabpanel">
                        <div class="form-group">
                            <v-input id="token" v-model="token" placeholder="Token" :responseStatus="responseStatus" />
                        </div>
                    </div>
                    <div class="form-group">
                        <button class="btn btn-lg btn-outline-primary" @click="submit" :disabled="loading">Login</button>
                        <i v-if="loading" class="svg-loading svg-lg ml-2"></i>
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
    tokenProvider = 'session';
    selectedProvider = 'session';
    token = '';
    sessionId = '';
    originalClip = '';
    monitorClip = false;
    
    get authProviders() { return [{name:'session'}, ...this.providers.filter(x => x.type == 'oauth')]; }

    async showProvider(provider:string) {
        this.monitorClip = false;
        this.tokenProvider = provider;

        const authUrl = provider == 'session'
            ? '/auth?noredirect&copy=session'
            : `/auth/${provider}?continue=` + encodeURIComponent(`/auth?noredirect&copy=session,${provider}`);
        
        await openUrl(this.app.app.baseUrl + authUrl);

        if (store.desktop) {
            this.selectedProvider = this.tokenProvider;
            this.monitorClip = true;
            this.originalClip = await clipboard();
            log('monitorClipboard originalClip: ' + this.originalClip);
            await this.monitorClipboard();
        }
    }
    
    async monitorClipboard() {
        const currentClip = await clipboard();
        if (currentClip && currentClip != this.originalClip) {
            this.monitorClip = false;
            if (currentClip.length < 25) {
                this.selectedProvider = 'session';
                this.sessionId = currentClip;
            } else {
                this.selectedProvider = this.tokenProvider;
                this.token = currentClip;
            }
            let success = await sendToForeground('browser');
            log(`monitorClipboard copy detected: '${currentClip}', sendToForeground: ${success}`);
            await this.submit();
        }
        
        if (this.monitorClip)
            setTimeout(() => this.monitorClipboard(), 200);
    }
    
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
        this.monitorClip = false;
        if (!this.sessionId && !this.token) {
            return;
        }
        await exec(this, async () => {

            const response = await client.post(new SiteAuthenticate({
                slug: this.slug,
                provider: this.selectedProvider,
                accessToken: this.selectedProvider == 'session' ? this.sessionId : this.token,
            }));

            bus.$emit('appSession', { slug:this.slug, result:response });
            this.$emit('done');
        });
    }
}
export default OAuthSecret;
Vue.component('oauth-secret', OAuthSecret);
