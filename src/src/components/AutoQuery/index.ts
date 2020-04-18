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
    MetadataOperationType, MetadataPropertyType,
    MetadataType,
    MetadataTypes, SiteInvoke
} from "../../shared/dtos";
import { Route } from "vue-router";
import {getField} from "@servicestack/client";

@Component({ template:
    `<section v-if="enabled" id="autoquery" :class="['grid-layout',windowStyles]">

        <header id="header">
            <h1 v-if="site">
                <nav class="autoquery-breadcrumbs">
                    <ol class="breadcrumb">
                        <li class="breadcrumb-item">
                            <router-link to="/"><i class="svg-home svg-3x mb-1" title="home" /></router-link>
                        </li>
                        <li :class="['breadcrumb-item',{active:!model}]">
                            <img v-if="site.iconUrl" :src="site.iconUrl" class="sq-3x mb-1">
                            <i v-else class="svg db-dark svg-3x mb-1" 
                               /><router-link v-if="model" to="?">{{site.name}}</router-link>                
                            <span v-else>{{site.name}}</span>
                        </li>
                        <li v-if="model" class="breadcrumb-item active">{{$route.query.op}}</li>
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
            <auth id="auth" v-if="site && app" :slug="slug" /> 
        </header>
        
        <nav v-if="app" id="left">
            <div id="nav-filter">
                <i v-if="txtFilter" class="text-close" style="position:absolute;margin:0 0 0 265px;" title="clear" @click="txtFilter=''"></i>
                <v-input v-model="txtFilter" id="txtFilter" placeholder="filter" inputClass="form-control" />
            </div>
            <div id="sidebar" class="">
                <div class="pl-2">
                    <div v-for="op in accessibleAutoQueryTables" :key="typeKey(op.request)" 
                        :class="['datamodel',{selected:matchesType(op.dataModel,model)}]" :title="op.dataModel?.name">
                        <router-link :to="{ query: { op:op.request.name } }">{{op.dataModel?.name}}</router-link>
                    </div>
                </div>
            </div>
        </nav>
        
        <main v-if="app">
            <div v-if="model" class="query-form">
                <div class="tab-content" id="v-pills-tabContent">
                  <div class="tab-pane fade show active" id="v-pills-home" role="tabpanel" aria-labelledby="v-pills-home-tab">
                    <form class="form-inline" @submit.prevent="submit">
                    <table>
                    <tr>
                        <td>
                            <v-select id="listColumns" :values="modelProps" :value="searchField" :responseStatus="responseStatus"
                                      v-model="searchField" selectClass="custom-select">
                            </v-select>
                        </td>
                        <td>
                            <v-select id="listFilters" :values="viewerConventions" :value="searchType" :responseStatus="responseStatus"
                                      v-model="searchType" selectClass="custom-select mx-2">
                            </v-select>                                
                        </td>
                        <td>
                            <v-input v-model="searchText" placeholder="value" class="" inputClass="form-control" />
                        </td>
                        <td>
                            <button type="submit" :disabled="!selectedCondition" class="btn btn-outline-primary ml-1" title="Search">
                                Search
                            </button>
                        </td>
                        <td>
                            <i v-if="selectedCondition" class="text-close ml-2" style="line-height:.5em" title="reset query" @click="resetQuery()"/>
                        </td>
                    </tr>
                    </table>
                    </form>
                  </div>
                </div>
            </div>
            <div v-if="model && response && !responseStatus" class="results-container">
                <results :slug="slug" :results="results" :type="model" :crud="crudOperations" :eventIds="eventIds" @refresh="reset()" />
            </div>
            <div v-else-if="responseStatus"><error-view :responseStatus="responseStatus" class="mt-5" /></div>
        </main>
        
        <Footer v-if="app" :slug="slug"/>
        
    </section>
    <no-plugin v-else :slug="slug" plugin="autoquery" />`,
})
export class AutoQuery extends Vue {
    @Prop({ default: '' }) name: string;
    txtFilter = '';
    
    searchField = '';
    searchType = '';
    searchText = '';
    conditions:Condition[] = [];
    
    responseJson = '';
    response:any = null;
    results:any[] = [];
    eventIds:string[]|null = null;

    loading = false;
    responseStatus = null;
    
    get store() { return store; }
    
    get slug() { return this.$route.params.slug as string; }

    get op() { return this.$route.query.op as string; }
    
    @Watch('$route', { immediate: true, deep: true })
    async onUrlChange(newVal: Route) {
        await this.reset();
    }
    
    get windowStyles() { return collapsed(this.slug,'footer') ? 'collapse-footer' : ''; }
    
    async resetQuery() {
        const pk = this.model?.properties.find(x => x.isPrimaryKey) as MetadataPropertyType;
        this.searchField = this.$route.query.field as string || pk?.name || '';
        this.searchType = this.$route.query.type as string || '%';
        this.searchText = this.$route.query.q as string || '';
        var convention = this.plugin?.viewerConventions.find(c => c.value === this.searchType);
        if (convention) {
            const field = convention.value.replace("%", this.searchField);
            await this.search([field,' ']);
        }
    }
    
    async reset() {
        log('reset', this.op, this.modelRef, this.model);
        this.responseStatus = null;
        this.responseJson = '';
        const pk = this.model?.properties.find(x => x.isPrimaryKey) as MetadataPropertyType;
        const queryPrefs = (store.getAppPrefs(this.slug)?.queryConditions[this.op] || [])[0];
        this.searchField = this.$route.query.field as string || queryPrefs?.searchField || pk?.name || '';
        this.searchType = this.$route.query.type as string || queryPrefs?.searchType || '%';
        this.searchText = this.$route.query.q as string || queryPrefs?.searchText || '';
        const customQuery = this.$route.query.field || this.$route.query.type || this.$route.query.q;

        if (customQuery || queryPrefs) {
            await this.submit();
        } else {
            await this.search([]);
        }
    }
    
    get site() { return store.getSite(this.slug); }

    get app() { return store.getApp(this.slug); }

    get api() { return this.app?.api; }

    get plugin() { return store.getApp(this.slug)?.plugins.autoQuery; }

    get enabled() { return this.app && store.hasPlugin(this.slug, 'autoquery'); }
    
    get enableEvents() { return this.plugin?.crudEventsServices && this.store.hasRole(this.slug, this.plugin.accessRole); }
    
    get modelRef() { return (this.api?.operations.find(x => x.request.name === this.$route.query.op) as MetadataOperationType)?.dataModel; }

    get model() { return store.getType(this.slug,this.modelRef); }

    get modelProps() { 
        return [ {key:'',value:'Columns...'}, ...this.model?.properties.map(x => ({ key:x.name, value:x.name}))||[] ]; 
    }
    
    get viewerConventions() { 
        return [ {key:'',value:'Filters...'}, ...(this.plugin?.viewerConventions.map(x => ({ key:x.value, value:x.name })) || []) ] 
    }
    
    matchesType(x:IModelRef,y:IModelRef) { return matchesType(x,y); }

    typeKey(type:{namespace:string, name:string}) {
        return (type.namespace || '') + '.' + type.name; 
    }

    get operations() :MetadataOperationType[] {
        if (!this.app)
            return [];

        return this.api?.operations.filter(op => matchesType(op.dataModel,this.modelRef)) || [];
    }

    get queryOps() { return this.operations.filter(isQuery); }
    
    filterOperations(fn?:(op:MetadataOperationType, type:MetadataType) => boolean) {
        if (!this.app)
            return [];
        const to: MetadataOperationType[] = [];
        const typesMap = store.appTypes[this.slug];
        const existingKeys:{ [id:string]: boolean} = {};

        this.api?.operations.forEach(op => {
            if (!op.dataModel)
                return;

            const typeKey = this.typeKey(op.request);
            if (existingKeys[typeKey])
                return;
            existingKeys[typeKey] = true;

            const type = typesMap[typeKey];
            if (type) {
                if (!this.txtFilter || type.name.toLowerCase().indexOf(this.txtFilter.toLowerCase()) >= 0) {
                    if (!fn || fn(op,type))
                        to.push(op);
                }
            } else {
                console.warn('Type does not exist', op.dataModel);
            }
        });
        to.sort((x,y) => x.dataModel.name.localeCompare(y.dataModel.name));
        return to;
    }

    get autoQueryTables() {
        return this.filterOperations((op, table) => isQuery(op));
    }

    get accessibleAutoQueryTables() {
        return this.filterOperations((op, table) => isQuery(op) && canAccess(this.slug,op));
    }

    get crudOperations() {
        return this.filterOperations((op, table) => isCrud(op) && matchesType(op.dataModel, this.modelRef));
    }
    
    get selectedCondition():Condition|null { 
        return !this.searchField || !this.searchType || !this.searchText ? null 
            : { searchField:this.searchField, searchType:this.searchType, searchText:this.searchText };
    }

    async mounted() {
        await loadSite(this.slug);
        await this.reset();
        bus.$on('signedin', () => {
            this.reset();
        });
    }
    
    async submit() {
        log('submit', this.selectedCondition);
        if (!this.selectedCondition) return;
        
        await exec(this, async () => {
            var searchArgs = this.searchArgs();
            searchArgs.push({ include:'total' });
            return await this.search(toInvokeArgs(searchArgs));
        });
    }
    
    async search(invokeArgs:string[]) {
        if (!this.op) return;
        await exec(this, async () => {
            const request = new SiteInvoke({ slug:this.slug, request:this.op, args: invokeArgs});
            log('siteInvoke',request);
            this.responseJson = await getSiteInvoke(request);
            this.response = JSON.parse(this.responseJson);
            this.results = this.response && (this.response.results || this.response.Results);
            bus.$emit('appPrefs', { slug:this.slug, request:this.op, queryConditions:this.allConditions });

            await this.loadEvents();
        });
    }
    
    async loadEvents() {
        if (!this.enableEvents) return;
        
        const pk = this.model?.properties.find(x => x.isPrimaryKey);
        var pkValues = pk != null ? this.results.map(x => getField(x, pk.name)).filter(x => x != null) : [];
        if (pkValues.length == 0) return;

        const ids = pkValues.join(',');
        const response = await postSiteInvoke(new SiteInvoke({
            slug:this.slug,
            request:'CheckCrudEvents',
            args:['model',this.model!.name,'ids',ids]
        }));
        const obj = JSON.parse(response);
        this.eventIds = obj.results;
    }

    isValidCondition() {
        return this.searchField && this.searchType && this.searchText
            && (this.searchType.toLowerCase() !== 'between' || (this.searchText.indexOf(',') > 0 && this.searchText.indexOf(',') < this.searchText.length -1));
    }
    
    get allConditions() {
        const conditions = [...(this.conditions || [])];
        if (this.selectedCondition) {
            conditions.push(this.selectedCondition);
        }
        return conditions;
    }
    
    searchArgs() {
        const args:{[id:string]:string}[] = [];

        this.allConditions.forEach(condition => {
            const { searchField, searchType, searchText } = condition;
            var convention = this.plugin?.viewerConventions.find(c => c.value === searchType);
            if (convention) {
                const field = convention.value.replace("%", searchField);
                args.push({ [field]: searchText });
            }
        });

        return args;
    }

    handleError(status:any) {
        this.responseStatus = status;
    }
}
export default AutoQuery;
Vue.component('autoquery', AutoQuery);

