import { Vue, Component, Watch, Prop } from 'vue-property-decorator';
import {store, bus, client, exec} from '../../shared';
import {SiteAuthenticate} from "../../shared/dtos";
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
                <v-input id="token" v-model="token" placeholder="Bearer Token" :responseStatus="responseStatus" 
                         help="Any BearerToken Auth Providers, e.g. JWT or API Key" />
            </div>
            <div class="form-group">
                <button type="submit" class="btn btn-lg btn-outline-primary">Login</button>
            </div>
        </form>
    </div>`,
})
export class BearerToken extends Vue {
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
                provider: 'bearer',
                accessToken: this.token,
            }));

            bus.$emit('appSession', { slug:this.slug, result:response });
            this.$emit('done');
        });
    }
}
export default BearerToken;
Vue.component('bearer-token', BearerToken);
