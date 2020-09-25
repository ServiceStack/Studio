import { Vue, Component, Watch, Prop } from 'vue-property-decorator';
import {
    store,
    exec,
    editValue,
    log,
    gridProps,
    getSiteInvoke,
    putSiteInvoke,
    postSiteProxy, sanitizedModel,
} from '../../shared';
import {
    AdminCreateUser,
    AdminUpdateUser,
    MetadataPropertyType,
    SiteInvoke,
    SiteProxy,
} from "../../shared/dtos";
import {getField, humanize, nameOf, toDateFmt} from "@servicestack/client";

@Component({ template:
`<div id="createUserModal" class="modal-inline modal-inline-lg" tabindex="-1" role="dialog" @keyup.esc="$emit('done')" title="">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">
            Create New User
        </h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="$emit('done')">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="submit" :class="{ error:responseStatus, loading }" >
            <div class="form-group">
                <error-summary :except="type.properties.map(x => x.name)" :responseStatus="responseStatus" />
            </div>
            <div class="row">
                <div class="col col-7">
                    <div class="form-group">
                        <template v-for="rowProps in gridProps">
                        <div class="row mb-3">
                            <template v-for="f in rowProps">
                                <div class="col">
                                    <v-input-type :property="f" :model="model" :size="size" :responseStatus="responseStatus" />
                                </div>
                            </template>
                        </div>
                        </template>
                    </div>
                    <div class="form-group text-right pt-3 border-top border-top-primary">
                        <span class="btn btn-link" @click="$emit('done')">close</span>
                        <button :disabled="!canSubmit" type="submit" class="btn btn-primary">{{labelButton}}</button>
                    </div>
                </div>
                <div class="col col-5">
                    <div class="row mb-3">
                        <div class="col">
                            <v-input type="password" id="Password" v-model="model.Password" :responseStatus="responseStatus" 
                                     placeholder="Password" :inputClass="['form-control-' + size]" help="New Password" 
                                     @keypress.enter.native.prevent="changePassword()" />                
                        </div>
                    </div>
                    <div class="row mb-3" v-if="roles.length">
                        <div class="col">
                            <h4>Roles</h4>
                            <div v-for="role in roles">
                                <button @click.prevent="removeRole(role)" class="btn btn-sm btn-link" title="Remove Role"><i class="svg svg-md svg-delete"></i></button>                    
                                <span class="align-middle">{{ role }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="row mb-3" v-if="missingRoles.length">
                        <div class="col col-8">
                            <v-select id="roles" :values="['',...missingRoles]" :responseStatus="responseStatus"
                                      v-model="newRole" selectClass="custom-select" help="Add Role">
                            </v-select>
                        </div>
                        <div class="col col-4 p-0">
                            <button :disabled="!newRole" @click.prevent="addRole()" class="btn btn-outline-secondary" title="Add Role">Add</button>                    
                        </div>
                    </div>
                    <div class="row mb-3" v-if="permissions.length">
                        <div class="col">
                            <h4>Permissions</h4>
                            <div v-for="perm in permissions">
                                <button @click.prevent="removePermission(perm)" class="btn btn-sm btn-link" title="Remove Permission"><i class="svg svg-md svg-delete"></i></button>                    
                                <span class="align-middle">{{ perm }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="row mb-3" v-if="missingPermissions.length">
                        <div class="col col-8">
                            <v-select id="permissions" :values="['',...missingPermissions]" :responseStatus="responseStatus"
                                      v-model="newPermission" selectClass="custom-select" help="Add Permission">
                            </v-select>
                        </div>
                        <div class="col col-4 p-0">
                            <button :disabled="!newPermission" @click.prevent="addPermission()" class="btn btn-outline-secondary" title="Add Permission">Add</button>                    
                        </div>
                    </div>
                </div>            
            </div>
        </form>
      </div>
    </div>
  </div>
</div>`,
})
export class CreateUserModal extends Vue {
    @Prop({ default: null }) slug: string;
    @Prop({ default: null }) id: string;

    row:any = null;
    showAdvanced = false;
    value = '';
    model:{[id:string]:string} = {};
    roles:string[] = [];
    permissions:string[] = [];
    newRole:string|null = null;
    newPermission:string|null = null;

    loading = false;
    responseStatus = null;
    confirmDelete = false;

    grid = [
        ['UserName'],
        ['Email'],
        ['FirstName','LastName'],
        ['DisplayName'],
        ['Company'],
        ['Address'],
        ['Address2'],
        ['City','State'],
        ['Country','PostalCode'],
        ['PhoneNumber'],
        ['LockedDate'],
    ];

    get gridProps() { return gridProps(this.grid, this.type.properties.filter(f => f.name != 'LockedDate' && !f.isPrimaryKey)); }

    get app() { return store.getApp(this.slug); }

    get plugin() { return this.app && this.app.plugins.adminUsers; }

    get enabled() { return !!this.plugin; }

    get size() { return 'md'; }

    get type() { return this.plugin.userAuth; }

    get missingRoles() { return this.plugin.allRoles.filter(x => this.roles.indexOf(x) == -1); }

    get missingPermissions() { return this.plugin.allPermissions.filter(x => this.permissions.indexOf(x) == -1); }

    get canSubmit() { return (this.model.UserName || this.model.Email) && this.model.Password; }

    get labelButton() { return `Create User` }

    fieldValue(f:MetadataPropertyType) {
        return editValue(f,this.model[f.name]);
    }

    humanize(s:string) { return humanize(s); }

    async reset(success:string|null=null) {

        await exec(this, async () => {
            const response = await getSiteInvoke(new SiteInvoke({ slug:this.slug, request:'AdminGetUser', args:['Id',this.id] }));
            const obj = JSON.parse(response);
            this.row = obj.result;
        });

        this.type.properties.forEach((f,i) => {
            this.$set(this.model, f.name, editValue(f, getField(this.row,f.name)));
        });
        const roles = getField(this.row, 'Roles') as string[];
        if (roles)
            this.roles = [...roles];
        const permissions = getField(this.row, 'Permissions') as string[];
        if (permissions)
            this.permissions = [...permissions];
    }

    async mounted() {
        log('EditUserModal.mounted()');

        await this.reset();

        this.$nextTick(() => {
            (document.querySelector('#createUserModal input:first-child') as HTMLInputElement)?.select();
        });
    }

    async updateUser(args:string[], success?:string) {
        await exec(this, async () => {

            await putSiteInvoke(new SiteInvoke({
                slug:this.slug,
                request:'AdminUpdateUser',
                args:['Id',this.id, ...args]
            }));

            await this.reset(success);
        });
    }

    async changePassword() {
        log('changePassword');
        await this.updateUser(['Password',this.model.Password], 'Password was changed');
        this.model.Password = '';
    }

    async addRole() {
        if (!this.newRole) return;
        this.roles.push(this.newRole);
        this.newRole = null;
    }

    async removeRole(role:string) {
        if (!role) return;
        this.roles = this.roles.filter(x => x != role);
    }

    async addPermission() {
        if (!this.newPermission) return;
        this.permissions.push(this.newPermission);
        this.newPermission = null;
    }

    async removePermission(permission:string) {
        if (!permission) return;
        this.permissions = this.permissions.filter(x => x != permission);
    }

    async submit() {
        if (!this.canSubmit) return;
        await exec(this, async () => {
            const model = sanitizedModel(this.model);
            log('CreateUserModal.submit()', model);

            let request = new AdminCreateUser({
                userAuthProperties: {},
                roles: this.roles,
                permissions: this.permissions,
            });

            const restrictedProps = ['id','roles','permissions'];

            for (let k in model) {
                const key = k.toLowerCase();
                const val = model[k];
                if (key === 'username')
                    request.userName = val;
                if (key === 'password')
                    request.password = val;
                else if (key === 'email')
                    request.email = val;
                else if (key === 'displayname')
                    request.displayName = val;
                else if (key === 'firstname')
                    request.firstName = val;
                else if (key === 'lastname')
                    request.lastName = val;
                else if (key === 'profileurl')
                    request.profileUrl = val;
                else if (restrictedProps.indexOf(key) == -1)
                    request.userAuthProperties[k] = val;
            }

            await postSiteProxy(new SiteProxy({
                slug: this.slug,
                request: nameOf(new AdminCreateUser)
            }), request);

            this.$emit('done', model);
        });
    }
}
export default CreateUserModal;
Vue.component('create-user-modal', CreateUserModal);
