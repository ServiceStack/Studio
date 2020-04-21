import {Vue, Component, Prop, Watch} from 'vue-property-decorator';
import {
    store,
    client,
    bus,
    canAccess,
    loadSite,
    IModelRef,
    exec,
    Condition,
    isQuery,
    isCrud,
    matchesType,
    toInvokeArgs, collapsed, getSiteInvoke, debug, log, postSiteInvoke, dtoAsArgs, postSiteProxy, deleteSiteInvoke
} from '../../shared';
import {
    GetValidationRules,
    MetadataOperationType,
    MetadataPropertyType, MetadataType,
    ModifyValidationRules,
    ScriptMethodType,
    SiteInvoke,
    SiteProxy,
    ValidationRule,
} from "../../shared/dtos";
import {Route} from "vue-router";
import {nameOf} from "@servicestack/client";

@Component({ template: `
<form @submit.prevent.stop="submit()" class="create-property-rule m-2">
    <i class="text-close float-right" title="close" @click="$emit('done',{field:field})" />
    <error-summary except="validator,condition,errorCode,message,notes" :responseStatus="responseStatus" />
    
     <ul class="nav nav-pills mb-1" role="tablist">
        <li class="nav-item" @click="setTypeTab('validator')">
            <span :class="['nav-link', {active:activeTypeTab('validator')}]">Validator</span>
        </li>
        <li class="nav-item" @click="setTypeTab('condition')">
            <span :class="['nav-link', {active:activeTypeTab('condition')}]">Script</span>
        </li>
    </ul>
    <div class="tab-content" :class="[isTypeValidator ? 'type-rule' : null]">
        <div :class="['tab-pane', {active:activeTypeTab('validator')}]" role="tabpanel">
            <v-input :id="id('validator')" statusField="Validator" v-model="validator" :responseStatus="responseStatus" 
                     :placeholder="placeholderValidator" spellcheck="false"
                     help="Choose from any of the pre-defined validator's below" /> 
        </div>
        <div :class="['tab-pane', {active:activeTypeTab('condition')}]" role="tabpanel">
            <v-input statusField="condition" v-model="condition" :responseStatus="responseStatus" 
                     :placeholder="conditionValidator" spellcheck="false" 
                     help="Script Expression that must evaluate to true, see: sharpscript.net" />
        </div>
    </div>

    <v-select v-if="properties" class="mt-2" statusField="field" v-model="field" :responseStatus="responseStatus" 
             help="The property this rule applies to" :values="properties.map(x => x.name)">
    </v-select>

    <v-input statusField="errorCode" v-model="errorCode" inputClass="form-control-md mt-3" :responseStatus="responseStatus" 
             placeholder="ErrorCode" help="Override with custom error code?" /> 
    <v-input statusField="message" v-model="message" inputClass="form-control-md mt-1" :responseStatus="responseStatus" 
             placeholder="Error Message" help="Override with custom message?" /> 
    <v-input statusField="notes" v-model="notes" inputClass="form-control-md mt-1" :responseStatus="responseStatus" 
             placeholder="Notes" help="Attach a note to this rule?" /> 

    <div class="text-right mt-3">
        <span class="btn btn-link" @click="$emit('done',{field:field})">close</span>
        <button type="submit" class="btn btn-primary">&plus;
            <span v-if="rule">Update Rule</span>
            <span v-else>Create Rule</span>
        </button>
    </div>
    <div v-if="rule" class="confirm-delete" style="margin:-38px 0 0 20px;line-height: 30px;">
        <input type="checkbox" class="form-check-input" @change="allowDelete=!allowDelete" :id="id('confirm')"/>
        <label :for="id('confirm')" class="form-check-label" >confirm</label>
        <button class="btn btn-danger" @click.prevent="submitDelete()" :disabled="!allowDelete">delete</button>
    </div>
    
    <h4 class="my-3">Quick Select {{isTypeValidator ? 'Type' : 'Property'}} Validator</h4>

    <div v-for="x in validators" :key="x.name + x.paramNames">
        <span class="btn btn-sm btn-outline-secondary mt-1" @click="editValidator(x)">{{fmt(x)}}</span>
    </div>
</form>
` })
export class EditValidationRule extends Vue {

    @Prop() slug:string;
    @Prop() validators:ScriptMethodType[];
    @Prop() type:MetadataType;

    @Prop() properties?:MetadataPropertyType[]|null; //type or property rule
    @Prop() rule?:ValidationRule|null; //create or edit

    field:string|null = null; //property rule
    validator = '';
    condition = '';
    errorCode = '';
    message = '';
    notes = '';
    typeTab = 'validator';
    
    allowDelete = false;

    loading = false;
    responseStatus = null;

    get isTypeValidator() { return !this.properties; }
    get placeholderValidator(){ return (this.isTypeValidator ? 'Type' : 'Property') + ' Validator'; }
    get conditionValidator(){ return 'Condition e.g: ' + (this.isTypeValidator 
        ? 'dto.Prop1 != dto.Prop2' 
        : 'it.isOdd()'); }
    id(id:string) { return `${this.ruleType}-${id}`; }
    get ruleType() { return (this.isTypeValidator ? 'type' : 'prop'); }
    
    mounted() {
        if (this.condition) {
            this.typeTab = 'condition';
        }
        this.field = this.properties && this.properties[0]?.name || null;
        if (!this.rule) return;
        this.field = this.rule.field; 
        this.validator = this.rule.validator;
        this.condition = this.rule.condition;
        this.errorCode = this.rule.errorCode;
        this.message = this.rule.message;
        this.notes = this.rule.notes;
    }

    setTypeTab(tab:string) {
        this.typeTab = tab;
    }
    activeTypeTab(tab:string) { return this.typeTab == tab; }

    focusValidator(sel:string) {
        let txt = document.querySelector(sel) as HTMLInputElement;
        let hasQuotes = true;
        let startPos = txt?.value.indexOf("'"), endPos = txt?.value.indexOf("'", startPos+1);
        if (!(startPos >= 0 && endPos >= 0)) {
            hasQuotes = false;
            startPos = txt?.value.indexOf("{");
            endPos = txt?.value.indexOf("}", startPos);
        }
        if (txt && startPos >= 0 && endPos >= 0) {
            txt.selectionStart = hasQuotes ? startPos +1 : startPos;
            txt.selectionEnd = hasQuotes ? endPos : endPos+1;
            txt.focus();
        }
    }

    async editValidator(v:ScriptMethodType) {
        this.validator = this.editfmt(v);
        return this.$nextTick(() => this.focusValidator('#' + this.id('validator')));
    }

    typesWrapper:any = {
        'String[]' : (p:string) => "['" + p + "']",
        'String' : (p:string) => "'" + p + "'",
    };
    wrap(type:string, p:string) {
        const f = this.typesWrapper[type];
        return f && f(p) || '{' + p + '}';
    }

    editfmt(v:ScriptMethodType) {
        return v.name + (v.paramNames?.length > 0 ? `(${v.paramNames.map((p,i) =>
            this.wrap(v.paramTypes[i], p)).join(',')})` : '');
    }

    fmt(v:ScriptMethodType) {
        return v.name + (v.paramNames?.length > 0 ? `(${v.paramNames.join(',')})` : '');
    }
    
    async submitDelete() {
        log('submitDelete');
        await exec(this, async () => {
            
            const request = new ModifyValidationRules({
                deleteRuleIds:[this.rule!.id]
            });

            await deleteSiteInvoke(new SiteInvoke({
                    slug: this.slug,
                    request: nameOf(request),
                    args:dtoAsArgs(request)
                }));

            this.$emit('done', this.rule);
            
        });
    }

    async submit() {
        await exec(this, async () => {

            const request = new ValidationRule({
                type: this.type.name,
            });
            if (this.validator) {
                request.validator = this.validator;
            } else if (this.condition) {
                request.condition = this.condition;
            }
            if (this.field) request.field = this.field;
            if (this.errorCode) request.errorCode = this.errorCode;
            if (this.message) request.message = this.message;
            if (this.notes) request.notes = this.notes;
            if (this.rule) request.id = this.rule.id;
            
            await postSiteProxy(new SiteProxy({
                    slug: this.slug,
                    request: nameOf(new ModifyValidationRules)
                }), 
                new ModifyValidationRules({
                    saveRules: [request]
                }));

            this.$emit('done', request);
        });
    }
}
Vue.component('edit-validation-rule', EditValidationRule);

@Component({ template:
    `<section v-if="enabled" id="validation" :class="['grid-layout',windowStyles]">

        <header id="header">
            <h1 v-if="site">
                <nav class="site-breadcrumbs">
                    <ol class="breadcrumb">
                        <li class="breadcrumb-item">
                            <router-link to="/"><i class="svg-home svg-3x mb-1" title="home" /></router-link>
                        </li>
                        <li :class="['breadcrumb-item',{active:!operation}]">
                            <img v-if="site.iconUrl" :src="site.iconUrl" class="sq-3x mb-1">
                            <i v-else class="svg lock-dark svg-3x mb-1" 
                               /><router-link v-if="operation" to="?">{{site.name}}</router-link>                
                            <span v-else>{{site.name}}</span>
                        </li>
                        <li v-if="operation" class="breadcrumb-item active">{{operation.request.name}}</li>
                        <li v-if="loading"><i class="svg-loading svg-lg ml-2 mb-1" title="loading..." /></li>
                    </ol>
                </nav>
            </h1>
            <h1 v-else-if="loading">
              <i class="fab fa-loading"></i>
              Loading...
            </h1>
            <div v-else-if="responseStatus">
                <error-summary :responseStatus="responseStatus" />
                <router-link to="/">&lt; back to sites</router-link>
            </div>
            <auth id="auth" v-if="site && app" :slug="slug" feature="validation" :op="autoQueryOp" /> 
        </header>
        
        <nav id="left">
            <div id="nav-filter">
                <i v-if="txtFilter" class="text-close" style="position:absolute;margin:0 0 0 265px;" title="clear" @click="txtFilter=''"></i>
                <v-input v-model="txtFilter" id="txtFilter" placeholder="filter" inputClass="form-control" />
            </div>
            <div id="sidebar" class="">
                <div class="pl-2">
                    <div v-for="x in operations" :key="typeKey(x.request)" 
                        :class="['datamodel',{selected:x.request.name==op}]" :title="x.request.name">
                        <router-link :to="{ query: { op:x.request.name } }">{{x.request.name}}</router-link>
                    </div>
                </div>
            </div>
        </nav>
        
        <main>
            <div v-if="operation && !loading">
                <div v-if="accessible" class="main-container">
                    <table id="validation-rules" class="ml-2">
                    <thead>
                        <tr>
                            <th>
                                <i class="svg svg-lock svg-lg"/> Type Validation Rules
                            </th>
                            <th>
                                <div v-if="hasProperties">
                                    <i class="svg svg-lock svg-lg"/> Property Validation Rules
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td class="pr-3">
                            <div v-for="x in results.filter(x => x.field == null)" :key="x.id" class="rule">
                                <edit-validation-rule v-if="editTypeRule==x.id" :slug="slug" :type="operation.request" :rule="x" 
                                                      :validators="plugin.typeValidators" @done="handleDone($event)" />
                                <div v-else>
                                    <button class="btn btn-light btn-sm edit-rule" @click="viewTypeForm(x.id)"
                                            title="Edit Rule"><i class="svg-update svg-md"/></button>
                                    <dl class="h-kvp">
                                        <dt>{{x.validator ? 'validator':'script'}}</dt>
                                        <dd><b class="field">{{x.field}}</b>{{x.validator ?? x.condition}}</dd>
                                    </dl>
                                </div>
                            </div>
                        
                            <button v-if="!showTypeForm" class="btn btn-outline-primary btn-lg" @click="viewTypeForm()">&plus;
                                Add Type Validation Rule 
                            </button>
                            <edit-validation-rule v-else-if="editTypeRule==null" :slug="slug" :type="operation.request" 
                                                  :validators="plugin.typeValidators" @done="handleDone($event)" />
                        </td>
                        <td>
                            <div v-for="x in results.filter(x => x.field != null)" :key="x.id" class="h-kvp rule">
                                <edit-validation-rule v-if="editPropertyRule==x.id" :slug="slug" :type="operation.request" :rule="x" 
                                                      :validators="plugin.propertyValidators" :properties="operation.request.properties" 
                                                      @done="handleDone($event)" />
                                <div v-else>
                                    <button class="btn btn-light btn-sm edit-rule" @click="viewPropertyForm(x.id)"
                                            title="Edit Rule"><i class="svg-update svg-md"/></button>
                                    <dl class="h-kvp">
                                        <dt>{{x.field}} {{x.validator ? 'validator':'script'}}</dt>
                                        <dd>{{x.validator ?? x.condition}}</dd>
                                    </dl>
                                </div>
                            </div>
                        
                            <button v-if="!showPropertyForm" class="btn btn-outline-primary btn-lg" @click="viewPropertyForm()">&plus;
                                Add Property Validation Rule 
                            </button>
                            <edit-validation-rule v-else-if="editPropertyRule==null" :slug="slug" :type="operation.request" 
                                                  :validators="plugin.propertyValidators" @done="handleDone($event)" 
                                                  :properties="operation.request.properties" />
                        </td>
                    </tr>
                    </tbody>
                    </table>
                    
                    <div v-if="dataModelOps.length" class="datamodel-nav mt-5">
                        <b class="float-left" style="line-height: 40px">Quick Jump:</b>
                        <ul class="nav">
                            <li v-for="x in dataModelOps" class="nav-item">
                                <router-link :class="['nav-link',{active:x.request.name==op}]" 
                                    :to="{ query: { op:x.request.name } }">{{x.request.name}}</router-link>
                            </li>
                        </ul>
                    </div>
                </div>
                <div v-else-if="!session" class="text-center" style="position:absolute;left:50%;margin:50px 0 0 -100px">
                    <i class="svg svg-lock svg-10x mb-1" />
                    <h3 class="mb-3">Validation</h3>
                    <button v-if="!loading" @click="bus.$emit('signin')" class="btn btn-outline-primary">
                        Sign In
                    </button>
                </div>
                <div v-else>
                    Only {{plugin.accessRole}} Users can maintain Validation Rules
                </div>
            </div>
        </main>
        
        <Footer v-if="app" :slug="slug"/>
        
    </section>
    <no-plugin v-else :slug="slug" plugin="validation" />`,
})
export class Validation extends Vue {
    txtFilter = '';

    showTypeForm = false;
    editTypeRule:number|null = null;
    showPropertyForm = false;
    editPropertyRule:number|null = null;

    results:ValidationRule[] = [];

    loading = false;
    responseStatus = null;

    viewTypeForm(ruleId:number|null=null) {
        this.showTypeForm = true;
        this.editTypeRule = ruleId;
    }

    viewPropertyForm(ruleId:number|null=null) {
        this.showPropertyForm = true;
        this.editPropertyRule = ruleId;
    }

    @Watch('$route', { immediate: true, deep: true })
    async onUrlChange(newVal: Route) {
        await this.reset();
    }

    async reset() {
        log('Validation.reset()', this.op);
        this.responseStatus = null;
        this.showTypeForm = this.showPropertyForm = false;
        this.editTypeRule = this.editPropertyRule = null;
        
        await exec(this, async () => {
            if (!this.operation) return;

            const responseJson = await getSiteInvoke(new SiteInvoke({
                slug: this.slug,    
                request: nameOf(new GetValidationRules),
                args: dtoAsArgs(new GetValidationRules({ type: this.op })) 
            }));
            const response = JSON.parse(responseJson);
            this.results = response.results;
        });
    }

    get store() { return store; }

    get bus() { return bus; }
    
    get slug() { return this.$route.params.slug as string; }

    get op() { return this.$route.query.op as string; }

    get operation() { return this.api.operations.find(x => x.request.name == this.op); }
    
    get hasProperties() { return this.operation?.request.properties?.length ?? 0 > 0; }

    get site() { return store.getSite(this.slug); }

    get app() { return store.getApp(this.slug); }

    get api() { return this.app?.api; }

    get plugin() { return store.getApp(this.slug)?.plugins.validation; }

    get enabled() { return this.app && store.hasPlugin(this.slug, 'validation'); }

    get accessible() { return this.enabled && store.hasRole(this.slug, this.plugin.accessRole); }

    get session() { return store.getSession(this.slug); }

    get windowStyles() { return !this.accessible || collapsed(this.slug,'footer') ? 'collapse-footer' : ''; }
    
    get autoQueryOp() { 
        const dataModel = this.operation?.dataModel;
        if (!dataModel) return null;
        var op = this.api.operations.find(x => matchesType(x.dataModel, dataModel) && isQuery(x));
        return op?.request.name;
    }
    
    get dataModelOps() {
        const dataModel = this.operation?.dataModel;
        if (!dataModel) return [];
        return this.api.operations.filter(x => matchesType(x.dataModel, dataModel));
    }
    
    async mounted() {
        await loadSite(this.slug);
        await this.reset();
        bus.$on('signedin', () => {
            this.reset();
        });
    }

    matchesType(x:IModelRef,y:IModelRef) { return matchesType(x,y); }

    typeKey(type:{namespace:string, name:string}) {
        return (type.namespace || '') + '.' + type.name;
    }

    get operations() :MetadataOperationType[] {
        if (!this.app)
            return [];

        const search = this.txtFilter.toLowerCase();
        return this.api.operations.filter(op => op.request.name.toLowerCase().indexOf(search) >= 0);
    }

    async handleDone(rule:{field:string,validator?:string,condition?:string}) {
        log('handleDone',rule);
        if (rule.field) {
            this.showPropertyForm = false;
            this.editPropertyRule = null;
        } else {
            this.showTypeForm = false;
            this.editTypeRule = null;
        }
        
        if (rule.validator || rule.condition) {
            await this.reset();
        }
    }
}
export default Validation;
Vue.component('validation', Validation);

