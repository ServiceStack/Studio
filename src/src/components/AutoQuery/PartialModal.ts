import { Vue, Component, Watch, Prop } from 'vue-property-decorator';
import {store, bus, client, exec, splitOnFirst, log} from '../../shared';
import {MetaAuthProvider, MetadataType, SiteAuthenticate} from "../../shared/dtos";
import {getField} from "@servicestack/client";

@Component({ template:
`<div id="partialModal" class="modal-mini" tabindex="-1" role="dialog" :style="modalStyle">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-body">
        <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="$emit('done')">
            <span aria-hidden="true">&times;</span>
        </button>
        <form @submit.prevent="submit">
            <v-input v-model="value" :label="field" inputClass="md" />
            <i v-if="dirty" class="svg done-success svg-md svg-btn" title="save" @click="submit()" style="float:right;margin:-27px 5px 0 0;"/>
        </form>
      </div>
    </div>
  </div>
</div>`,
})
export class PartialModal extends Vue {
    @Prop({ default: null }) slug: string;
    @Prop({ default: null }) type: MetadataType;
    @Prop({ default: null }) row: any;
    @Prop({ default: null }) field: string;
    @Prop({ default: null }) x: number;
    @Prop({ default: null }) y: number;

    value = '';
    
    loading = false;
    responseStatus = null;

    get app() { return store.getApp(this.slug); }

    get enabled() { return this.app && this.app.plugins.autoQuery; }
    
    get modalStyle() {
        return ({ display:'block', top:(this.y-10)+'px', left:(this.x-20)+'px', position:'absolute', });
    }

    modalKeyDown(e:KeyboardEvent) {
        if (e.key == "Escape") {
            this.$emit('done');
        }
    }

    beforeDestroy() {
        window.removeEventListener('keydown', this.modalKeyDown);
    }
    
    get origValue() { return getField(this.row, this.field); }
    get dirty() { return this.value != this.origValue; }

    async mounted() {
        window.addEventListener('keydown', this.modalKeyDown);
        this.value = this.origValue;
        log('PartialModal.mounted()');
    }
    
    submit() {
        if (this.dirty) {
            log('saving...', this.value, this.dirty);
            this.$emit('done', this.value);
        }
    }
}
export default PartialModal;
Vue.component('partial-modal', PartialModal);
