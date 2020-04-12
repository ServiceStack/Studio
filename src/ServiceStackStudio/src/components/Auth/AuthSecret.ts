import { Vue, Component, Watch, Prop } from 'vue-property-decorator';
import {store, bus, client, exec} from '../../shared';
import {SiteAuthenticate} from "../../shared/dtos";
import {BearerToken} from "./BearerToken";
import {OAuthSecret} from "./OAuthSecret";
import {Credentials} from "./Credentials";
import {SessionId} from "./SessionId";

@Component({ template: 
    `<div v-if="enabled">
        <form ref="form" @submit.prevent="submit" :class="{ error:responseStatus, loading }" >
            <div class="form-group">
                <error-summary except="token" :responseStatus="responseStatus" />
            </div>
            <div class="form-group">
                <v-input id="token" v-model="token" placeholder="AuthSecret" :responseStatus="responseStatus" 
                         help="The configured AdminAuthSecret" />
                <a href="https://docs.servicestack.net/debugging#authsecret" class="lnk-help help-muted" target="_blank" title="help"></a>                                
            </div>
            <div class="form-group">
                <button type="submit" class="btn btn-lg btn-outline-primary">Login</button>
            </div>
        </form>
    </div>`,
})
export class AuthSecret extends Vue {
    @Prop({ default: null }) slug: string;

    loading = false;
    responseStatus = null;

    token = '';

    get app() { return store.getApp(this.slug); }

    get enabled() { return this.app && store.hasPlugin(this.slug, 'auth'); }

    protected async submit() {
        await exec(this, async () => {
            
            const response = await client.post(new SiteAuthenticate({
                slug: this.slug,
                provider: 'authsecret',
                accessToken: this.token,
            }));

            bus.$emit('appSession', { slug:this.slug, result:response });
            this.$emit('done');
        });
    }
}
export default AuthSecret;
Vue.component('auth-secret', AuthSecret);
