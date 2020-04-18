import { Vue, Component, Watch, Prop } from 'vue-property-decorator';
import {store, bus, client, exec, splitOnFirst, defaultValue, postSiteInvoke, log, getSiteInvoke} from '../../shared';
import {
    CrudEvent,
    MetaAuthProvider,
    MetadataOperationType,
    MetadataType,
    SiteAuthenticate,
    SiteInvoke
} from "../../shared/dtos";
import {dateFmt, getField, timeFmt12, toDate} from "@servicestack/client";

@Component({ template:
`<div v-if="enabled" id="eventsModal" class="modal-inline" tabindex="-1" role="dialog" @keyup.esc="$emit('done')">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
            {{type.name}} Events
        </h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="$emit('done')">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <error-summary :responseStatus="responseStatus" />
        <dl class="h-kvp mb-3">
            <dt>{{pk.name}}</dt>
            <dd>{{id}}</dd>
        </dl>
        <div v-for="x in results" :key="x.id">
            <i v-if="!expanded(x.id)" class="svg svg-chevron-right svg-btn svg-md" title="expand" @click="toggle(x.id)"></i>
            <i v-else class="svg svg-chevron-down svg-btn svg-md" title="collapse" @click="toggle(x.id)"></i>
            <ul class="event summary" @click="toggle(x.id)">
                <li class="type">{{x.eventType | upper}}</li>
                <li class="by"><b><i>[{{x.userAuthId}}]</i> {{x.userAuthName}}</b></li>
                <li class="on"><b>{{dateFmt(x.eventDate)}}</b></li>
            </ul>
            <div v-if="expanded(x.id)" class="event-detail">
                <ul class="event">
                    <li class="op">{{x.requestType}}</li>
                    <li class="ip"><span>ip</span>{{x.remoteIp}}</li>
                </ul>
                <jsonviewer :json="x.requestBody"/>
            </div>
        </div>
      </div>
    </div>
  </div>
</div>`,
})
export class EventsModal extends Vue {
    @Prop({ default: null }) slug: string;
    @Prop() public type: MetadataType;
    @Prop({ default: null }) id: string;

    results:CrudEvent[] = [];
    
    expandIds:number[] = [];
    
    loading = false;
    responseStatus = null;

    get app() { return store.getApp(this.slug); }
    get plugin() { return this.app?.plugins.autoQuery; }
    get enabled() { return this.plugin.crudEventsServices && store.hasRole(this.slug, this.plugin?.accessRole); }
    get pk() { return this.type.properties.find(x => x.isPrimaryKey); }

    dateFmt(dateStr:string) { return dateFmt(toDate(dateStr)) + " " + timeFmt12(toDate(dateStr)); }

    expanded(id:number) { return this.expandIds.indexOf(id) >= 0; }
    toggle(id:number) {
        if (this.expanded(id)) {
            this.expandIds = this.expandIds.filter(x => x != id);
        } else {
            this.expandIds.push(id);
        }
    }
    
    async mounted() {
        if (!this.enabled) return;
        log('EventsModal.mounted()', this.slug, this.type.name, this.id);

        await exec(this, async () => {
            const response = await getSiteInvoke(new SiteInvoke({
                slug:this.slug,
                request:'GetCrudEvents',
                args:['model',this.type.name,'modelId',this.id]
            }));
            const obj = JSON.parse(response);
            this.results = obj.results.reverse();
        });
    }
}
export default EventsModal;
Vue.component('events-modal', EventsModal);
