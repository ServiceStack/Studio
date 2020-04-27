import {Component, Prop, Vue} from "vue-property-decorator";
import {
    MetadataPropertyType,
    MetadataType,
    ModifyValidationRules,
    ScriptMethodType,
    SiteInvoke,
    SiteProxy,
    ValidationRule
} from "../../shared/dtos";
import {deleteSiteInvoke, dtoAsArgs, exec, log, postSiteProxy} from "../../shared";
import {nameOf} from "@servicestack/client";

@Component({
    template: `
<form @submit.prevent.stop="submit()" class="create-property-rule m-2">
    <i class="text-close float-right" title="close" @click="$emit('done',{field:field})" />
    <error-summary except="validator,condition,errorCode,message,notes" :responseStatus="responseStatus" />
    
     <ul class="nav nav-pills mb-1" role="tablist">
        <li class="nav-item" @click="setTypeTab('validator')">
            <span :class="['nav-link', {active:activeTypeTab('validator')}]">Validator</span>
        </li>
        <li class="nav-item" @click="setTypeTab('condition')">
            <span :class="['nav-link', {active:activeTypeTab('condition')}]">Script</span>
        </li>
    </ul>
    <div class="tab-content" :class="[isTypeValidator ? 'type-rule' : null]">
        <div :class="['tab-pane', {active:activeTypeTab('validator')}]" role="tabpanel">
            <v-input :id="id('validator')" statusField="Validator" v-model="validator" :responseStatus="responseStatus" 
                     :placeholder="placeholderValidator" spellcheck="false"
                     help="Choose from any of the pre-defined validator's below" /> 
        </div>
        <div :class="['tab-pane', {active:activeTypeTab('condition')}]" role="tabpanel">
            <v-input statusField="condition" v-model="condition" :responseStatus="responseStatus" 
                     :placeholder="conditionValidator" spellcheck="false" 
                     help="Script Expression that must evaluate to true, see: sharpscript.net" />
        </div>
    </div>

    <v-select v-if="properties" class="mt-2" statusField="field" v-model="field" :responseStatus="responseStatus" 
             help="The property this rule applies to" :values="properties.map(x => x.name)">
    </v-select>

    <v-input statusField="errorCode" v-model="errorCode" inputClass="form-control-md mt-3" :responseStatus="responseStatus" 
             placeholder="ErrorCode" help="Override with custom error code?" /> 
    <v-input statusField="message" v-model="message" inputClass="form-control-md mt-1" :responseStatus="responseStatus" 
             placeholder="Error Message" help="Override with custom message?" /> 
    <v-input statusField="notes" v-model="notes" inputClass="form-control-md mt-1" :responseStatus="responseStatus" 
             placeholder="Notes" help="Attach a note to this rule?" /> 

    <div class="text-right mt-3">
        <span class="btn btn-link" @click="$emit('done',{field:field})">close</span>
        <button type="submit" class="btn btn-primary">&plus;
            <span v-if="rule">Update Rule</span>
            <span v-else>Create Rule</span>
        </button>
    </div>
    <div v-if="rule" class="confirm-delete" style="margin:-38px 0 0 20px;line-height: 30px;">
        <input type="checkbox" class="form-check-input" @change="allowDelete=!allowDelete" :id="id('confirm')"/>
        <label :for="id('confirm')" class="form-check-label" >confirm</label>
        <button class="btn btn-danger" @click.prevent="submitDelete()" :disabled="!allowDelete">delete</button>
    </div>
    
    <h4 class="my-3">Quick Select {{isTypeValidator ? 'Type' : 'Property'}} Validator</h4>

    <div v-for="x in validators" :key="x.name + x.paramNames">
        <span class="btn btn-sm btn-outline-secondary mt-1" @click="editValidator(x)">{{fmt(x)}}</span>
    </div>
</form>
`
})
export class EditValidationRule extends Vue {

    @Prop() slug: string;
    @Prop() validators: ScriptMethodType[];
    @Prop() type: MetadataType;

    @Prop() properties?: MetadataPropertyType[] | null; //type or property rule
    @Prop() rule?: ValidationRule | null; //create or edit

    field: string | null = null; //property rule
    validator = '';
    condition = '';
    errorCode = '';
    message = '';
    notes = '';
    typeTab = 'validator';

    allowDelete = false;

    loading = false;
    responseStatus = null;

    get isTypeValidator() {
        return !this.properties;
    }

    get placeholderValidator() {
        return (this.isTypeValidator ? 'Type' : 'Property') + ' Validator';
    }

    get conditionValidator() {
        return 'Condition e.g: ' + (this.isTypeValidator
            ? 'dto.Prop1 != dto.Prop2'
            : 'it.isOdd()');
    }

    id(id: string) {
        return `${this.ruleType}-${id}`;
    }

    get ruleType() {
        return (this.isTypeValidator ? 'type' : 'prop');
    }

    mounted() {
        if (this.condition) {
            this.typeTab = 'condition';
        }
        this.field = this.properties && this.properties[0]?.name || null;
        if (!this.rule) return;
        this.field = this.rule.field;
        this.validator = this.rule.validator;
        this.condition = this.rule.condition;
        this.errorCode = this.rule.errorCode;
        this.message = this.rule.message;
        this.notes = this.rule.notes;
    }

    setTypeTab(tab: string) {
        this.typeTab = tab;
    }

    activeTypeTab(tab: string) {
        return this.typeTab == tab;
    }

    focusValidator(sel: string) {
        let txt = document.querySelector(sel) as HTMLInputElement;
        let hasQuotes = true;
        let startPos = txt?.value.indexOf("'"), endPos = txt?.value.indexOf("'", startPos + 1);
        if (!(startPos >= 0 && endPos >= 0)) {
            hasQuotes = false;
            startPos = txt?.value.indexOf("{");
            endPos = txt?.value.indexOf("}", startPos);
        }
        if (txt && startPos >= 0 && endPos >= 0) {
            txt.selectionStart = hasQuotes ? startPos + 1 : startPos;
            txt.selectionEnd = hasQuotes ? endPos : endPos + 1;
            txt.focus();
        }
    }

    async editValidator(v: ScriptMethodType) {
        this.validator = this.editfmt(v);
        return this.$nextTick(() => this.focusValidator('#' + this.id('validator')));
    }

    typesWrapper: any = {
        'String[]': (p: string) => "['" + p + "']",
        'String': (p: string) => "'" + p + "'",
    };

    wrap(type: string, p: string) {
        const f = this.typesWrapper[type];
        return f && f(p) || '{' + p + '}';
    }

    editfmt(v: ScriptMethodType) {
        return v.name + (v.paramNames?.length > 0 ? `(${v.paramNames.map((p, i) =>
            this.wrap(v.paramTypes[i], p)).join(',')})` : '');
    }

    fmt(v: ScriptMethodType) {
        return v.name + (v.paramNames?.length > 0 ? `(${v.paramNames.join(',')})` : '');
    }

    async submitDelete() {
        log('submitDelete');
        await exec(this, async () => {

            const request = new ModifyValidationRules({
                deleteRuleIds: [this.rule!.id]
            });

            await deleteSiteInvoke(new SiteInvoke({
                slug: this.slug,
                request: nameOf(request),
                args: dtoAsArgs(request)
            }));

            this.$emit('done', this.rule);

        });
    }

    async submit() {
        await exec(this, async () => {

            const request = new ValidationRule({
                type: this.type.name,
            });
            if (this.validator) {
                request.validator = this.validator;
            } else if (this.condition) {
                request.condition = this.condition;
            }
            if (this.field) request.field = this.field;
            if (this.errorCode) request.errorCode = this.errorCode;
            if (this.message) request.message = this.message;
            if (this.notes) request.notes = this.notes;
            if (this.rule) request.id = this.rule.id;

            await postSiteProxy(new SiteProxy({
                    slug: this.slug,
                    request: nameOf(new ModifyValidationRules)
                }),
                new ModifyValidationRules({
                    saveRules: [request]
                }));

            this.$emit('done', request);
        });
    }
}