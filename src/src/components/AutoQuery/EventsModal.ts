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
import {getField} from "@servicestack/client";

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
        <div class="form-group">
            <error-summary :responseStatus="responseStatus" />
        </div>        
        <div v-for="x in results" :key="x.id" class="form-group">
            {{x.model}}
        </div>
        <div class="form-group text-right">
            <span class="btn btn-link" @click="$emit('done')">Close</span>
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
    
    loading = false;
    responseStatus = null;

    get app() { return store.getApp(this.slug); }
    get plugin() { return this.app?.plugins.autoQuery; }
    get enabled() { return this.plugin.crudEventsServices && store.hasRole(this.slug, this.plugin?.accessRole); }
    
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
            this.results = obj.results;
        });
    }
}
export default EventsModal;
Vue.component('events-modal', EventsModal);
