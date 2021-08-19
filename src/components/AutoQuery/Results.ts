import Vue from 'vue';
import {Component, Prop, Watch} from 'vue-property-decorator';
import {bus, canAccess, exec, getId, log, patchSiteInvoke, store, renderValue} from '../../shared';
import {MetadataOperationType, MetadataType, SiteInvoke} from "../../shared/dtos";
import {getField, humanize, normalizeKey, toCamelCase, toDateFmt} from "@servicestack/client";
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
    get format(){ return typeof this.value == "string" && this.value.startsWith('/Date(') ? toDateFmt(this.value) : this.value; }
}
Vue.component('format', FormatString);

@Component({ template:
`<div v-if="results.length">
    <table class="results">
        <thead><tr class="noselect">
            <th v-if="crud.length">
                <i v-if="createOp" class="svg svg-btn svg-create svg-md" :title="createLabel" @click="show('Create')"/>
                <i v-else-if="!session && authPlugin" class="svg svg-btn svg-auth svg-md" title="Sign In to Edit" @click="bus.$emit('signin')" />
            </th>
            <th v-for="f in fieldNames" :key="f" :class="{partial:isPartialField(f)}" @click="setOrderBy(f)" class="th-link">
                <div class="text-nowrap">
                    {{ humanize(f) }}
                    <span v-if="orderBy==f" class="svg svg-chevron-up svg-md align-top"></span>
                    <span v-else-if="orderBy=='-'+f" class="svg svg-chevron-down svg-md align-top"></span>
                </div>
            </th>
            <th v-if="enableEvents">
                <i class="svg svg-history history-muted svg-md" title="Event History" />
            </th>
        </tr></thead>
        <tbody>
            <tr v-if="crud.length" class="filters">
                <td><span><i class="ms-1 svg svg-btn svg-filter svg-md" :title="helpFilters()" /></span></td>
                <td v-for="(f,j) in fieldNames">
                    <input type="text" v-model="filters[f]" @keydown.enter.stop="filterSearch()">
                </td>
                <td v-if="enableEvents"></td>
            </tr>
            <template v-for="(r,i) in results">
            <tr :key="i" :class="{ selected:selectedRow(i) }">
                <td v-if="crud.length">
                    <span v-if="hasCrud(['Update','Patch','Delete'])">
                        <i v-if="hasAccessibleCrud(['Update','Patch','Delete'])" class="svg svg-btn svg-update svg-sm" :title="updateLabel" 
                           @click="editRow(i)" />
                        <i v-else-if="!session && authPlugin" class="svg svg-btn svg-auth auth-warning svg-md" title="Sign In" @click="bus.$emit('signin')" />
                    </span>
                </td>
                <td v-for="(f,j) in fieldNames" :key="j" :title="renderValue(getField(r,f))" 
                    :class="{partial:isPartialField(f),editing:isEditingField(i,j), selected:selectedCell(i,j) }" 
                    @click="selectField(i,j)" @dblclick="isPartialField(f) && editField(i,j)">                
                    <div v-if="isEditingField(i,j)">
                        <input v-model="editingValue" class="form-control form-control-sm" 
                               @keydown.enter.stop="saveEdit()" @keydown.esc.stop="cancelEdit()" @blur="onEditBlur()" />                
                        <i v-if="dirty" class="svg done-success svg-md svg-btn" title="save" @click="saveEdit()" style="float:right;margin:-27px 5px 0 0;"/>
                    </div>
                    <template v-else>
                        <span v-if="i==0 && j==0 && showCreate">
                            <create-modal v-if="createOp" :slug="slug" :op="createOp" :type="type" @done="handleDone('Create',$event)" />
                        </span>
                        <div v-else-if="isEditingRow(i) && j == 0">
                            <edit-modal v-if="updateOp || patchOp || deleteOp" :slug="slug" :updateOp="updateOp" :patchOp="patchOp" :deleteOp="deleteOp" :type="type" :row="r" 
                                        @done="handleDone('Edit',$event)" />
                        </div>
                        <format :value="getField(r,f)" />
                    </template>
                </td>
                <td v-if="enableEvents">
                    <span v-if="selectedRow(i) && showEvents">
                        <events-modal :slug="slug" :type="type" :id="getId(r)" @done="handleDone('Events')" />                    
                    </span>
                    <i v-if="hasEvent(r)" class="svg svg-history history-muted svg-btn svg-md" title="Event History" @click="show('Events',i)" />
                </td>
            </tr>
            </template>
        </tbody>
    </table>
    <error-view :responseStatus="responseStatus" />
</div>
<div v-else class="results-none">
    <div class="ms-1 mb-3">
        <span class="me-1 d-inline-block">There were no results</span>        
        <button v-if="hasFilters" class="btn btn-outline-secondary btn-sm" @click="filterSearch(filters={})"
            >&times;
            reset filters
        </button>
        <button v-if="session && createOp" class="btn btn-outline-primary btn-sm" :title="createLabel" @click="show('Create')"
            >&plus;
            New {{type.name}}
        </button>
    </div>
    <create-modal v-if="session && createOp && showCreate" :slug="slug" :op="createOp" :type="type" @done="handleDone('Create',$event)" />
</div>`,
})
export class Results extends Vue {
    @Prop({ default: '' }) public slug: string;
    @Prop() public results: any[];
    @Prop() public fields: string[];
    @Prop() public defaultFilters: { [id:string]: string };
    @Prop() public orderBy: string;
    @Prop() public eventIds: string[];
    @Prop() public type: MetadataType;
    @Prop({ default:[] }) public crud: MetadataOperationType[];
    @Prop() public resetPulse: boolean;
    
    filters: { [id:string]: string } = {};

    loading = false;
    responseStatus:any = null;

    showCreate = false;
    showEvents = false;
    editingValue = '';
    editingRow:number|null = null;
    editingField:number[]|null = null;
    selectedField:number[]|null = null;
    
    @Watch('$route', { immediate: true, deep: true })
    async onUrlChange(newVal: Route) {
        this.resetEdit();
        this.show();
    }
    
    get bus() { return bus; }
    get store() { return store; }
    get session() { return store.getSession(this.slug); }
    get plugin() { return store.getApp(this.slug).plugins.autoQuery; }
    get authPlugin() { return store.getApp(this.slug).plugins.auth; }
    get hasFilters() { return Object.keys(this.filters).length > 0; }
    get typeProperties() { return store.getTypeProperties(this.slug, this.type) }

    get enableEvents() { return this.plugin.crudEventsServices && store.hasRole(this.slug, this.plugin?.accessRole); }

    get fieldNames() { 
        let ret = this.typeProperties.map(x => x.name);
        if (this.fields.length > 0) {
            ret = ret.filter(x => this.fields.indexOf(x) >= 0);
        }
        return ret;
    }
    
    show(tab?:string,rowIndex?:number) {
        this.selectedField = null;
        this.showCreate = false;
        this.showEvents = false;
        this.editingRow = null;
        
        if (tab === 'Create') {
            this.showCreate = true;
        } else if (tab == 'Edit' && typeof rowIndex == "number") {
            this.editingRow = rowIndex;
        } else if (tab == 'Events' && typeof rowIndex == "number") {
            this.selectedField = [rowIndex, this.fieldNames.length-1];
            this.showEvents = true;
        } 
    }
    
    handleDone(op?:string,e?:any) {
        log('handleDone',op,e);
        this.showCreate = false;
        this.showEvents = false;
        this.editingRow = null;
        if (e) {
            this.$emit('refresh');
        }
    }

    get createOp() { return this.crud.find(x => canAccess(this.slug, x) && x.request.implements.some(i => i.name == "ICreateDb`1")); }

    get updateOp() { return this.crud.find(x => canAccess(this.slug, x) && x.request.implements.some(i => i.name == "IUpdateDb`1")); }
    get patchOp() { return this.crud.find(x => canAccess(this.slug, x) && x.request.implements.some(i => i.name == "IPatchDb`1")); }
    get deleteOp() { return this.crud.find(x => canAccess(this.slug, x) && x.request.implements.some(i => i.name == "IDeleteDb`1")); }

    isPartialField(f:string) { return this.partialFields.indexOf(f) >= 0; }
    
    get partialFields():string[] {
        let propNames = this.crud.filter(x => canAccess(this.slug, x) && x.request.implements.some(i => i.name == "IPatchDb`1"))
            .map(x => store.getType(this.slug, x.dataModel))
            .map(x => x?.properties.filter(p => !p.isPrimaryKey).map(p => p.name))
            .reduce((a, b) => a?.concat(b || []), []); //flatten
        return propNames || [];
    }

    hasAccessibleCrud(actions:string[]) {
        const crudInterfaces = actions.map(x => `I${x}Db\`1`);
        return this.crud.some(x => canAccess(this.slug,x) && x.request.implements?.some(r => crudInterfaces.indexOf(r.name) >= 0));
    }

    hasCrud(actions:string[]) {
        const crudInterfaces = actions.map(x => `I${x}Db\`1`);
        return this.crud.some(x => x.request.implements?.some(r => crudInterfaces.indexOf(r.name) >= 0));
    }

    humanize(s:string) { return humanize(s); }

    renderValue(o: any) { return renderValue(o); }

    get createLabel() { return `New ${this.type.name}` }
    get updateLabel() { return `Edit ${this.type.name}` }

    getField(o: any, name: string) { return getField(o,name); }

    get canCreate() {
        return true;
    }

    get canUpdate() {
        return false;
    }
    
    getId(row:any) { return getId(this.type, row); }
    
    hasEvent(row:any) {
        const id = `${getId(this.type, row)}`; //need to use string comparison
        const ret = id && this.eventIds && this.eventIds.indexOf(id) >= 0;
        //log('hasEvent',row,this.eventIds,id,ret);
        return ret;
    }
    
    moveSelected(y:number,x:number) {
        if (!this.selectedField) return;
        if (document.activeElement?.tagName == 'INPUT') return;
        if (y != 0) {
            const prevY = this.selectedField[0];
            this.$set(this.selectedField, 0, prevY + y >= this.results.length
                ? 0
                : prevY + y < 0
                    ? this.results.length -1
                    : prevY + y);
        }
        if (x != 0) {
            const prevX = this.selectedField[1];
            this.$set(this.selectedField, 1, prevX + x >= this.fieldNames.length 
                ? 0 
                : prevX + x < 0
                    ? this.fieldNames.length -1
                    : prevX + x);
        }
        if (typeof this.editingRow == 'number') {
            this.editingRow = this.selectedField[0];
        }
        if (this.showEvents && !this.hasEvent(this.results[this.selectedField[0]])) {
            this.showEvents = false;
        }
    }

    onKeyDown(e:KeyboardEvent) {
        if (e.key == "Escape") {
            this.resetEdit();
            this.show('');
        } else if (this.selectedField) {
            if ((document.activeElement as HTMLInputElement)?.form) return;
            
            if (!this.editingField && e.key == "Enter") {
                this.editField(this.selectedField[0],this.selectedField[1]);
            } else if (e.key == 'ArrowUp') {
                this.moveSelected(-1, 0);
            } else if (e.key == 'ArrowDown') {
                this.moveSelected(1, 0);
            } else if (e.key == 'ArrowLeft') {
                this.moveSelected( 0, -1);
            } else if (e.key == 'ArrowRight') {
                this.moveSelected( 0, 1);
            } else if (e.key == 'Home') {
                this.$set(this.selectedField, 1, 0);
                this.focusSelected();
                e.preventDefault();
            } else if (e.key == 'End') {
                this.$set(this.selectedField, 1, this.fieldNames.length-1);
                this.focusSelected();
                e.preventDefault();
            }
        }
    }
    focusSelected() {
        this.$nextTick(() => (document.querySelector('.results td.selected') as HTMLElement)?.scrollIntoView());
    }

    beforeDestroy() {
        window.removeEventListener('keydown', this.onKeyDown);
    }

    mounted() {
        window.addEventListener('keydown', this.onKeyDown);
        log('Results.mounted()');
    }
    
    updated() {
        this.filters = this.defaultFilters;
    }
    
    isEditingRow(rowIndex:number) {
        return this.editingRow === rowIndex;
    }

    isEditingField(i:number,j:number) {
        return this.editingField && this.editingField[0] === i && this.editingField[1] === j;
    }
    
    get dirty() { return this.editingField && this.editingValue != getField(this.results[this.editingField[0]],this.fieldNames[this.editingField[1]]); }

    selectedRow(rowIndex:number) { return this.selectedField && this.selectedField[0] == rowIndex; }
    selectedCell(rowIndex:number, fieldIndex:number) { return this.selectedField && this.selectedField[0] == rowIndex && this.selectedField[1] == fieldIndex; }
    selectField(rowIndex:number, fieldIndex:number) {
        this.selectedField = [rowIndex,fieldIndex];
    }
    
    editRow(rowIndex:number) {
        this.handleDone();
        this.editingRow = rowIndex;
        this.selectedField = [rowIndex,0];
    }
    
    editField(rowIndex:number, fieldIndex:number) {
        if (!this.isPartialField(this.fieldNames[fieldIndex])) return;
        window.getSelection()?.removeAllRanges();
        this.editingField = [rowIndex,fieldIndex];
        this.editingValue = getField(this.results[rowIndex],this.fieldNames[fieldIndex]);
        this.$nextTick(() => {
           (document.querySelector('.results .editing input') as HTMLInputElement)?.select(); 
        });
    }
    
    cancelBlur = false;
    
    onEditBlur() {
        this.cancelBlur = false; //allow tick in field to cancel blur
        setTimeout(() => {
            if (!this.cancelBlur) {
                this.cancelEdit();
            }
        }, 300);
    }
    
    cancelEdit() {
        if (!this.editingField) return;
        log('cancelEdit');
        this.resetEdit();
    }
    
    resetEdit() {
        this.responseStatus = null;
        this.editingField = null;
        this.editingValue = '';
        this.filters = this.defaultFilters;
    }
    
    // need to find what serialized key (default camelCase) is from schema key (default PascalCase) 
    findKey(rowIndex:number, updateField:string) {
        let foundKey = Object.keys(this.results[rowIndex]).find(k => normalizeKey(k) == normalizeKey(updateField));
        if (foundKey)
            return foundKey;
        for (let i=0; i<this.results.length; i++) {
            foundKey = Object.keys(this.results[i]).find(k => normalizeKey(k) == normalizeKey(updateField));
            if (foundKey)
                return foundKey;
        }
        return toCamelCase(updateField); //assume camelCase default
    }

    async saveEdit() {
        this.cancelBlur = true;
        const rowIndex = this.editingField![0], fieldIndex = this.editingField![1];
        const updateRow = this.results[rowIndex];
        const updateField = this.fieldNames[fieldIndex];
        const patchOp = this.crud.find(x => x.request.implements.some(i => i.name == "IPatchDb`1") &&
            x.request.properties.some(x => x.name == updateField))!;
        
        const pk = this.typeProperties.find(x => x.isPrimaryKey);
        const pkValue = pk && getField(updateRow, pk.name);
        
        if (!updateField || !patchOp || !pk || !pkValue) {
            this.responseStatus = { errorCode: 'InvalidState', message: `Results.saveEdit(): ${updateField}, ${patchOp}, ${pkValue}` };
            return;
        }

        const updateKey = this.findKey(rowIndex, updateField);
        const updateValue = this.editingValue;
        log('saveEdit', updateKey, updateField, this.editingValue, this.dirty, patchOp?.request.name);
        if (!this.dirty) {
            this.cancelEdit();
            return;
        }
        await exec(this, async () => {
            
            const args = [pk.name,pkValue];
            if (updateValue) {
                args.push(updateField);
                args.push(updateValue);
            } else {
                args.push('reset');
                args.push(updateField);
            }
            
            await patchSiteInvoke(new SiteInvoke({ 
                slug:this.slug, 
                request:patchOp.request.name,
                args
            }));

            this.$set(updateRow, updateKey, updateValue);
            this.resetEdit();
            this.$emit('refresh');
        });
    }
    
    setOrderBy(field:string) {
        this.$emit('orderBy',field);
    }

    filterSearch() {
        Object.keys(this.filters).forEach(k => {
            if (this.filters[k] === '') {
                delete this.filters[k];
            }
        })
        this.$emit('filterSearch',this.filters);
    }

    helpFilters() {
        return `Search Filters:
Use '=null' or '!=null' to search NULL columns
Use '<= < > >= <> !=' prefix to search with that operator
Use ',' suffix to perform an IN(values) search on integers
Use '%' prefix or suffix to perform a LIKE wildcard search`
/*
Use '=' prefix to perform an exact coerced search
Otherwise a 'string equality' search is performed
* */
    }
}
export default Results;
Vue.component('results',Results);
