import {Vue, Component, Prop} from 'vue-property-decorator';
import {store, client, bus, exec, log, loadSite} from '../../shared';
import {adminUsersRoute, autoQueryRoute, validationRoute} from "../../shared/router";
import {ModifyConnection, GetSites, SiteSetting} from "../../shared/dtos";

/* copy-cmd */
function copyCmd(e:HTMLElement) {
    console.log(e)
    let $el = document.createElement("input");
    let $parent = e.parentElement as HTMLElement;
    let $lbl = $parent.firstElementChild as HTMLElement;
    $el.setAttribute("value", $lbl.innerText);
    document.body.appendChild($el);
    $el.select();
    document.execCommand("copy");
    document.body.removeChild($el);
    $parent.classList.add('copied');
}

function versionScore(strVersion:string) {
    let parts = strVersion.split('.');
    return (parseInt(parts[0]) * 1000) + (parseInt(parts[1]) * 100) + parseInt(parts[2]);
}

@Component({
    template: `<div id="content" class="container mt-4">
        <div id="title">
            <h1>
                <i class="svg-logo svg-4x" />
                ServiceStack Studio
            </h1>
        </div>
        <div class="row justify-content-between">
            <div class="col mt-5 ms-4">
                <p class="lead" style="font-size: 1.5em">
                    <i class="svg-connect svg-2x me-1 mb-1" />
                    Connect to ServiceStack Instance:
                </p>
                
                <form ref="form" @submit.prevent="submit" :class="{ error:responseStatus, loading }" >
                    <div class="mb-3">
                        <error-summary except="baseUrl" :responseStatus="responseStatus" />
                    </div>
                    <div class="input-group">
                        <v-input id="baseUrl" v-model="txtBaseUrl" placeholder="BaseUrl" :responseStatus="responseStatus" 
                                 help="BaseUrl of remote ServiceStack App" style="width: 24em" />
                        <button class="btn btn-social-icon btn-play btn-lg">
                          <i v-if="!loading" class="fab fa-play"></i>
                          <i v-if="loading" class="fab fa-loading"></i>
                        </button>
                    </div>
                </form>                
            </div>
        </div>
        <div class="row mt-4 ms-3">
            <div class="col col-auto">
                <table class="site">
                    <tbody>
                        <tr v-for="x in store.sites" :key="x.baseUrl">
                            <td>
                                <img v-if="x.iconUrl" :src="x.iconUrl" class="sq-lg me-1 mb-1">
                                <i v-else class="svg-servicestack svg-lg me-1 mb-1" />
                                {{ x.name }} <small>({{ x.baseUrl }})</small>
                            </td>
                            <td class="ps-4">
                                <button v-if="hasPlugin(x,'adminusers')" @click="$router.push(routeAdminUsers(x.slug))" class="btn btn-light">
                                    <i class="svg-users svg-md mb-1" />
                                    Users
                                </button>
                            </td>
                            <td>
                                <button v-if="hasPlugin(x,'autoquery')" @click="$router.push(routeAutoQuery(x.slug))" class="btn btn-light">
                                    <i class="svg-db svg-md mb-1" />
                                    AutoQuery
                                </button>
                           </td>
                            <td>
                                <button v-if="hasPlugin(x,'validation')" @click="$router.push(routeValidation(x.slug))" class="btn btn-light">
                                    <i class="svg-lock svg-md mb-1" />
                                    Validation
                                </button>
                            </td>
                            <td>
                                <button class="btn btn-social-icon btn-sm mx-1" @click="deleteSite(x)">
                                    <i class="fab fa-delete"></i>
                                </button>                                
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <div v-if="hasUpdate" class="mt-5">
            <h4>New {{tool}} version available</h4>
            <div style="display:flex;">
                <div class="copy-cmd">
                    <pre class="sh" style="border-radius:0.375rem;border-color:rgba(243,244,246,1);background-color:rgba(243,244,246,1);display:flex;font-size:1.125rem;line-height: 1.75rem;">        
                        <label style="flex-grow:1;text-align:left;">dotnet tool update -g {{tool}}</label>
                        <b style="padding-left:0.75rem;padding-right:0.25rem;white-space:nowrap;color:rgba(156,163,175,1);display:inline-block;font-size: 0.875rem;line-height: 1.25rem;"> copied</b>
                        <i class="svg-copy" style="cursor:pointer;min-width:1.5rem;height:1.5rem;width:1.5rem;display:inline-block;" title="copy" @click="copyCmd('.copy-cmd i')"></i>
                    </pre>
                </div>
            </div>
            <p class="text-muted">please upgrade by running in a Terminal or Windows Run dialog (<em>WIN+R</em>) then restarting studio</p>
        </div>
        <div id="debug-links">
            <button v-if="store.debug" class="btn btn-light btn-sm" @click="$router.push('/desktop')"
                    title="Go to Desktop"><i class="svg-debug svg-lg"/></button>
        </div>
    </div>`,
    components: {},
})
export class Home extends Vue {
    @Prop({default: ''}) name: string;
    txtBaseUrl = '';
    loading = false;
    responseStatus = null;

    get store() { return store;}

    get desktop() { return (window as any).CONFIG.desktop; }
    get tool() { return this.desktop && this.desktop.tool; }
    
    get toolVersion() {
        return this.desktop && this.desktop.toolVersion
            ? versionScore(this.desktop.toolVersion)
            : null;
    }
    
    get hasUpdate() {
        return this.toolVersion && this.toolVersion < versionScore('5.1.30');
    }

    protected routeAutoQuery(slug: string) {
        return autoQueryRoute(slug);
    }

    protected routeValidation(slug: string) {
        return validationRoute(slug);
    }

    protected routeAdminUsers(slug: string) {
        return adminUsersRoute(slug);
    }
    
    protected hasPlugin(site:SiteSetting, id:string) {
        return site.plugins?.indexOf(id) >= 0;
    }
    
    protected deleteSite(site:SiteSetting) {
        if (confirm(`Are you sure you want to remove '${site.baseUrl}' ?`)) {
            exec(this, async () => {
               await client.delete(new ModifyConnection({ removeSlug: site.slug }));
               bus.$emit('removeSite', site.slug);
            });
        }
    }

    protected async mounted() {
        const response = await client.get(new GetSites());
        bus.$emit('sites', response.sites);
        
        const connect = this.$route.query.connect || store.connect;
        if (connect) {
            this.txtBaseUrl = connect as string;
            await this.submit(true);
        }
    }

    protected async submit(autoLoad:boolean=false) {
        try {
            this.loading = true;
            this.responseStatus = null;

            const response = await client.post(new ModifyConnection({
                addBaseUrl: this.txtBaseUrl,
            }));

            bus.$emit('sites', response.sites);
            bus.$emit('app', response);

            this.txtBaseUrl = '';
            log(`/sites/${response.slug}`);
            this.$router.push(`/sites/${response.slug}`);
            if (autoLoad) {
                await loadSite(response.slug);
            }
        } catch (e) {
            this.responseStatus = e.responseStatus || e;
        } finally {
            this.loading = false;
        }
    }
    
    protected copyCmd(sel:string) { return copyCmd(document.querySelector(sel) as HTMLElement); }
}

export default Home;
  