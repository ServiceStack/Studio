import {Vue, Component, Prop, Watch} from 'vue-property-decorator';
import {
    fromXsdDuration,
    humanize,
    toDate,
    toLocalISOString,
    toTimeSpanFmt,
} from "@servicestack/client";
import { log } from "../shared";
import type { MetadataPropertyType, ResponseStatus } from "../shared/dtos";

const numberTypes = ['SByte','Byte','Int16','Int32','Int64','UInt16','UInt32','UInt64'];
const realTypes = ['Single','Double','Decimal'];
export function getInputType(propType:MetadataPropertyType) {
    const t = realType(propType);
    const name = propType.name;
    if (t === 'Boolean')
        return 'checkbox';
    if (numberTypes.indexOf(t) >= 0 || realTypes.indexOf(t) >= 0)
        return 'number';
    if (t === 'DateTime' || t === 'DateTimeOffset')
        return 'datetime-local';
    if (propType.isEnum && propType.allowableValues?.length > 0)
        return 'select';

    if (name) {
        if (name.endsWith('Password'))
            return 'password';
        if (name.endsWith('Email'))
            return 'email';
        if (name.endsWith('Url'))
            return 'url';
        if (name.indexOf('Phone') >= 0)
            return 'tel';
    }

    if (!propType.isValueType && t !== 'String')
        return 'textarea';

    return 'text';
}

export function realType(f:MetadataPropertyType) { return f.type === 'Nullable`1' ? f.genericArgs[0] : f.type; }

@Component({ template:
`<template>
    <v-select v-if="inputType=='select'" :selectClass="['form-control-' + size]" :responseStatus="responseStatus" :values="values" 
              v-model="model[f.name]" :help="help" />
    <v-input v-else :type="inputType" :id="f.name" v-model="value" :responseStatus="responseStatus" :values="values"
             :placeholder="humanize(f.name)" :inputClass="['form-control-' + size]" :help="help" step="any" 
             @input="onInput" />
</template>`})

class InputType extends Vue {
    @Prop({ default: null }) public model: any;
    @Prop({ default: null }) public property: MetadataPropertyType;
    @Prop({ default: null }) public responseStatus: ResponseStatus;
    @Prop({ default: 'md' }) public size: string;
    
    value:any = null;
    values:any[] = [];
    preInput = true;
    
    get help() { return this.realType !== 'Boolean' ? humanize(this.f.name) : ''; }
    
    get realType() { return realType(this.f); }

    get inputType() { return getInputType(this.f); }

    public get f() { return this.property; }
    humanize(s:string) { return humanize(s); }
    
    mounted() {
        log('InputType.mounted()', this.inputType);
    }

    @Watch('model', { immediate: true, deep: true })
    onModelChange(newVal: any) {
        if (!this.preInput) return;
        this.value = this.editValue();
        log('onModelChange()', this.value, this.realType);
    }

    onInput(value:any,e:any) {
        this.preInput = false;
        log('onInput',this.realType,value,e);
        if (this.inputType === "datetime-local") {
            const dateTicks = e?.target?.valueAsNumber;
            if (typeof dateTicks == 'number') {
                this.model[this.f.name] = `/Date(${dateTicks})/`;
            }
        } else if (this.realType === 'Boolean') {
            this.model[this.f.name] = value.length == 1;
        } else if (this.inputType === 'textarea' && value && (value[0] == '{' || value[0] == '[')) {
            this.model[this.f.name] = JSON.parse(value);
        } else {
            this.model[this.f.name] = value;
        }
    }

    editValue() {
        let value = this.model[this.f.name];
        if (this.inputType == 'select') {
            this.values = this.f.allowableValues;
            return [this.f.name];
        } else if (typeof value == 'string') {
            if (value !== "") {
                if (value.startsWith('/Date(') || this.inputType === 'datetime-local') {
                    return toLocalISOString(toDate(value));
                } else if (this.realType === 'TimeSpan' && value && value[0] === 'P') {
                    return toTimeSpanFmt(fromXsdDuration(value));
                }
            }
        } else if (this.inputType === 'textarea' && typeof value == 'object') {
            return JSON.stringify(value);
        } else if (this.realType === 'Boolean') {
            this.values = [this.f.name];
            return value ? [this.f.name] : [];
        }
        
        return value;
    }
}
Vue.component('v-input-type', InputType);
export default InputType;
