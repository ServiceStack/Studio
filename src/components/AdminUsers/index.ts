import {Component, Prop, Vue, Watch} from 'vue-property-decorator';
import {
    bus,
    collapsed,
    exec,
    getSiteInvoke,
    loadSite,
    log,
    store,
    client,
    renderValue,
    allKeys,
} from '../../shared';
import {
    AdminQueryUsers,
    SiteInvoke,
} from "../../shared/dtos";
import {Route} from "vue-router";
import { getField, humanize } from "@servicestack/client";

@Component({ template:
    `<section v-if="enabled" id="adminusers" :class="['grid-layout','no-sidebar',windowStyles]">

        <header id="header">
            <h1 v-if="site">
                <nav class="site-breadcrumbs">
                    <ol class="breadcrumb">
                        <li class="breadcrumb-item">
                            <router-link to="/"><i class="home-link svg-3x mb-1" title="home" /></router-link>
                        </li>
                        <li :class="['breadcrumb-item']">
                            <img v-if="site.iconUrl" :src="site.iconUrl" class="sq-3x mb-1">
                            <span v-else>{{site.name}}</span>
                        </li>
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
            <auth id="auth" v-if="site && app" :slug="slug" feature="adminusers" /> 
        </header>
        
        <main>
            <div v-if="!loading && session && accessible">
                <div class="main-container p-2">
                    <form class="mb-2 row g-1" @submit.prevent="search()">
                        <div class="col-auto">
                            <i v-if="txtQuery" class="text-close" style="position:absolute;margin:0 0 3px 265px;" title="clear" @click="clearQuery()"></i>
                            <v-input v-model="txtQuery" id="txtQuery" 
                                    :placeholder="hasFeature('query') ? 'Search Users' : 'Username or Email'" inputClass="form-control" />
                        </div>
                        <div class="col-auto">
                            <button @click="search()" class="ms-1 btn btn-outline-primary">Go</button>
                        </div>
                        <div class="col-auto">
                            <span class="main-query ms-2">
                                <button class="btn left-link svg-2x"  :disabled="skip==0" title="< previous" @click="viewNext(-pageSize)"></button>
                                <button class="btn right-link svg-2x" :disabled="results.length < take" title="next >" @click="viewNext(pageSize)"></button>
                            </span>
                            <span v-if="results.length" class="text-muted">
                               Showing results: {{skip+1}}-{{skip+results.length}}
                            </span>
                            <span v-else class="text-muted">No results</span>
                        </div>
                    </form>
                    <div v-if="results.length">
                        <table class="results">
                            <thead><tr class="noselect">
                                <th>
                                    <i class="svg svg-btn svg-create svg-md" title="New User" @click="show('Create')"/>
                                </th>
                                <th v-for="f in fieldNames" :key="f" @click="setOrderBy(f)" class="th-link">
                                    <div class="text-nowrap">
                                        {{ humanize(f) }}
                                        <span v-if="orderBy==f" class="svg svg-chevron-up svg-md align-top"></span>
                                        <span v-else-if="orderBy=='-'+f" class="svg svg-chevron-down svg-md align-top"></span>
                                    </div>
                                </th>
                            </tr></thead>
                            <tbody>
                                <template v-for="(r,i) in results">
                                <tr :key="i" :class="{ selected:selectedRow(i) }">
                                    <td>
                                        <span>
                                            <i class="svg svg-btn svg-update svg-sm" title="Update User" @click="editRow(i)" />
                                        </span>
                                    </td>                                
                                    <td v-for="(f,j) in fieldNames" :key="j" :title="renderValue(getField(r,f))" 
                                        :class="{ selected:selectedCell(i,j) }" 
                                        @click="selectField(i,j)">                
                                        <span v-if="i==0 && j==0 && showCreate">
                                            <create-user-modal :slug="slug" @done="handleDone('Create',$event)" />
                                        </span>
                                        <div v-else-if="isEditingRow(i) && j == 0">
                                            <edit-user-modal :slug="slug" :id="getField(r,'id')" @done="handleDone('Edit',$event)" />
                                        </div>
                                        <format v-else :value="getField(r,f)" />
                                    </td>
                                </tr>
                                </template>
                            </tbody>
                        </table>
                        <error-view :responseStatus="responseStatus" />
                    </div>
                    <div class="actions mt-2">
                        <button @click="show('Create')" class="btn btn-outline-primary">
                            New User
                        </button>
                    </div>
                </div>
            </div>
            <div v-else-if="!session" class="text-center" style="position:absolute;left:50%;margin:50px 0 0 -100px">
                <i class="svg svg-users svg-10x" />
                <h3 class="mb-4">Manage Users</h3>
                <button v-if="!loading" @click="bus.$emit('signin')" class="btn btn-outline-primary">
                    Sign In
                </button>
            </div>
            <div v-else-if="!accessible" class="text-danger">                
                <h4>
                    <i class="svg block-danger svg-2x" />
                    Only {{plugin.accessRole}} Users can manage all users
                </h4>                
            </div>
        </main>
        
        <Footer v-if="app" :slug="slug"/>
        
    </section>
    <no-plugin v-else :slug="slug" plugin="adminusers" />`,
})
export class AdminUsers extends Vue {
    txtQuery = '';

    showCreate = false;
    orderBy = '';
    skip = 0;
    take = 50;
    pageSize = 50;
    selectedField:number[]|null = null;
    editingRow:number|null = null;

    fields: string[] = [];
    results:{ [index:string]: Object; }[] = [];

    loading = false;
    responseStatus = null;

    @Watch('$route', { immediate: true, deep: true })
    async onUrlChange(newVal: Route) {
        log('onUrlChange', newVal);
        await this.reset();
    }

    async reset() {
        log('AdminUsers.reset()');
        await this.search();
    }
    
    async clearQuery() {
        this.txtQuery='';
        await this.search();
    }
    
    async search() {
        const args = ['query',this.txtQuery, 'orderBy',this.orderBy, 'skip',`${this.skip}`, 'take',`${this.take}`];
        log(`AdminUsers.search(): ${args}`);
        await exec(this, async () => {
            const response = await getSiteInvoke(new SiteInvoke({
                slug: this.slug,
                request: 'AdminQueryUsers',
                args,
            }));
            const obj = JSON.parse(response);
            console.log(obj)
            this.results = getField(obj, 'Results');
        });
    }

    get store() { return store; }

    get bus() { return bus; }
    
    get slug() { return this.$route.params.slug as string; }

    get site() { return store.getSite(this.slug); }

    get app() { return store.getApp(this.slug); }

    get plugin() { return store.getApp(this.slug)?.plugins.adminUsers }
    
    hasFeature(feature:string) { return this.plugin.enabled.find(x => x === feature) != null; }

    get enabled() { return !!this.plugin; }

    get accessible() { return this.enabled && store.hasRole(this.slug, this.plugin.accessRole); }

    get session() { return store.getSession(this.slug); }

    get windowStyles() { return !this.accessible || collapsed(this.slug,'footer') ? 'collapse-footer' : ''; }
    
    get fieldNames() {
        let ret = this.plugin?.queryUserAuthProperties || allKeys(this.results);
        if (this.fields.length > 0) {
            ret = ret.filter(x => this.fields.indexOf(x) >= 0);
        }
        return ret;
    }
    show(tab?:string,rowIndex?:number) {
        this.selectedField = null;
        this.showCreate = false;
        this.editingRow = null;

        if (tab === 'Create') {
            this.showCreate = true;
        } else if (tab == 'Edit' && typeof rowIndex == "number") {
            this.editingRow = rowIndex;
        }
    }
    async handleDone(op?:string,e?:any) {
        log('handleDone',op,e);
        this.showCreate = false;
        this.editingRow = null;
        if (e) {
            await this.search();
        }
    }

    async viewNext(skip:number) {
        this.skip += skip;
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
    
    humanize(s:string) { return humanize(s); }
    renderValue(o: any) { return renderValue(o); }
    getField(o: any, name: string) { return getField(o,name); }
    selectedRow(rowIndex:number) { return this.selectedField && this.selectedField[0] == rowIndex; }
    selectedCell(rowIndex:number, fieldIndex:number) { 
        return false; // disable field selection
        //return this.selectedField && this.selectedField[0] == rowIndex && this.selectedField[1] == fieldIndex; 
    }
    selectField(rowIndex:number, fieldIndex:number) {
        this.selectedField = [rowIndex,fieldIndex];
    }
    isEditingRow(rowIndex:number) {
        return this.editingRow === rowIndex;
    }
    editRow(rowIndex:number) {
        this.editingRow = rowIndex;
        this.selectedField = [rowIndex,0];
    }

    async mounted() {
        log('AdminUsers.mounted()');
        await loadSite(this.slug);
        await this.reset();
        bus.$on('signedin', () => {
            log('signedin');
            this.reset();
        });
    }
}
export default AdminUsers;
Vue.component('admin-users', AdminUsers);

