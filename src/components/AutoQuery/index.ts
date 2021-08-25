import {Vue, Component, Prop, Watch} from 'vue-property-decorator';
import {
    store,
    client,
    bus,
    canAccess,
    loadSite,
    IModelRef,
    exec,
    isQuery,
    isCrud,
    matchesType,
    toInvokeArgs,
    collapsed,
    getSiteInvoke,
    log,
    postSiteInvoke,
    dateFmtHMS
} from '../../shared';
import {
    MetadataOperationType,
    MetadataType,
    MetadataPropertyType,
    SiteInvoke,
} from "../../shared/dtos";
import { Route } from "vue-router";
import {combinePaths, getField} from "@servicestack/client";
import {desktopSaveDownloadUrl, setClipboard} from "@servicestack/desktop";

@Component({ template:
    `<section v-if="enabled" id="autoquery" :class="['grid-layout',windowStyles]">

        <header id="header">
            <h1 v-if="site">
                <nav class="site-breadcrumbs">
                    <ol class="breadcrumb">
                        <li class="breadcrumb-item">
                            <router-link to="/"><i class="home-link svg-3x mb-1" title="home" /></router-link>
                        </li>
                        <li :class="['breadcrumb-item',{active:!model}]">
                            <img v-if="site.iconUrl" :src="site.iconUrl" class="sq-3x mb-1">
                            <i v-else class="svg db-dark svg-3x mb-1" 
                               /><router-link v-if="model" to="?">{{site.name}}</router-link>                
                            <span v-else>{{site.name}}</span>
                        </li>
                        <li v-if="model" class="breadcrumb-item active">{{$route.query.op}}</li>
                        <li v-if="loading"><i class="svg-loading svg-lg ms-2 mb-1" title="loading..." /></li>
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
            <auth id="auth" v-if="site && app" :slug="slug" feature="autoquery" :op="op" /> 
        </header>
        
        <nav v-if="app" id="left">
            <div id="nav-filter">
                <i v-if="txtFilter" class="text-close" style="position:absolute;margin:0 0 0 265px;" title="clear" @click="txtFilter=''"></i>
                <v-input v-model="txtFilter" id="txtFilter" placeholder="filter" inputClass="form-control" />
            </div>
            <div id="sidebar" class="">
                <div class="ps-2">
                    <div v-for="op in accessibleAutoQueryTables" :key="typeKey(op.request)" 
                        :class="['datamodel',{selected:$route.query.op === op.request.name}]" :title="op.dataModel.name">
                        <router-link :to="{ query: { op:op.request.name } }">
                            {{op.dataModel.name}}
                            <small v-if="hasMultiple(op.dataModel.name)">({{op.request.name}})</small>
                        </router-link>
                    </div>
                </div>
            </div>
        </nav>
        
        <main v-if="app">
            <div v-if="model && canQuery" class="query-form">
                <div class="tab-content" id="v-pills-tabContent">
                  <div class="tab-pane fade show active" id="v-pills-home" role="tabpanel" aria-labelledby="v-pills-home-tab">
                    <form class="row g-1" @submit.prevent="submit">
                        <div class="col-auto">
                            <v-select id="listColumns" :values="modelProps" :value="searchField" :responseStatus="responseStatus"
                                      v-model="searchField" selectClass="custom-select">
                            </v-select>
                        </div>
                        <div class="col-auto">
                            <v-select id="listFilters" :values="viewerConventions" :value="searchType" :responseStatus="responseStatus"
                                      v-model="searchType" selectClass="custom-select">
                            </v-select>                                
                        </div>
                        <div class="col-auto">
                            <v-input v-model="searchText" placeholder="value" class="" inputClass="form-control" />
                        </div>
                        <div class="col-auto">
                            <button type="submit" :disabled="!hasSelectedCondition" class="btn btn-outline-primary" title="Search">
                                Search
                            </button>
                            <i v-if="dirty" class="text-close ms-2" style="line-height:.5em" title="reset query" @click="resetQuery()"/>
                        </div>
                    </form>
                  </div>
                </div>
            </div>
            <div v-if="model && response" class="main-container">
                <div v-if="responseStatus"><error-view :responseStatus="responseStatus" class="" /></div>
                <div v-if="showSelectColumns">
                    <select-columns :columns="columns" v-model="fields" @done="handleSelectColumns($event)" />
                </div>
                <div class="main-query" v-if="results.length">
                    <span class="btn svg svg-fields svg-2x" title="View Columns" @click="showSelectColumns=!showSelectColumns"></span>
                    <button class="btn first-link svg-2x" :disabled="skip==0" title="<< first" @click="viewNext(-total)"></button>
                    <button class="btn left-link svg-2x"  :disabled="skip==0" title="< previous" @click="viewNext(-100)"></button>
                    <button class="btn right-link svg-2x" :disabled="results.length < take" title="next >" @click="viewNext(100)"></button>
                    <button class="btn last-link svg-2x"  :disabled="results.length < take" title="last >>" @click="viewNext(total)"></button>
                    <span class="px-1 results-label">Showing Results {{skip+1}} - {{min(skip + results.length,total)}} <span v-if="total!=null">of {{total}}</span></span>
                    <button class="btn btn-outline-success btn-sm btn-compact" @click="openCsv()" 
                        :title="store.hasExcel ? 'Open in Excel' : 'Open CSV'"><i class="svg-md svg-excel"></i>{{store.hasExcel ? 'excel' : 'csv' }}</button>
                    <button class="btn btn-sm btn-compact" @click="copyUrl()" 
                        title="Copy URL"><i class="svg-md svg-copy"></i> Copy URL</button>
                </div>
                <results :slug="slug" :results="results" :defaultFilters="filters" :fields="fields" :orderBy="orderBy" :type="model" 
                         :crud="crudOperations" :eventIds="eventIds" :resetPulse="resetPulse"
                         @orderBy="setOrderBy($event)" @refresh="restore()" @filterSearch="filterSearch($event)" />
            </div>
        </main>
        
        <Footer v-if="app" :slug="slug"/>
        
    </section>
    <no-plugin v-else :slug="slug" plugin="autoquery" />`,
})
export class AutoQuery extends Vue {
    @Prop({ default: '' }) name: string;
    txtFilter = '';
    showSelectColumns = false;
    
    searchField = '';
    searchType = '';
    searchText = '';
    skip = 0;
    take = 100;
    orderBy = '';
    filters:{[id:string]:string} = {};
    fields:string[] = [];

    resetPulse = false;

    total:number|null = null;
    responseJson = '';
    response:any = null;
    results:any[] = [];
    eventIds:string[]|null = null;

    loading = false;
    responseStatus = null;
    
    get store() { return store; }
    
    get slug() { return this.$route.params.slug as string; }

    get op() { return this.$route.query.op as string; }

    get windowStyles() { return collapsed(this.slug,'footer') ? 'collapse-footer' : ''; }

    @Watch('$route', { immediate: true, deep: true })
    async onUrlChange(newVal: Route) {
        await this.restore();
    }
    
    async resetQuery() {
        const pk = this.model?.properties.find(x => x.isPrimaryKey) as MetadataPropertyType;
        this.searchField = this.$route.query.field as string || pk?.name || '';
        this.searchType = this.$route.query.type as string || '%';
        this.searchText = this.$route.query.q as string || '';
        this.skip = this.$route.query.skip && parseInt(this.$route.query.skip as string) || 0;
        this.take = this.$route.query.take && parseInt(this.$route.query.take as string) || 100;
        this.orderBy = this.$route.query.orderBy as string || '';
        this.fields = this.$route.query.fields && (this.$route.query.fields as string).split(',') || [];
        this.filters = {};
        this.resetPulse = !this.resetPulse;
        await this.search();
    }
    
    async restore() {
        log('reset', this.op, this.modelRef, this.model);
        this.responseStatus = null;
        this.responseJson = '';
        const pk = this.model?.properties.find(x => x.isPrimaryKey) as MetadataPropertyType;
        const queryPrefs = store.getAppPrefs(this.slug)?.query[this.op] || {};
        this.searchField = this.$route.query.field as string || queryPrefs?.searchField || pk?.name || '';
        this.searchType = this.$route.query.type as string || queryPrefs?.searchType || '%';
        this.searchText = this.$route.query.q as string || queryPrefs?.searchText || '';
        this.skip = this.$route.query.skip && parseInt(this.$route.query.skip as string) || queryPrefs?.skip || 0;
        this.take = this.$route.query.take && parseInt(this.$route.query.take as string) || queryPrefs?.take || 100;
        this.orderBy = this.$route.query.orderBy as string || queryPrefs?.orderBy || '';
        this.fields = this.$route.query.fields && (this.$route.query.fields as string).split(',') || queryPrefs?.fields || [];
        this.filters = queryPrefs?.filters || {};

        await this.search();
    }
    
    get site() { return store.getSite(this.slug); }

    get app() { return store.getApp(this.slug); }

    get api() { return this.app?.api; }

    get plugin() { return store.getApp(this.slug)?.plugins.autoQuery; }

    get enabled() { return this.app && store.hasPlugin(this.slug, 'autoquery'); }
    
    get enableEvents() { return this.plugin?.crudEvents && this.store.hasRole(this.slug, this.plugin.accessRole); }

    min(num1:number,num2:number) { return Math.min(num1, num2); }
    
    get dirty() { return this.hasSelectedCondition || this.skip || this.orderBy || Object.keys(this.filters).length > 0 || this.fields.length > 0; }

    get modelRef() { return (this.api?.operations.find(x => x.request.name === this.$route.query.op) as MetadataOperationType)?.dataModel; }

    get model() { return store.getType(this.slug,this.modelRef); }

    get modelProps() { 
        return [ {key:'',value:'Columns...'}, ...this.model?.properties.map(x => ({ key:x.name, value:x.name}))||[] ]; 
    }
    
    get columns() { 
        return this.model?.properties.map(x => ({ columnName:x.name, dataType:x.typeNamespace ? `${x.typeNamespace}.${x.type}` : x.type  })) 
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

        const search = this.txtFilter.toLowerCase();
        this.api?.operations.forEach(op => {
            if (!op.dataModel)
                return;

            const typeKey = this.typeKey(op.request);
            if (existingKeys[typeKey])
                return;
            existingKeys[typeKey] = true;

            const type = typesMap[typeKey];
            if (type) {
                if (type.name.toLowerCase().indexOf(search) >= 0) {
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

    hasMultiple(dataModel:string) {
        return this.accessibleAutoQueryTables.filter(x => x.dataModel?.name === dataModel).length > 1;
    }

    get crudOperations() {
        return this.filterOperations((op, table) => isCrud(op) && matchesType(op.dataModel, this.modelRef));
    }
    
    get canQuery() { return this.accessibleAutoQueryTables.some(op => this.op == op.request.name); }
    
    get convention() { return this.plugin?.viewerConventions.find(c => c.value === this.searchType); }
    
    get hasSelectedCondition() { return this.searchField && this.searchType && (this.searchText || this.convention?.valueType == 'none'); }

    async mounted() {
        await loadSite(this.slug);
        await this.restore();
        bus.$on('signedin', () => {
            this.restore();
        });
    }
    
    async submit() {
        log('submit', this.hasSelectedCondition);
        if (!this.hasSelectedCondition) return;

        return await this.search();
    }
    
    async search() {
        if (!this.op) return;
        if (!this.canQuery) return;
        const invokeArgs = toInvokeArgs(this.searchArgs());
        await exec(this, async () => {
            const request = new SiteInvoke({ slug:this.slug, request:this.op, args: invokeArgs});
            log('siteInvoke',request);
            this.responseJson = await getSiteInvoke(request);
            this.response = JSON.parse(this.responseJson);
            this.results = this.response && (this.response.results || this.response.Results);
            this.total = this.response && (this.response.total || this.response.Total);
            bus.$emit('appPrefs', { slug:this.slug, request:this.op, query:this.query });

            await this.loadEvents();
        });
    }

    async openCsv() {
        const args = this.searchArgs().filter(x => !x.take);
        args.push({ jsconfig:'edv' });
        const invokeArgs = toInvokeArgs(args);
        await exec(this, async () => {
            const request = new SiteInvoke({ slug:this.slug, request:this.op, args: invokeArgs });
            const url = client.createUrlFromDto("GET", request).replace("/json/","/csv/");
            log('openCsv',request,url);
            let downloadUrl = desktopSaveDownloadUrl(`${this.op}-${dateFmtHMS()}.csv`, url) + "?open=true";
            if (store.hasExcel) {
                downloadUrl += '&start=excel';
            }
            await fetch(downloadUrl);
        });
    }
    
    async copyUrl() {
        const args = this.searchArgs();
        args.push({ jsconfig:'edv' });

        let url = combinePaths(this.site.baseUrl, 'json', 'reply', this.op);
        args.forEach(o => Object.keys(o).forEach(k => {
            url += url.indexOf('?') >= 0 ? '&' : '?';
            url += `${k}=${encodeURIComponent(o[k])}`;
        }));

        log('copyUrl',url);
        await setClipboard(url);
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
        log('loadEvents', response);

        const obj = JSON.parse(response);
        this.eventIds = obj.results;
    }

    isValidCondition() {
        return this.searchField && this.searchType && this.searchText
            && (this.searchType.toLowerCase() !== 'between' || (this.searchText.indexOf(',') > 0 && this.searchText.indexOf(',') < this.searchText.length -1));
    }
    
    get query() {
        return ({
            searchField: this.searchField,
            searchType: this.searchType,
            searchText: this.searchText,
            skip: this.skip,
            take: this.take,
            orderBy: this.orderBy,
            filters: this.filters,
            fields: this.fields,
        });
    }
    
    searchArgs() {
        const args:{[id:string]:string}[] = [];
        args.push({ include: 'total' });
        if (this.fields.length > 0) {
            args.push({ fields: this.fields.join(',') });
        }
        if (Object.keys(this.filters).length > 0) {
            Object.keys(this.filters).forEach(k => {
                const v = this.filters[k];
                if (v == '=null') {
                    args.push({ [`${k}IsNull`]: '' })
                } else if (v == '!=null') {
                    args.push({ [`${k}IsNotNull`]: '' })
                } else if (v.startsWith('<=')) {
                    args.push({ [`${k}<`]: v.substring(2) })
                } else if (v.startsWith('>=')) {
                    args.push({ [`>${k}`]: v.substring(2) })
                } else if (v.startsWith('<>') || v.startsWith('!=') ) {
                    args.push({ [`${k}!`]: v.substring(2) })
                } else if (v.startsWith('<')) {
                    args.push({ [`<${k}`]: v.substring(1) })
                } else if (v.startsWith('>')) {
                    args.push({ [`${k}>`]: v.substring(1) })
                } else if (v.endsWith(',')) {
                    args.push({ [`${k}In`]: v.substring(0,v.length-1) })
                } else if (v.startsWith('%') && v.endsWith('%')) {
                    args.push({ [`${k}Contains`]: v.substring(1,v.length-1) })
                } else if (v.startsWith('%')) {
                    args.push({ [`${k}EndsWith`]: v.substring(1) })
                } else if (v.endsWith('%')) {
                    args.push({ [`${k}StartsWith`]: v.substring(0,v.length-1) })
                } else if (v.startsWith('=')) {
                    args.push({ [k]: v.substring(1) })
                } else {
                    args.push({ [k]: v })
                }
            });
        }
        if (this.orderBy) {
            args.push({ orderBy: this.orderBy });
        }
        if (this.skip) {
            args.push({ skip: `${this.skip}` });
        }
        if (this.take) {
            args.push({ take: `${this.take}` });
        }
        if (this.convention) {
            if (this.searchText || this.convention.valueType == "none") {
                const field = this.convention.value.replace("%", this.searchField);
                args.push({ [field]: this.searchText });
            }
        }

        return args;
    }

    handleError(status:any) {
        this.responseStatus = status;
    }

    async handleSelectColumns(e:any) {
        this.showSelectColumns = false;
        await this.search();
    }

    async viewNext(skip:number) {
        this.skip += skip;
        if (typeof this.total != 'number') return;
        const lastPage = Math.floor(this.total / 100) * 100;
        if (this.skip > lastPage) {
            this.skip = lastPage;
        }
        if (this.skip < 0) {
            this.skip = 0;
        }
        await this.search();
    }

    async setOrderBy(field:string) {
        if (this.orderBy == field) {
            this.orderBy = '-' + field;
        } else if (this.orderBy == '-' + field) {
            this.orderBy = '';
        } else {
            this.orderBy = field;
        }
        await this.search();
    }
    
    async filterSearch(filters:{[id:string]:string}) {
        log('filterSearch',filters)
        this.filters = filters;
        await this.search();
    }

}
export default AutoQuery;
Vue.component('autoquery', AutoQuery);

