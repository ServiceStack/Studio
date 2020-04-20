import { Vue, Component, Watch, Prop } from 'vue-property-decorator';
import {
    store,
    bus,
    client,
    exec,
    splitOnFirst,
    defaultValue,
    editValue,
    deleteSiteInvoke,
    postSiteInvoke, log
} from '../../shared';
import {
    MetaAuthProvider,
    MetadataOperationType,
    MetadataPropertyType,
    MetadataType,
    SiteAuthenticate,
    SiteInvoke
} from "../../shared/dtos";
import {getField, normalizeKey} from "@servicestack/client";

@Component({ template:
`<div id="editModal" class="modal-inline" tabindex="-1" role="dialog" @keyup.esc="$emit('done')" title="">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
            Edit {{type.name}}
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
            <div v-for="f in type.properties" :key="f.name" class="form-group">
                <span v-if="!updateOp || f.isPrimaryKey" :class="['disabled',size,'ml-2']">{{fieldValue(f)}}</span>
                <v-input v-else type="text" :id="f.name" v-model="model[f.name]" :placeholder="f.name" :responseStatus="responseStatus" 
                         :inputClass="['form-control-' + size]" :help="f.name" />                
            </div>
            <div class="form-group text-right">
                <span v-if="deleteOp" :class="['confirm-delete',size]">
                    <input id="chkDelete" type="checkbox" class="form-check-input" @change="confirmDelete=!confirmDelete"/> 
                    <label for="chkDelete" class="form-check-label">confirm</label>
                    <button class="btn btn-danger " @click.prevent="confirmDelete && deleteRow()" :disabled="!confirmDelete">Delete</button>
                </span>
                <span class="btn btn-link" @click="$emit('done')">Close</span>
                <button type="submit" class="btn btn-primary btn-lg">{{labelButton}}</button>
            </div>
        </form>
      </div>
    </div>
  </div>
</div>`,
})
export class EditModal extends Vue {
    @Prop({ default: null }) slug: string;
    @Prop({ default: null }) updateOp: MetadataOperationType;
    @Prop({ default: null }) deleteOp: MetadataOperationType;
    @Prop({ default: null }) type: MetadataType;
    @Prop({ default: null }) field: string;
    @Prop({ default: null }) row: any;

    value = '';
    model:{[id:string]:string} = {};
    confirmDelete = false;
    
    loading = false;
    responseStatus = null;

    get app() { return store.getApp(this.slug); }

    get enabled() { return this.app && this.app.plugins.autoQuery; }
    
    get size() { return (this.updateOp || this.deleteOp)?.request.properties.length > 10 ? 'md' : 'lg'; }
    
    get labelButton() { return this.type.name.length <= 13 ? `Update ${this.type.name}` : `Update` }

    fieldValue(f:MetadataPropertyType) {
        return editValue(f,this.model[f.name]);
    }

    async mounted() {
        log('CreateModal.mounted()');

        this.type.properties.forEach((f,i) => {
            this.$set(this.model, f.name, editValue(f, getField(this.row,f.name)));
        });
        
        this.$nextTick(() => {
           (document.querySelector('#createModal input:first-child') as HTMLInputElement)?.select(); 
        });
    }
    
    async deleteRow() {
        const pk = this.type.properties.find(x => x.isPrimaryKey);
        const pkValue = pk && getField(this.row, pk.name);

        await exec(this, async () => {
            log('EditModal.deleteRow()');

            if (!pkValue) 
                throw { errorCode:'InvalidState', message:"Could not resolve Primary Key"};

            let args:any[] = [pk!.name, pkValue];
            
            await deleteSiteInvoke(new SiteInvoke({
                slug:this.slug,
                request:this.deleteOp.request.name,
                args
            }));

            this.$emit('done', this.model);
        });
    }
    
    async submit() {
        await exec(this, async () => {
            log('EditModal.submit()', this);
            
            var args = [];
            for (var k in this.model) {
                args.push(k);
                args.push(this.model[k]);
            }

            await postSiteInvoke(new SiteInvoke({
                slug:this.slug,
                request:this.updateOp.request.name,
                args
            }));
            
            this.$emit('done', this.model);
        });
    }
}
export default EditModal;
Vue.component('edit-modal', EditModal);
