import { Vue, Component, Watch, Prop } from 'vue-property-decorator';
import {store, bus, client, exec, splitOnFirst} from '../../shared';
import {MetaAuthProvider, MetadataType, SiteAuthenticate} from "../../shared/dtos";
import {getField} from "@servicestack/client";

@Component({ template:
`<div id="createModal" class="modal-mini" tabindex="-1" role="dialog" :style="modalStyle">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <div v-if="url">
            <h5 class="modal-title">
                Create {{type.name}}
            </h5>
        </div>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="$emit('done')">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="submit" :class="{ error:responseStatus, loading }" >
            <div class="form-group">
                <error-summary :except="type.properties(x => x.name)" :responseStatus="responseStatus" />
            </div>        
            <div v-for="f in type.properties" :key="f.name" class="form-group">
                <v-input type="text" :id="f.name" v-model="model[f.name]" placeholder="Password" :responseStatus="responseStatus" 
                        label="Password"  help="6 characters or more" />                
            </div>
            <div class="form-group">
                <button class="btn btn-link" @click="$emit('done')">Close</button>
                <button type="submit" class="btn btn-lg btn-primary">Create {{type.name}}</button>
            </div>
        </form>
      </div>
    </div>
  </div>
</div>`,
})
export class CreateModal extends Vue {
    @Prop({ default: null }) slug: string;
    @Prop({ default: null }) type: MetadataType;
    @Prop({ default: null }) row: any;
    @Prop({ default: null }) field: string;

    value = '';
    model = {};
    
    loading = false;
    responseStatus = null;

    get app() { return store.getApp(this.slug); }

    get enabled() { return this.app && this.app.plugins.autoQuery; }

    async mounted() {
        console.log('CreateModal.mounted()');
    }
    
    async submit() {
        await exec(this, async () => {
            console.log('CreateModal.submit()');
        });
    }
}
export default CreateModal;
Vue.component('create-modal', CreateModal);
