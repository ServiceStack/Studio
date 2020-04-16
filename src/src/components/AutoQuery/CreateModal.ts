import { Vue, Component, Watch, Prop } from 'vue-property-decorator';
import {store, bus, client, exec, splitOnFirst, defaultValue} from '../../shared';
import {MetaAuthProvider, MetadataOperationType, MetadataType, SiteAuthenticate, SiteInvoke} from "../../shared/dtos";

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
                <error-summary :except="type.properties.map(x => x.name)" :responseStatus="responseStatus" />
            </div>        
            <div v-for="f in op.request.properties" :key="f.name" class="form-group">
                <v-input type="text" :id="f.name" v-model="model[f.name]" :placeholder="f.name" :responseStatus="responseStatus" 
                         :inputClass="['form-control-' + size]" />                
            </div>
            <div class="form-group text-right">
                <span class="btn btn-link" @click="$emit('done')">Close</span>
                <button type="submit" class="btn btn-primary btn-lg">Create {{type.name}}</button>
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
    
    get size() { return this.op.request.properties.length > 10 ? 'md' : 'lg'; } 

    async mounted() {
        console.log('CreateModal.mounted()');

        this.type.properties.forEach((f,i) => {
            this.$set(this.model, f.name, defaultValue(f));
        });
        
        this.$nextTick(() => {
           (document.querySelector('#createModal input:first-child') as HTMLInputElement)?.select(); 
        });
    }
    
    async submit() {
        await exec(this, async () => {
            console.log('CreateModal.submit()', this);
            
            var args = [];
            for (var k in this.model) {
                args.push(k);
                args.push(this.model[k]);
            }

            await client.post(new SiteInvoke({
                slug:this.slug,
                request:this.op.request.name,
                args
            }));
            
            this.$emit('done', this.model);
        });
    }
}
export default CreateModal;
Vue.component('create-modal', CreateModal);
