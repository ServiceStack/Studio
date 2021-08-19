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
    postSiteInvoke, log, putSiteProxy, postSiteProxy, sanitizedModel, dtoAsArgs, initInlineModal
} from '../../shared';
import {
    AdminUpdateUser,
    MetaAuthProvider,
    MetadataOperationType,
    MetadataPropertyType,
    MetadataType,
    SiteAuthenticate,
    SiteInvoke, SiteProxy
} from "../../shared/dtos";
import {getField, humanize, nameOf, normalizeKey} from "@servicestack/client";

@Component({ template:
`<div id="editModal" class="modal-inline" tabindex="-1" role="dialog" @keyup.esc="$emit('done')" title="">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
            Edit {{type.name}}
        </h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" @click="$emit('done')"></button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="submit" :class="{ error:responseStatus, loading }" >
            <div class="mb-3">
                <error-summary :except="allProperties.map(x => x.name)" :responseStatus="responseStatus" />
            </div>        
            <div v-for="f in allProperties.filter(f => !f.isPrimaryKey)" :key="f.name" class="mb-3">
                <v-input-type :property="f" :model="model" :size="size" :responseStatus="responseStatus" />
            </div>
            <div class="mb-3 text-end">
                <span class="btn btn-link" @click="$emit('done')">close</span>
                <button v-if="allProperties.length > 0" type="submit" class="btn btn-primary">{{labelButton}}</button>
            </div>
            <div v-if="deleteOp" class="confirm-delete" style="margin:-54px 0 0 20px">
                <input id="chkDelete" type="checkbox" class="form-check-input" @change="confirmDelete=!confirmDelete"/> 
                <label for="chkDelete" class="form-check-label">confirm</label>
                <button class="btn btn-danger " @click.prevent="confirmDelete && deleteRow()" :disabled="!confirmDelete">Delete</button>
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
    @Prop({ default: null }) patchOp: MetadataOperationType;
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
    
    get allProperties() { return (this.updateOp ?? this.patchOp)?.request.properties ?? []; }
    
    get size() { return this.allProperties.length <= 10 ? 'lg' : 'md'; }
    
    get labelButton() { return this.type.name.length <= 13 ? `Update ${this.type.name}` : `Update` }

    humanize(s:string) { return humanize(s); }

    fieldValue(f:MetadataPropertyType) {
        return editValue(f,this.model[f.name]);
    }

    async mounted() {
        log('EditModal.mounted()', this.type, this.model, this.row, this.updateOp, this.patchOp);
        initInlineModal('#editModal');

        this.type.properties.forEach((f,i) => {
            this.$set(this.model, f.name, getField(this.row,f.name));
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
        if (!this.updateOp && !this.patchOp) return;
        await exec(this, async () => {
            const model = sanitizedModel(this.model);
            log(`EditModal.submit(${this.updateOp ? 'Update' : 'Patch'})`, model);

            if (this.updateOp) {
                await postSiteProxy(new SiteProxy({
                    slug:this.slug,
                    request:this.updateOp.request.name,
                }), model);
            } else {
                let dirtyValues:any = {};
                let resetFields:string[] = [];
                this.type.properties.forEach((f,i) => {
                    const origValue = getField(this.row,f.name);
                    if (f.isPrimaryKey) {
                        dirtyValues[f.name] = origValue;
                        return;
                    }
                    const newValue = this.model[f.name];
                    if (origValue !== newValue) {
                        if (newValue) {
                            dirtyValues[f.name] = newValue;
                        } else {
                            resetFields.push(f.name);
                        }
                    }
                });

                let query = resetFields.length > 0
                    ? dtoAsArgs({reset: resetFields})
                    : [];
                
                log(`PATCH ${this.patchOp.request.name}: `, dirtyValues, query);
                
                await putSiteProxy(new SiteProxy({
                    slug:this.slug,
                    request:this.patchOp.request.name,
                    query
                }), dirtyValues);
            }
            
            this.$emit('done', model);
        });
    }
}
export default EditModal;
Vue.component('edit-modal', EditModal);
