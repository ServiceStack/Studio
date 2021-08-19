import { Vue, Component, Watch, Prop } from 'vue-property-decorator';
import {store, bus, client, exec, log} from '../../shared';
import {SiteAuthenticate } from "../../shared/dtos";
import {adminUsersRoute, autoQueryRoute, Routes, validationRoute} from "../../shared/router";

@Component({ template: 
    `<div v-if="enabled">
        <button v-if="!session && !loading" @click="showAuthDialog=true" class="btn btn-outline-primary">
            Sign In
        </button>
        <span v-if="session">
        
            <div class="btn-group" role="group">
                <button v-if="feature != 'adminusers'" class="btn btn-light btn-sm" @click="goto('adminusers')"
                        title="Go to Admin Users"><i class="users-link svg-lg"/></button>
                <button v-if="feature != 'autoquery'" class="btn btn-light btn-sm" @click="goto('autoquery')"
                        title="Go to AutoQuery"><i class="db-link svg-lg"/></button>
                <button v-if="feature != 'validation'" class="btn btn-light btn-sm" @click="goto('validation')"
                        title="Go to Validation"><i class="lock-link svg-lg"/></button>
                <button v-if="prefsDirty || loading" @click="savePrefs()" title="Save Preferences" 
                        class="btn btn-light btn-sm"><i :class="(loading ? 'svg-loading' : 'save-link') + ' svg-lg'" /></button>            
                <div class="btn-group" role="group">
                    <button @click="showUserPopup=!showUserPopup" id="btnGroupDrop1" type="button" class="btn btn-light dropdown-toggle">
                        <img v-if="session.profileUrl" :src="session.profileUrl" class="sq-lg me-1 mb-1">
                        <i v-else class="svg-auth svg-2x mb-1" />
                        {{session.displayName || session.userName || session.email}}
                    </button>
                    <div :class="['dropdown-menu',{show:showUserPopup}]" style="top:45px;left:auto">
                        <a class="dropdown-item" href="javascript:void(0)" @click="logout()">Sign Out</a>
                    </div>            
                </div>
            </div>
        
        </span>
        <div v-if="showAuthDialog" id="signInModal" class="modal" tabindex="-1" role="dialog" 
             :style="{ display:showAuthDialog?'block':'none', background:'rgba(0,0,0,.25)'}">
          <div class="modal-dialog" role="document">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Sign into {{ appInfo.serviceName }}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" @click="showAuthDialog=false"></button>
              </div>
              <div class="modal-body">
                <ul class="nav nav-pills mb-3" id="pills-tab" role="tablist">
                    <li class="nav-item" v-if="hasProvider('credentials')" @click="tab='credentials'">
                        <span :class="['nav-link', {active:activeTab('credentials')}]">Credentials</span>
                    </li>
                    <li class="nav-item" v-if="hasOAuth" @click="tab='oauth'">
                        <span :class="['nav-link', {active:activeTab('oauth')}]">OAuth</span>
                    </li>
                    <li class="nav-item" v-if="hasBearer" @click="tab='Bearer'">
                        <span :class="['nav-link', {active:activeTab('Bearer')}]">Token</span>
                    </li>
                    <li class="nav-item" v-if="hasSession" @click="tab='session'">
                        <span :class="['nav-link', {active:activeTab('session')}]">Session</span>
                    </li>
                    <li class="nav-item" v-if="hasAuthSecret" @click="tab='authsecret'">
                        <span :class="['nav-link', {active:activeTab('authsecret')}]">AuthSecret</span>
                    </li>
                </ul>
                <div class="tab-content" id="pills-tabContent">
                    <div v-if="hasProvider('credentials')" :class="['tab-pane', {active:activeTab('credentials')}]" id="pills-credentials" role="tabpanel">
                        <credentials :slug="slug" @done="showAuthDialog=false" />
                    </div>
                    <div v-if="hasOAuth" :class="['tab-pane', {active:activeTab('oauth')}]" id="pills-oauth" role="tabpanel">
                        <oauth-secret :slug="slug" :providers="oauthProviders" @done="showAuthDialog=false" />
                    </div>
                    <div v-if="hasBearer" :class="['tab-pane', {active:activeTab('Bearer')}]" id="pills-bearer" role="tabpanel">
                        <bearer-token :slug="slug" @done="showAuthDialog=false" />
                    </div>
                    <div v-if="hasSession" :class="['tab-pane', {active:activeTab('session')}]" id="pills-session" role="tabpanel">
                        <session-id :slug="slug" @done="showAuthDialog=false" />
                    </div>
                    <div v-if="hasAuthSecret" :class="['tab-pane', {active:activeTab('authsecret')}]" id="pills-authsecret" role="tabpanel">
                        <auth-secret :slug="slug" @done="showAuthDialog=false" />
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>        
    </div>`,
})
export class Auth extends Vue {

    @Prop({ default: null }) slug: string;
    @Prop({ default: null }) feature: string;
    @Prop({ default: null }) op?: string;

    loading = false;
    responseStatus = null;

    showAuthDialog = false;
    showUserPopup = false;
    tab = '';
    userName = '';
    password = '';
    rememberMe = true;

    get store() { return store; }
    
    get site() { return store.getSite(this.slug); }

    get app() { return store.getApp(this.slug); }

    get appInfo() { return store.getApp(this.slug).app; }

    get enabled() { return this.app && store.hasPlugin(this.slug, 'auth'); }

    get plugin() { return this.app?.plugins.auth; }
    
    get session() { return store.getSession(this.slug); }
    
    get prefsDirty() { return store.isDirty(this.slug); }
    
    goto(feature:string) {
        switch (feature) {
            case 'adminusers':
                this.$router.push(adminUsersRoute(this.slug, null));
                break;
            case 'autoquery':
                this.$router.push(autoQueryRoute(this.slug, this.op ? { op:this.op} : null));
                break;
            case 'validation':
                this.$router.push(validationRoute(this.slug, this.op ? { op:this.op} : null));
                break;
        }
    }
    
    get authProviders() { 
        return this.plugin?.authProviders || []; 
    }
    
    get tabActive() { return this.authProviders[0]?.name; }
    
    activeTab(tab:string) { 
        return this.tab ? this.tab == tab : this.authProviders[0]?.type == tab; 
    }
    
    hasProvider(provider:string) { return this.authProviders.some(x => x.name == provider); }

    get hasBearer() { return this.authProviders.some(x => x.type == 'Bearer'); }

    get hasOAuth() { return this.authProviders.some(x => x.type == 'oauth'); }

    get oauthProviders() { return this.authProviders.filter(x => x.type == 'oauth'); }

    get hasSession() { return this.authProviders.some(x => x.type == 'session' || x.type == 'credentials' || x.type == 'oauth'); }

    get hasAuthSecret() { return this.plugin.hasAuthSecret; }
    
    modalKeyDown(e:KeyboardEvent) {
        if (this.showAuthDialog && e.key == "Escape") {
            this.showAuthDialog = false;
            return;
        }
        if (e.ctrlKey && e.key === "s") {
            this.savePrefs();
            e.preventDefault();
            return;
        }
    }
    
    beforeDestroy() {
        window.removeEventListener('keydown', this.modalKeyDown);
    }

    async mounted() {
        window.addEventListener('keydown', this.modalKeyDown);
        bus.$on('signin', () => {
            log('signin', this.session);
            if (!this.session) {
               this.showAuthDialog = true;
            } 
        });
        
        await exec(this, async () => {
            if (this.app && !this.session)
            {
                try {
                    const response = await client.post(new SiteAuthenticate({
                        slug: this.slug,
                    }));
                    bus.$emit('appSession', { slug:this.slug, result:response });
                } catch (e) {
                    bus.$emit('appSession', { slug:this.slug, result:null });
                    throw e;
                }
            }
        });
    }

    savePrefs() {
        this.loading = true;
        setTimeout(() => this.loading = false, 300);
        bus.$emit('savePrefs', { slug:this.slug });
    }
    
    async logout() {
        await exec(this, async () => {
            const response = await client.post(new SiteAuthenticate({
                slug: this.slug,
                provider: 'logout',
            }));
            bus.$emit('savePrefs', { slug:this.slug, callback:() => {
                bus.$emit('signout', { slug:this.slug });
                this.showUserPopup = false;
            } });
        });
    }
}
export default Auth;
Vue.component('auth', Auth);
