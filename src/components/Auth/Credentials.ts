import { Vue, Component, Watch, Prop } from 'vue-property-decorator';
import {store, bus, client, exec} from '../../shared';
import {SiteAuthenticate} from "../../shared/dtos";
import {OAuthSecret} from "./OAuthSecret";
import {SessionId} from "./SessionId";

@Component({ template: 
    `<div v-if="enabled">
        <form ref="form" @submit.prevent="submit" :class="{ error:responseStatus, loading }" >
            <div class="mb-3">
                <error-summary except="userName,password" :responseStatus="responseStatus" />
            </div>
            <div class="mb-3">
                <v-input id="userName" v-model="userName" placeholder="Username" :responseStatus="responseStatus" 
                        help="Username or Email you signed up with" />
            </div>
            <div class="mb-3">
                <v-input type="password" id="password" v-model="password" placeholder="Password" :responseStatus="responseStatus" />
            </div>
            <div class="mb-3">
                <button type="submit" class="btn btn-lg btn-outline-primary">Login</button>
            </div>
        </form>
    </div>`,
})
export class Credentials extends Vue {
    @Prop({ default: null }) slug: string;

    loading = false;
    responseStatus = null;

    userName = '';
    password = '';

    get app() { return store.getApp(this.slug); }

    get enabled() { return this.app && store.hasPlugin(this.slug, 'auth'); }

    protected async submit() {
        await exec(this, async () => {
            
            const response = await client.post(new SiteAuthenticate({
                slug: this.slug,
                provider: 'credentials',
                userName: this.userName,
                password: this.password,
                rememberMe: true,
            }));

            bus.$emit('appSession', { slug:this.slug, result:response });
            this.$emit('done');
        });
    }
}
export default Credentials;
Vue.component('credentials', Credentials);
