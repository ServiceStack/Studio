import {Component, Vue, Watch} from 'vue-property-decorator';
import {
    bus,
    collapsed,
    dtoAsArgs,
    exec,
    getSiteInvoke,
    IModelRef,
    isQuery,
    loadSite,
    log,
    matchesType,
    store
} from '../../shared';
import {GetValidationRules, MetadataOperationType, SiteInvoke, ValidationRule,} from "../../shared/dtos";
import {Route} from "vue-router";
import {nameOf} from "@servicestack/client";
import { EditValidationRule } from "./EditValidationRule";

Vue.component('edit-validation-rule', EditValidationRule);

@Component({ template:
    `<section v-if="enabled" id="validation" :class="['grid-layout',windowStyles]">

        <header id="header">
            <h1 v-if="site">
                <nav class="site-breadcrumbs">
                    <ol class="breadcrumb">
                        <li class="breadcrumb-item">
                            <router-link to="/"><i class="home-link svg-3x mb-1" title="home" /></router-link>
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
            <div v-if="accessible">
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
            </div>
        </nav>
        
        <main>
            <div v-if="operation && !loading && session">
                <div v-if="accessible" class="main-container">
                    <div style="min-height:200px">
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
                    </div>
                    
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
            </div>
            <div v-else-if="!session" class="text-center" style="position:absolute;left:50%;margin:50px 0 0 -100px">
                <i class="svg svg-lock svg-10x mb-1" />
                <h3 class="mb-3">Validation</h3>
                <button v-if="!loading" @click="bus.$emit('signin')" class="btn btn-outline-primary">
                    Sign In
                </button>
            </div>
            <div v-else-if="op && !operation || !accessible" class="text-danger">                
                <h4>
                    <i class="svg block-danger svg-2x" />
                    Only {{plugin.accessRole}} Users can maintain Validation Rules
                </h4>                
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
        if (!this.app || !this.accessible)
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

