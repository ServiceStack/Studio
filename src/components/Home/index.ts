import {Vue, Component, Prop} from 'vue-property-decorator';
import {store, client, bus, exec, log, loadSite} from '../../shared';
import {autoQueryRoute, validationRoute} from "../../shared/router";
import {ModifyConnection, GetSites, SiteSetting} from "../../shared/dtos";

@Component({
    template: `<div id="content" class="container mt-4">
        <div id="title">
            <h1>
                <i class="svg-logo svg-4x" />
                ServiceStack Studio
            </h1>
        </div>
        <div class="row justify-content-between">
            <div class="col mt-5 ml-4">
                <p class="lead" style="font-size: 1.5em">
                    <i class="svg-connect svg-2x mr-1 mb-1" />
                    Connect to ServiceStack Instance:
                </p>
                
                <form ref="form" @submit.prevent="submit" :class="{ error:responseStatus, loading }" >
                    <div class="form-group">
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
        <div class="row mt-4 ml-3">
            <div class="col col-auto">
                <table class="site">
                    <tbody>
                        <tr v-for="x in store.sites" :key="x.baseUrl">
                            <td>
                                <img v-if="x.iconUrl" :src="x.iconUrl" class="sq-lg mr-1 mb-1">
                                <i v-else class="svg-servicestack svg-lg mr-1 mb-1" />
                                {{ x.name }} <small>({{ x.baseUrl }})</small>
                            </td>
                            <td class="actions">
                                <button v-if="hasPlugin(x,'autoquery')" @click="$router.push(routeAutoQuery(x.slug))" class="btn btn-light">
                                    <i class="svg-db svg-md mb-1" />
                                    AutoQuery
                                </button>
                                <button v-if="hasPlugin(x,'validation')" @click="$router.push(routeValidation(x.slug))" class="btn btn-light">
                                    <i class="svg-lock svg-md mb-1" />
                                    Validation
                                </button>
                                <button class="btn btn-social-icon btn-sm mx-1" @click="deleteSite(x)">
                                    <i class="fab fa-delete"></i>
                                </button>                                
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>`,
    components: {},
})
export class Home extends Vue {
    @Prop({default: ''}) name: string;
    txtBaseUrl = '';
    loading = false;
    responseStatus = null;

    get store() {
        return store;
    }

    protected routeAutoQuery(slug: string) {
        return autoQueryRoute(slug);
    }

    protected routeValidation(slug: string) {
        return validationRoute(slug);
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
}

export default Home;
  