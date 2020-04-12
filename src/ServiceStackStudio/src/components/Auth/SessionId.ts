import { Vue, Component, Watch, Prop } from 'vue-property-decorator';
import {store, bus, client, exec} from '../../shared';
import {SiteAuthenticate} from "../../shared/dtos";

@Component({ template: 
    `<div v-if="enabled">
        <form ref="form" @submit.prevent="submit" :class="{ error:responseStatus, loading }" >
            <div class="form-group">
                <error-summary except="token" :responseStatus="responseStatus" />
            </div>
            <div class="form-group">
                <span v-if="!hideViewSession" class="btn btn-sm btn-outline-primary mb-2" @click="showSessionModal=!showSessionModal">view session</span>
                <auth-modal v-if="showSessionModal" :slug="slug" @done="modalDone" />
                <v-input id="token" v-model="token" placeholder="Session Id" :responseStatus="responseStatus" 
                         help="Copy your Authenticated Session Id" />
            </div>
            <div class="form-group">
                <button type="submit" class="btn btn-lg btn-outline-primary">Login</button>
            </div>
        </form>
    </div>`,
})
export class SessionId extends Vue {
    @Prop({ default: null }) slug: string;
    @Prop({ default: false }) hideViewSession: boolean;

    showSessionModal = false;
    loading = false;
    responseStatus = null;

    token = '';

    get app() { return store.getApp(this.slug); }

    get enabled() { return this.app && store.hasPlugin(this.slug, 'auth'); }
    
    protected modalDone(e:any) {
        this.token = e && e.sessionid || '';
        this.showSessionModal = false;
    }

    protected async submit() {
        await exec(this, async () => {
            
            const response = await client.post(new SiteAuthenticate({
                slug: this.slug,
                provider: 'session',
                accessToken: this.token,
            }));

            bus.$emit('appSession', { slug:this.slug, result:response });
            this.$emit('done');
        });
    }
}
export default SessionId;
Vue.component('session-id', SessionId);
