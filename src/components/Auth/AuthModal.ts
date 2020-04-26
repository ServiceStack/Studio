import { Vue, Component, Watch, Prop } from 'vue-property-decorator';
import {store, bus, client, exec, splitOnFirst, proxyUrl} from '../../shared';

@Component({ template: 
    `<div v-if="enabled" id="authModal" class="modal" tabindex="-1" role="dialog" style="display:block">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <div v-if="url">
                <h5 class="modal-title">
                    Session for <a :href="providerUrl" target="_blank">{{displayUrl}}</a>
                </h5>
            </div>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="$emit('done')">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <iframe id="auth-frame" v-if="url" :src="url" />
          </div>
        </div>
      </div>
    </div>`,
})
export class AuthModal extends Vue {
    @Prop({ default: null }) slug: string;
    @Prop({ default: null }) provider: string;

    loading = false;
    responseStatus = null;

    get app() { return store.getApp(this.slug); }

    get enabled() { return this.app && this.app.plugins.auth; }
    
    get providerUrl() { 
        return proxyUrl(this.provider ? `${this.app.app.baseUrl}/auth/${this.provider}` : this.app.app.baseUrl + '/auth?noredirect')
    }
    
    get displayUrl() { return splitOnFirst(this.providerUrl,'?')[0]; }
    
    get url() {
        const baseUrl = this.app.app.baseUrl;
        const suffix = this.provider ? '/' + this.provider + `?continue=${encodeURIComponent('/auth')}&` : '?';
        return proxyUrl(`${baseUrl}/auth${suffix}noredirect`);
    }

    protected mounted() {
        var iframe = document.querySelector('#auth-frame') as HTMLIFrameElement;
        window.addEventListener('message', (e) => {
            if (e.source == iframe?.contentWindow && e.data?.copy) {
                this.$emit('done', e.data.copy)
            }
        });
    }
}
export default AuthModal;
Vue.component('auth-modal', AuthModal);
