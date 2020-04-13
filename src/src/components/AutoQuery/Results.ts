import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import {store, bus, exec, client, canAccess} from '../../shared';
import {MetadataOperationType, MetadataType, SiteInvoke} from "../../shared/dtos";
import {humanize, normalizeKey, toDate, toDateFmt, getField} from "@servicestack/client";
import {Route} from "vue-router";

@Component({ template:
        `<a v-if="isUrl" :href="value" target="_blank">{{url}}</a>
     <i v-else-if="lower == 'false'" class="svg svg-md bool-off-muted"></i>
     <i v-else-if="lower == 'true'" class="svg svg-md bool-on-muted"></i>
     <span v-else>{{format}}</span>
`})
class FormatString extends Vue {
    @Prop({ default: '' }) public value: any;

    get lower() { return `${this.value}`.toLowerCase(); }
    get isUrl() { return typeof this.value == "string" && this.value.startsWith('http'); }
    get url() { return typeof this.value == "string" && this.value.substring(this.value.indexOf('://') + 3); }
    get format(){ return typeof this.value == "string" && this.value.startsWith('/Date') ? toDateFmt(this.value) : this.value; }
}
Vue.component('format', FormatString);

// <partial-modal v-if="isEditing(i,j)" :x="editingField[2]" :y="editingField[3]" :slug="slug" :type="type" :row="r" :field="f" @done="editingField=null" />

@Component({ template:
`<div v-if="results.length">
    <table class="results">
        <thead><tr class="noselect">
            <th v-if="crud.length">
                <i v-if="!session" class="svg svg-btn svg-auth svg-md" title="Sign In to Edit" @click="bus.$emit('signin')" />
                <i v-else-if="hasCrud(['Create'])" class="svg svg-btn svg-create svg-md" :title="createLabel" @click="showCreate=true"/>
            </th>
            <th v-for="f in fieldNames" :key="f" :class="{partial:isPartialField(f)}">
                {{ humanize(f) }}
            </th>
            <th v-if="plugin.crudEvents">
                <i class="svg svg-history history-muted svg-md" title="Event History" />
            </th>
        </tr></thead>
        <tbody>
            <tr v-for="(r,i) in results" :key="i">
                <td v-if="crud.length">
                    <span v-if="hasCrud(['Update','Patch','Delete'])">
                        <i v-if="session" class="svg svg-btn svg-update svg-sm" :title="updateLabel" />
                        <i v-else class="svg svg-btn svg-auth auth-warning svg-md" title="Sign In" @click="bus.$emit('signin')" />
                    </span>
                </td>
                <td v-for="(f,j) in fieldNames" :key="j" :title="renderValue(getField(r,f))" :class="{partial:isPartialField(f),editing:isEditing(i,j)}" 
                    @dblclick="isPartialField(f) && editField(i,j,$event)">                
                    <span v-if="i==0 && j==0 && (showCreate || showUpdate)">
                        <create-modal :slug="slug" :type="type" :row="r" :field="f" />
                    </span>
                    <div v-else-if="isEditing(i,j)">                        
                        <input v-model="editingValue" class="form-control form-control-sm" 
                               @keyup.enter="saveEdit()" @keyup.esc="cancelEdit()" />                
                        <i v-if="dirty" class="svg done-success svg-md svg-btn" title="save" @click="saveEdit()" style="float:right;margin:-27px 5px 0 0;"/>
                    </div>
                    <format v-else :value="getField(r,f)" />
                </td>
                <td v-if="plugin.crudEvents">
                    <i class="svg svg-history history-muted svg-btn svg-md" title="Event History" />
                </td>
            </tr>
        </tbody>
    </table>
    <error-view :responseStatus="responseStatus" />
</div>
<div v-else class="results-none">There were no results</div>`,
})
export class Results extends Vue {
    @Prop({ default: '' }) public slug: string;
    @Prop() public results: any[];
    @Prop() public type: MetadataType;
    @Prop({ default:[] }) public crud: MetadataOperationType[];

    loading = false;
    responseStatus:any = null;

    showCreate = false;
    showUpdate = false;
    editingValue = '';
    editingField:number[]|null = null;

    @Watch('$route', { immediate: true, deep: true })
    async onUrlChange(newVal: Route) {
        this.resetEdit();
}
    
    get bus() { return bus; }
    get store() { return store; }
    get session() { return store.getSession(this.slug); }

    get plugin() { return store.getApp(this.slug).plugins.autoQuery; }

    get fields() { return this.type.properties; }
    get fieldNames() { return this.type.properties.map(x => x.name); }
    
    isPartialField(f:string) {
        return this.partialFields.indexOf(f) >= 0;
    }
    
    get partialFields():string[] {
        let propNames = this.crud.filter(x => canAccess(this.slug, x) && x.request.implements.some(i => i.name == "IPatchDb`1"))
            .map(x => store.getType(this.slug, x.dataModel))
            .map(x => x?.properties.filter(p => !p.isPrimaryKey).map(p => p.name))
            .reduce((a, b) => a?.concat(b || []), []); //flatten
        return propNames || [];
    }
    
    hasCrud(actions:string[]) {
        var crudInterfaces = actions.map(x => `I${x}Db\`1`);
        return this.crud.some(x => x.request.implements?.some(r => crudInterfaces.indexOf(r.name) >= 0));
    }

    humanize(s:string) { return humanize(s); }

    renderValue(o: any) {
        return Array.isArray(o)
            ? o.join(', ')
            : typeof o == "undefined"
                ? ""
                : typeof o == "object"
                    ? JSON.stringify(o)
                    : o + "";
    }

    get createLabel() { return `Create ${this.type.name}` }
    get updateLabel() { return `Edit ${this.type.name}` }

    getField(o: any, name: string) { return getField(o,name); }

    get canCreate() {
        return true;
    }

    get canUpdate() {
        return false;
    }

    mounted() {
    }
    
    isEditing(i:number,j:number) {
        return this.editingField && this.editingField[0] === i && this.editingField[1] === j;
    }
    
    get dirty() { return this.editingField && this.editingValue != getField(this.results[this.editingField[0]],this.fieldNames[this.editingField[1]]); }
    
    editField(rowIndex:number, fieldIndex:number, $event:MouseEvent) {
        window.getSelection()?.removeAllRanges();
        this.editingField = [rowIndex,fieldIndex, $event.clientX, $event.clientY];
        this.editingValue = getField(this.results[rowIndex],this.fieldNames[fieldIndex]);
        this.$nextTick(() => {
           (document.querySelector('.results .editing input') as HTMLInputElement)?.select(); 
        });
    }
    
    cancelEdit() {
        console.log('cancelEdit');
        this.resetEdit();
    }
    
    resetEdit() {
        this.responseStatus = null;
        this.editingField = null;
        this.editingValue = '';
    }

    async saveEdit() {
        const updateRow = this.results[this.editingField![0]];
        const updateField = this.fieldNames[this.editingField![1]];
        const patchOp = this.crud.find(x => x.request.implements.some(i => i.name == "IPatchDb`1") &&
            x.request.properties.some(x => x.name == updateField))!;
        const pk = this.type.properties.find(x => x.isPrimaryKey);
        const pkValue = pk && getField(updateRow, pk.name);
        
        if (!updateField || !patchOp || !pk || !pkValue) {
            this.responseStatus = { errorCode: 'InvalidState', message: `Results.saveEdit(): ${updateField}, ${patchOp}, ${pkValue}` };
            return;
        }

        console.log('saveEdit', updateField, this.editingValue, patchOp);
        if (!this.dirty) {
            this.cancelEdit();
        }
        await exec(this, async () => {
            
            await client.patch(new SiteInvoke({ 
                slug:this.slug, 
                request:patchOp.request.name,
                args: [pk.name,pkValue,updateField,this.editingValue]
            }));
            
            updateRow[Object.keys(updateRow).find(k => normalizeKey(k) == normalizeKey(updateField))!] = this.editingValue;

            this.resetEdit();
        });
    }
}
export default Results;
Vue.component('results',Results);
