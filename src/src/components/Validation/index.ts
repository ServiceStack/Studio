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
    toInvokeArgs, collapsed, getSiteInvoke, debug, log, postSiteInvoke
} from '../../shared';
import {
    MetadataOperationType, MetadataPropertyType, ScriptMethodType, SiteInvoke, ValidationRule,
} from "../../shared/dtos";
import {Route} from "vue-router";

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
            <auth id="auth" v-if="site && app" :slug="slug" feature="validation" /> 
        </header>
        
        <nav v-if="app" id="left">
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
        
        <main v-if="app && !loading">
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
                    <td class="pr-5">
                        <button v-show="!showAddType" class="btn btn-outline-primary btn-lg" @click="showAddType=true">&plus;
                            Add Type Validation Rule 
                        </button>
                            
                        <form @submit.prevent.stop="submitCreateTypeRule()" v-show="showAddType" class="create-type-rule mt-2">
                            
                            <ul class="nav nav-pills mb-1" id="pills-tab" role="tablist">
                                <li class="nav-item" @click="setTypeTab('validator')">
                                    <span :class="['nav-link', {active:typeActiveTab('validator')}]">Validator</span>
                                </li>
                                <li class="nav-item" @click="setTypeTab('condition')">
                                    <span :class="['nav-link', {active:typeActiveTab('condition')}]">Condition</span>
                                </li>
                            </ul>
                            <div class="tab-content" id="pills-tabContent">
                                <div :class="['tab-pane', {active:typeActiveTab('validator')}]" id="pills-validator" role="tabpanel">
                                    <v-input id="txtTypeValidator" v-model="txtTypeValidator" placeholder="Type Validator" spellcheck="false" 
                                             help="Use any of the pre-defined ITypeValidator's below" />
                                </div>
                                <div :class="['tab-pane', {active:typeActiveTab('condition')}]" id="pills-condition" role="tabpanel">
                                    <v-input id="txtTypeCondition" v-model="txtTypeCondition" placeholder="Script Condition" spellcheck="false" 
                                             help="Script Expression that returns true if valid, see: sharpscript.net" />
                                </div>
                            </div>
                                      
                            <v-input id="txtTypeCode" v-model="txtTypeCode" inputClass="form-control-md" style="margin-top:60px" placeholder="ErrorCode" 
                                     help="Override error with custom error code?" /> 
                            <v-input id="txtTypeMessage" v-model="txtTypeMessage" inputClass="form-control-md mt-1" placeholder="Error Message" 
                                     help="Override error with custom message?" /> 
                            <v-input id="txtTypeNotes" v-model="txtTypeNotes" inputClass="form-control-md mt-1" placeholder="Notes" 
                                     help="Attach a note to this rule?" /> 
    
                            <div class="text-right">
                                <button type="submit" class="btn btn-primary btn-lg mt-1" @click="showAddType=false">&plus;
                                    Create Rule 
                                </button>
                            </div>
                            
                            <h4 class="my-3">Quick select available validators</h4>
                        
                            <div v-for="x in plugin.typeValidators" :key="x.name + x.paramNames" class="ml-2">
                                <span class="btn btn-sm btn-outline-secondary mt-1" @click="editTypeValidator(x)">{{fmt(x)}}</span>
                            </div>

                        </form>
                    </td>
                    <td class="pr-3">
                        <div v-if="hasProperties">
                            <button v-show="!showAddProperty" class="btn btn-outline-primary btn-lg" @click="showAddProperty=true">&plus;
                                Add Property Validation Rule 
                            </button>
    
                            <form @submit.prevent.stop="submitCreatePropertyRule()" v-show="showAddProperty" class="create-property-rule">
                                <select id="selField" class="custom-select custom-select-lg mb-1">
                                    <option v-for="x in operation.request.properties" :value="x.name">{{x.name}}</option>
                                </select>
                                
                                 <ul class="nav nav-pills mb-1" id="pills-tab" role="tablist">
                                    <li class="nav-item" @click="setPropertyTab('validator')">
                                        <span :class="['nav-link', {active:propertyActiveTab('validator')}]">Validator</span>
                                    </li>
                                    <li class="nav-item" @click="setPropertyTab('condition')">
                                        <span :class="['nav-link', {active:propertyActiveTab('condition')}]">Condition</span>
                                    </li>
                                </ul>
                                <div class="tab-content" id="pills-tabContent">
                                    <div :class="['tab-pane', {active:propertyActiveTab('validator')}]" id="pills-validator" role="tabpanel">
                                        <v-input id="txtPropertyValidator" v-model="txtPropertyValidator" placeholder="Property Validator" spellcheck="false"
                                                 help="Use any of the pre-defined IPropertyValidator's below" /> 
                                    </div>
                                    <div :class="['tab-pane', {active:propertyActiveTab('condition')}]" id="pills-condition" role="tabpanel">
                                        <v-input id="txtPropertyCondition" v-model="txtPropertyCondition" placeholder="Script Condition" spellcheck="false" 
                                                 help="Script Expression that returns true if valid, see: sharpscript.net" />
                                    </div>
                                </div>

                                <v-input id="txtPropertyCode" v-model="txtPropertyCode" inputClass="form-control-md mt-3" placeholder="ErrorCode" 
                                         help="Override error with custom error code?" /> 
                                <v-input id="txtPropertyMessage" v-model="txtPropertyMessage" inputClass="form-control-md mt-1" placeholder="Error Message" 
                                         help="Override error with custom message?" /> 
                                <v-input id="txtPropertyNotes" v-model="txtPropertyNotes" inputClass="form-control-md mt-1" placeholder="Notes" 
                                         help="Attach a note to this rule?" /> 
    
                                <div class="text-right">
                                    <button type="submit" class="btn btn-primary btn-lg mt-1">&plus;
                                        Create Rule 
                                    </button>
                                </div>
                                
                                <h4 class="my-3">Quick select available validators</h4>
    
                                <div v-for="x in plugin.propertyValidators" :key="x.name + x.paramNames">
                                    <span class="btn btn-sm btn-outline-secondary mt-1" @click="editPropertyValidator(x)">{{fmt(x)}}</span>
                                </div>
                            </form>
                        </div>
                    </td>
                </tr>
                </tbody>
                </table>
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
        </main>
        
        <Footer v-if="app" :slug="slug"/>
        
    </section>
    <no-plugin v-else :slug="slug" plugin="validation" />`,
})
export class Validation extends Vue {
    txtFilter = '';

    editTypeRule:number|null = null;
    editPropertyRule:number|null = null;
    
    txtTypeValidator = '';
    txtTypeCondition = '';
    txtTypeCode = '';
    txtTypeMessage = '';
    txtTypeNotes = '';
    typeTab = 'validator';
    setTypeTab(tab:string) {
        this.typeTab = tab;
    }
    typeActiveTab(tab:string) {
        return this.typeTab == tab;
    }

    txtPropertyValidator = '';
    txtPropertyCondition = '';
    txtPropertyCode = '';
    txtPropertyMessage = '';
    txtPropertyNotes = '';
    propertyTab = 'validator';
    setPropertyTab(tab:string) {
        this.propertyTab = tab;
    }
    propertyActiveTab(tab:string) {
        return this.propertyTab == tab;
    }

    results:ValidationRule[] = [];
    showAddType = true;
    showAddProperty = true;

    loading = false;
    responseStatus = null;


    @Watch('$route', { immediate: true, deep: true })
    async onUrlChange(newVal: Route) {
        await this.reset();
    }

    async reset() {
        log('Validation.reset()', this.op);
        this.responseStatus = null;
        
        await exec(this, async () => {
            if (!this.operation) return;
            
            const responseJson = await getSiteInvoke(new SiteInvoke({ 
                request: 'GetValidationRules',
                args:['Type',this.operation.request.name]
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
    
    get txtTypeAttrs() { return {spellcheck:false,placeholder:'A'}; }

    async editTypeValidator(v:ScriptMethodType) {
        this.txtTypeValidator = this.editfmt(v);
        return this.$nextTick(() => this.focusValidator('#txtTypeValidator'));
    }

    async editPropertyValidator(v:ScriptMethodType) {
        this.txtPropertyValidator = this.editfmt(v);
        return this.$nextTick(() => this.focusValidator('#txtPropertyValidator'));
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

    async submitCreateTypeRule() {
        await exec(this, async () => {
            this.showAddType = false;
        });
    }

    async submitCreatePropertyRule() {
        await exec(this, async () => {
            this.showAddProperty = false;
        });
    }
    
    async mounted() {
        await loadSite(this.slug);
        // await this.reset();
        bus.$on('signedin', () => {
            // this.reset();
        });
    }

    matchesType(x:IModelRef,y:IModelRef) { return matchesType(x,y); }

    typeKey(type:{namespace:string, name:string}) {
        return (type.namespace || '') + '.' + type.name;
    }

    get operations() :MetadataOperationType[] {
        if (!this.app)
            return [];

        return this.api.operations.filter(op => op.request.name.indexOf(this.txtFilter.toLowerCase()) >= 0);
    }
}
export default Validation;
Vue.component('validation', Validation);

