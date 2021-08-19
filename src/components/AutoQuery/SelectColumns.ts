import Vue from 'vue';
import {Component, Emit, Prop} from 'vue-property-decorator';
import {ColumnSchema} from '../../shared';

@Component({ template:
`<div class="modal" tabindex="-1" role="dialog" @keyup.esc="$emit('done')" style="display:block;background:rgba(0,0,0,.25)">
  <div class="modal-dialog" role="document" style="margin-top:120px">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title noselect">
            Column Preferences
        </h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" @click="$emit('done')"></button>
      </div>
      <div class="modal-body ms-2">
        <div class="form-check">
            <input class="form-check-input" type="radio" name="exampleRadios" id="allColumns" :checked="selectedColumns.length==0" 
                @click="selectedColumns=[]" @change="onInputValues">
            <label class="form-check-label noselect" for="allColumns">View all columns</label>
        </div>
        <hr>
        <div v-for="c in columns" :key="c.columnName" class="form-check">
          <input class="form-check-input" type="checkbox" :id="c.columnName" :value="c.columnName" v-model="selectedColumns" @change="onInputValues">
          <label class="form-check-label noselect" :for="c.columnName">{{c.columnName}}</label>
        </div>
        <div class="row mt-3 pt-3 border-top border-top-primary">
            <div class="col mb-3 text-end">
                <span class="btn btn-link" @click="$emit('done')">Close</span>
                <button class="btn btn-primary" @click="$emit('done')">Done</button>
            </div>
        </div>
      </div>
    </div>
  </div>
</div>`,
})
class SelectColumns extends Vue {
    @Prop() public columns: ColumnSchema[];
    @Prop({ default: () => ([])}) value: string[];

    selectedColumns:string[] = [];
    
    mounted() {
        this.selectedColumns = this.value;
        this.$nextTick(() => (document.querySelector('.modal') as HTMLElement)?.focus());
    }

    @Emit('input')
    protected onInputValues(e:InputEvent) {
        return this.selectedColumns;
    }    
}
Vue.component('select-columns', SelectColumns);
