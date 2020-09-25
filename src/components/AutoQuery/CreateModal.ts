import { Vue, Component, Watch, Prop } from 'vue-property-decorator';
import {
    store,
    bus,
    client,
    exec,
    splitOnFirst,
    defaultValue,
    postSiteInvoke,
    log,
    postSiteProxy,
    sanitizedModel
} from '../../shared';
import {
    MetaAuthProvider,
    MetadataOperationType,
    MetadataType,
    SiteAuthenticate,
    SiteInvoke,
    SiteProxy
} from '../../shared/dtos';
import { humanize } from '@servicestack/client';

@Component({ template:
`<div id="createModal" class="modal-inline" tabindex="-1" role="dialog" @keyup.esc="$emit('done')">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
            New {{type.name}}
        </h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="$emit('done')">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="submit" :class="{ error:responseStatus, loading }" >
            <div class="form-group">
                <error-summary :except="allProperties.map(x => x.name)" :responseStatus="responseStatus" />
            </div>        
            <div v-for="f in allProperties" :key="f.name" class="form-group">
                <v-input-type :property="f" :model="model" :size="size" :responseStatus="responseStatus" />
            </div>
            <div class="form-group text-right">
                <span class="btn btn-link" @click="$emit('done')">Close</span>
                <button type="submit" class="btn btn-primary">Create {{type.name}}</button>
            </div>
        </form>
      </div>
    </div>
  </div>
</div>`,
})
export class CreateModal extends Vue {
    @Prop({ default: null }) slug: string;
    @Prop({ default: null }) op: MetadataOperationType;
    @Prop({ default: null }) type: MetadataType;

    value = '';
    model:{[id:string]:string} = {};
    
    loading = false;
    responseStatus = null;

    get app() { return store.getApp(this.slug); }

    get enabled() { return this.app && this.app.plugins.autoQuery; }

    get allProperties() { return store.getTypeProperties(this.slug, this.type); }

    get size() { return this.allProperties.length <= 10 ? 'lg' : 'md'; }

    humanize(s:string) { return humanize(s); }

    async mounted() {
        log('CreateModal.mounted()', this.op);

        this.type.properties.forEach((f,i) => {
            this.$set(this.model, f.name, defaultValue(f));
        });
        
        this.$nextTick(() => {
           (document.querySelector('#createModal input:first-child') as HTMLInputElement)?.select(); 
        });
    }
    
    async submit() {
        await exec(this, async () => {
            const model = sanitizedModel(this.model);
            log('CreateModal.submit()', model);

            await postSiteProxy(new SiteProxy({
                slug:this.slug,
                request:this.op.request.name,
            }), model);

            
            this.$emit('done', model);
        });
    }
}
export default CreateModal;
Vue.component('create-modal', CreateModal);
