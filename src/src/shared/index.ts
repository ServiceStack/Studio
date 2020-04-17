import Vue from 'vue';
import {
    JsonServiceClient,
    GetNavItemsResponse,
    UserAttributes,
    IAuthSession,
    normalizeKey,
    toDate
} from '@servicestack/client';

declare let global: any; // populated from package.json/jest

export const client = new JsonServiceClient('/');

export const debug = true;

export {
    errorResponse, errorResponseExcept,
    splitOnFirst, toPascalCase,
    queryString,
} from '@servicestack/client';

export {
    ResponseStatus, ResponseError,
    Authenticate, AuthenticateResponse,
    Register,
    Hello, HelloResponse,
    AppPrefs, Condition
} from './dtos';

import {
    ResponseStatus,
    ResponseError,
    Authenticate,
    AuthenticateResponse,
    SiteSetting,
    AppMetadata,
    MetadataType,
    MetadataOperationType,
    GetSites,
    GetAppMetadata, Condition, AppPrefs, SaveSiteAppPrefs, MetadataPropertyType, SiteInvoke,
} from './dtos';

export enum Roles {
  Admin = 'Admin',
}

export interface IModelRef
{
    name: string;
    namespace?: string;
}

export interface LogItem {
    invoke:SiteInvoke;
}

// Shared state between all Components
interface State {
    nav: GetNavItemsResponse;
    userSession: IAuthSession | null;
    userAttributes?: string[];
    roles?: string[];
    permissions?: string[];
    sites: SiteSetting[];
    apps: { [id:string]: AppMetadata };
    appTypes: { [id:string]: { [name:string]:MetadataType} };
    appSessions: { [id:string]: IAuthSession };
    appLoading: { [id:string]: boolean };
    appErrors: { [id:string]: ResponseStatus };
    appDirty: {[id:string]:boolean};
    appLogEntries: {[id:string]:LogItem[]};
    getSite(slug:string): SiteSetting;
    getAppPrefs(slug:string): AppPrefs;
    getApp(slug:string): AppMetadata;
    getSession(slug:string): IAuthSession;
    getType(slug:string,typeRef:IModelRef): MetadataType|null;
    hasPlugin(slug:string, plugin:string): boolean;
    isDirty(slug:string): boolean;
    logInvoke(method:string,invoke:SiteInvoke): SiteInvoke;
}
export const store: State = {
    nav: global.NAV_ITEMS as GetNavItemsResponse,
    userSession: global.AUTH as AuthenticateResponse,
    userAttributes: UserAttributes.fromSession(global.AUTH),
    sites:[],
    apps:{},
    appTypes:{},
    appSessions:{},
    appLoading:{},
    appErrors:{},
    appDirty:{},
    appLogEntries:{},

    getSite(slug:string) { return this.sites.filter(x => x.slug == slug)[0]; },
    getApp(slug:string) { return store.apps[slug]; },
    getSession(slug:string) { return store.appSessions[slug]; },
    getAppPrefs(slug:string) { return store.getSite(slug)?.prefs; },
    getType(slug:string,typeRef:IModelRef) {
        if (!typeRef) return null;
        const siteTypes = store.appTypes[slug];
        const ret = siteTypes && siteTypes[typeRef.namespace + '.' + typeRef.name] || siteTypes['.' + typeRef.name];
        if (!ret) console.warn('Could not find type', typeRef.namespace, typeRef.name);
        return ret;
    },
    hasPlugin(slug:string, plugin:string) { 
        return store.getSite(slug)?.plugins?.indexOf(plugin) >= 0; 
    },
    isDirty(slug:string) {
        return store.appDirty[slug];
    },
    logInvoke(method:string,invoke:SiteInvoke) {
        const existingEntries = this.appLogEntries[invoke.slug] || [];
        const newEntries = [{ method, invoke }, ...existingEntries];
        Vue.set(this.appLogEntries, invoke.slug, newEntries);
        return invoke;
    }
};

export function log(...o:any[]) {
    if (debug) console.log.apply(console, arguments as any);
    return o;
}

export const isQuery = (op:MetadataOperationType) => op.request.inherits?.name?.startsWith('QueryDb`');

export const crudInterfaces = ['ICreateDb`1','IUpdateDb`1','IPatchDb`1','IDeleteDb`1'];

export const isCrud = (op:MetadataOperationType) => op.request.implements?.some(x => crudInterfaces.indexOf(x.name) >= 0);

export const matchesType = (x:IModelRef,y:IModelRef) =>
    (x && y) && x.name == y.name && ((!x.namespace || !y.namespace) || x.namespace == y.namespace);

export const collapsed = (slug:string, view:string) => {
    return (store.getAppPrefs(slug).views || []).indexOf(view) == -1;
};

export const toInvokeArgs = (args:{[id:string]:string}[]) => {
    var to:string[] = [];
    if (!args) return to;
    args.forEach(o => Object.keys(o).forEach(k => {
        to.push(k);
        to.push(o[k]);
    }));
    return to;
};

export const argsAsKvps = (args:string[]) => {
    const to = [];
    for (let i=0; i<args.length; i+=2) {
        to.push({ key:args[i], value:args[i+1] });
    }
    return to;
};

export const argsOf = (...args:any[]) => {
    const to = [];
    if (args.length % 2 != 0)
        throw { message: `Invalid number of arguments in argsOf: ${JSON.stringify(args)}` };
    for (let i=0; i<args.length; i+=2) {
        to.push(args[i]);
        to.push(args[i+1]);
    }
    return to;
};

export const getSiteInvoke = (invoke:SiteInvoke) => client.get(store.logInvoke('GET', invoke));
export const postSiteInvoke = (invoke:SiteInvoke) => client.post(store.logInvoke('POST', invoke));
export const putSiteInvoke = (invoke:SiteInvoke) => client.put(store.logInvoke('PUT', invoke));
export const patchSiteInvoke = (invoke:SiteInvoke) => client.patch(store.logInvoke('PATCH', invoke));
export const deleteSiteInvoke = (invoke:SiteInvoke) => client.delete(store.logInvoke('DELETE', invoke));

const zero = () => 0, doubleZero = () => 0.0;
const types:{[id:string]:() => any} = {
    Byte: zero, Int16: zero, Int32: zero, Int64: zero, SByte: zero, UInt16: zero, UInt32: zero, UInt64: zero,
    Double: doubleZero,
    Single: doubleZero,
    DateTime: () => new Date().toISOString(), DateTimeOffset: () => new Date().toISOString(),
    TimeSpan: () => '00:00:00',
};

export const defaultValue = (prop:MetadataPropertyType) => {
    const f = types[prop.type];
    return f ? f() : '';
};

export const editValue = (prop:MetadataPropertyType,value:any) => {
    if (typeof value == 'string') {
        if (value.startsWith('/Date(')) {
            return toDate(value).toISOString();
        }
    }
    return value;
};

export async function exec(c:any, fn:() => Promise<any>) {
    try {
        c.loading = true;
        c.responseStatus = null;

        return await fn();

    } catch (e) {
        c.responseStatus = e.responseStatus || e;
        c.$emit('error', c.responseStatus);
    } finally {
        c.loading = false;
    }
}

class EventBus extends Vue {
    store = store;
}
export const bus = new EventBus({ data: store });

export const canAccess = (slug:string, op:MetadataOperationType) => {
    if (!op.requiresAuth)
        return true;
    const session = store.appSessions[slug];
    if (!session)
        return false;
    const userRoles = session.roles || [];
    if (op.requiredRoles?.length > 0 && !op.requiredRoles.every(role => userRoles.indexOf(role) >= 0))
        return false;
    if (op.requiresAnyRole?.length > 0 && !op.requiresAnyRole.some(role => userRoles.indexOf(role) >= 0))
        return false;
    const userPermissions = session.permissions || [];
    if (op.requiredPermissions?.length > 0 && !op.requiredRoles.every(perm => userPermissions.indexOf(perm) >= 0))
        return false;
    if (op.requiresAnyPermission?.length > 0 && !op.requiresAnyPermission.every(perm => userPermissions.indexOf(perm) >= 0))
        return false;
    
    return true;
};

export const loadSite = async (slug:string, force?:boolean) => {
    if (store.appErrors[slug] && !force)
        return;
    
    let site = store.getSite(slug);
    try {
        bus.$emit('appLoading', { slug, result:true });
        if (!site)
        {
            const response = await client.get(new GetSites());
            bus.$emit('sites', response.sites);

            if (!response)
            {
                bus.$emit('appError', { slug, result:new ResponseStatus({ errorCode:'NotFound', message:`Site does not exist '${slug}'` }) });
                return;
            }
        }

        let metadata = store.getApp(slug);
        if (!metadata)
        {
            const response = await client.get(new GetAppMetadata({ slug:slug }));
            bus.$emit('app', response);
        }
    } catch (e) {
        bus.$emit('appError', { slug, result:e.responseStatus || e });
    } finally {
        bus.$emit('appLoading', { slug, result:false });
    }
};

// bus.$on('signout', async () => {
//     bus.$set(store, 'userSession', null);
//     bus.$set(store, 'userAttributes', null);
//
//     await client.post(new Authenticate({ provider: 'logout' }));
// });
// export const signout = () => bus.$emit('signout');
//
// bus.$on('signin', (userSession: AuthenticateResponse) => {
//     const userAttributes = UserAttributes.fromSession(userSession);
//     bus.$set(store, 'userSession', userSession);
//     bus.$set(store, 'userAttributes', userAttributes);
// });

bus.$on('sites', (sites:SiteSetting[]) => {
    bus.$set(store, 'sites', sites);
});

bus.$on('removeSite', (slug:string) => {
    bus.$set(store, 'sites', store.sites.filter(x => x.slug != slug));
    bus.$delete(store.apps, slug);
    bus.$delete(store.appTypes, slug);
    bus.$delete(store.appSessions, slug);
    bus.$delete(store.appLoading, slug);
    bus.$delete(store.appErrors, slug);
});

bus.$on('app', (app:{ slug:string, result:AppMetadata }) => {
    const newApps = Object.assign({}, store.apps);
    newApps[app.slug] = app.result;
    bus.$set(store, 'apps', newApps);
    
    const typesMap:{ [id:string]: MetadataType} = {};
    const api = app.result.api;
    const allTypes = [...api.types, 
                      ...api.operations.map(op => op.request), 
                      ...api.operations.filter(op => op.response).map(op => op.response)];
    allTypes.forEach(x => { //populate both specific + dto type
        if (x.namespace)
            typesMap[x.namespace + '.' + x.name] = x;
        typesMap['.' + x.name] = x;
    });
    const newAppTypes = Object.assign({}, store.appTypes);
    newAppTypes[app.slug] = typesMap;
    bus.$set(store, 'appTypes', newAppTypes);
});

bus.$on('savePrefs', async (siteResult:{ slug:string, callback:() => null }) => {
    const { slug, callback } = siteResult;
    log('savePrefs', slug );
    await client.post(new SaveSiteAppPrefs( { slug, appPrefs:store.getAppPrefs(slug) }));
    Vue.delete(store.appDirty, slug);
    if (callback) callback();
});

bus.$on('signout', (siteResult:{ slug:string }) => {
    const { slug } = siteResult;
    bus.$emit('appSession', { slug, result:null });
});

bus.$on('appSession', (siteResult:{ slug:string, result:IAuthSession }) => {
    const newSessions = Object.assign({}, store.appSessions);
    newSessions[siteResult.slug] = siteResult.result;
    bus.$set(store, 'appSessions', newSessions);
});
bus.$on('appLoading', (siteResult:{ slug:string, result:boolean }) => {
    const newLoading = Object.assign({}, store.appLoading);
    newLoading[siteResult.slug] = siteResult.result;
    bus.$set(store, 'appLoading', newLoading);
});
bus.$on('appError', (siteResult:{ slug:string, result:ResponseStatus }) => {
    log('appError', siteResult.slug, siteResult.result);
    const newErrors = Object.assign({}, store.appErrors);
    newErrors[siteResult.slug] = siteResult.result;
    bus.$set(store, 'appErrors', newErrors);
});

bus.$on('appPrefs', (siteResult:{ slug:string, request:string, queryConditions?:Condition[] }) => {
    const { slug, request, queryConditions } = siteResult;
    log('appPrefs', slug, request, queryConditions);
    const siteIndex = store.sites.findIndex(x => x.slug == slug);
    const site = store.sites[siteIndex];
    if (!site) return;
    if (queryConditions) {
        const appPrefs = site.prefs || new AppPrefs({ queryConditions:{} });
        Vue.set(appPrefs.queryConditions, request, queryConditions);
        Vue.set(site, 'prefs', appPrefs);
        Vue.set(store.sites, siteIndex, site);
    }
    Vue.set(store.appDirty, slug, true);
    log('isDirty', store.isDirty(slug));
});

export const checkAuth = async () => {
    try {
        bus.$emit('signin', await client.post(new Authenticate()));
    } catch (e) {
        bus.$emit('signout');
    }
};
