import Vue from 'vue';
import {
    getField,
    GetNavItemsResponse,
    IAuthSession,
    JsonServiceClient,
    padInt,
    splitOnFirst,
    toDate,
    toDateFmt, trimEnd,
    UserAttributes
} from '@servicestack/client';
import {
    AppMetadata,
    AppPrefs,
    Authenticate,
    AuthenticateResponse,
    GetAppMetadata,
    GetSites,
    MetadataOperationType,
    MetadataPropertyType,
    MetadataType,
    QueryPrefs,
    ResponseStatus,
    SaveSiteAppPrefs,
    SiteInvoke,
    SiteProxy,
    SiteSetting,
} from './dtos';
import {desktopInfo, evaluateCode} from '@servicestack/desktop';

declare let global: any; // populated from package.json/jest

export const client = new JsonServiceClient('/');

export {
    errorResponse, errorResponseExcept,
    splitOnFirst, toPascalCase,
    queryString,
} from '@servicestack/client';

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

export interface DesktopInfo {
    tool:string;
    toolVersion:string;
    chromeVersion:string;
}
export interface ColumnSchema {
    columnName: string;
    dataType: string;
}

let logId = 0;

// Shared state between all Components
interface State {
    debug: boolean|null;
    desktop: DesktopInfo|null;
    hasExcel: boolean|null;
    connect:string|null;
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
    hasRole(slug:string,role:string):boolean;
    getType(slug:string,typeRef:IModelRef): MetadataType|null;
    getTypeProperties(slug:string,typeRef:IModelRef): MetadataPropertyType[];
    hasPlugin(slug:string, plugin:string): boolean;
    isDirty(slug:string): boolean;
    logInvoke(method:string,invoke:SiteInvoke,response:string): string;
    logProxy(method:string,proxy:SiteProxy,body:string,response:string): string;
}
export const store: State = {
    debug: global.CONFIG.debug as boolean,
    desktop: global.CONFIG.desktop as DesktopInfo,
    hasExcel: global.CONFIG.hasExcel as boolean || false,
    connect: global.CONFIG.connect as string|null,
    nav: global.CONFIG.nav as GetNavItemsResponse,
    userSession: global.CONFIG.auth as AuthenticateResponse,
    userAttributes: UserAttributes.fromSession(global.CONFIG.auth),
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
    hasRole(slug:string, role:string) {
        if (role == 'AllowAnon') return true;
        const session = this.getSession(slug);
        if (!session) return false;
        if (isAdminAuth(session)) return true;
        if (role == 'AllowAnyUser') return true;
        const roles = session.roles || [];
        return role && roles.indexOf(role) >= 0 || false;
    },
    getAppPrefs(slug:string) { 
        const ret = store.getSite(slug)?.prefs;
        if (ret) {
            if (!ret.query) ret.query = {};
        }
        return ret;
    },
    getType(slug:string,typeRef:IModelRef) {
        if (!typeRef) return null;
        const siteTypes = store.appTypes[slug];
        const ret = siteTypes && siteTypes[typeRef.namespace + '.' + typeRef.name] || siteTypes['.' + typeRef.name];
        if (!ret) console.warn('Could not find type', typeRef.namespace, typeRef.name);
        return ret;
    },
    getTypeProperties(slug:string,typeRef:IModelRef) {
        let to:MetadataPropertyType[] = [];
        let type = this.getType(slug, typeRef);
        while (type?.properties != null) {
            for (let i=0; i<type.properties.length; i++) {
                to.push(type.properties[i]);
            }
            type = this.getType(slug, type.inherits);
        }
        return to;
    },
    hasPlugin(slug:string, plugin:string) { 
        return store.getSite(slug)?.plugins?.indexOf(plugin) >= 0; 
    },
    isDirty(slug:string) {
        return store.appDirty[slug];
    },
    logInvoke(method:string,invoke:SiteInvoke, response:string) {
        const existingEntries = this.appLogEntries[invoke.slug] || [];
        const newEntries = [{ id:++logId, method, invoke, response }, ...existingEntries];
        Vue.set(this.appLogEntries, invoke.slug, newEntries);
        return response;
    },
    logProxy(method:string, proxy:SiteProxy, body:any, response:string) {
        log('logProxy', method, proxy, body);
        const existingEntries = this.appLogEntries[proxy.slug] || [];
        const newEntries = [{ id:++logId, method, proxy, body, response }, ...existingEntries];
        Vue.set(this.appLogEntries, proxy.slug, newEntries);
        return response;
    }
};

(async () => {
    try {
        store.desktop = await desktopInfo();
        log('In Desktop app:', store.desktop);
    } catch (e) {
        log(`Not in Desktop app:`, e);
    }
})();

export function isAdminAuth(session:IAuthSession) {
    return session && session.roles && session.roles.indexOf('Admin') >= 0;
}

export function log(...o:any[]) {
    if (store.debug) 
        console.log.apply(console, arguments as any);
    return o;
}

export async function openUrl(url:string) {
    if (store.desktop) {
        await evaluateCode(`openUrl('${url}')`);
    } else {
        window.open(url);
    }
}

export const isQuery = (op:MetadataOperationType) => op.request.inherits?.name?.startsWith('QueryDb`');

export const crudInterfaces = ['ICreateDb`1','IUpdateDb`1','IPatchDb`1','IDeleteDb`1'];

export const isCrud = (op:MetadataOperationType) => op.request.implements?.some(x => crudInterfaces.indexOf(x.name) >= 0);

export const matchesType = (x:IModelRef,y:IModelRef) =>
    (x && y) && x.name == y.name && ((!x.namespace || !y.namespace) || x.namespace == y.namespace);

export const collapsed = (slug:string, view:string) => {
    return (store.getAppPrefs(slug)?.views || []).indexOf(view) == -1;
};

export const toInvokeArgs = (args:{[id:string]:string}[],encode=true) => {
    const to:string[] = [];
    if (!args) return to;
    args.forEach(o => Object.keys(o).forEach(k => {
        to.push(k);
        to.push(encode ? invokeValue(o[k]) : o[k]);
    }));
    return to;
};

//Need to rewrite ',' in values so SiteInvoke.Args doesn't treat as multiple fields 
export const invokeValue = (s:string) => s.indexOf(',') >= 0 ? s.replace(/,/g,String.fromCharCode(31)) : s;

export const argsAsKvps = (args:string[]) => {
    const to = [];
    for (let i=0; i<args.length; i+=2) {
        to.push({ key:args[i], value:args[i+1] });
    }
    return to;
};

export const KeyCodes = {
    UnitSeparator: `\x1F`
};

export const dtoAsArgs = (dto:{[id:string]:any}) => {
    const to:string[] = [];
    for (let k in dto) {
        const val = dto[k];
        if (typeof val == 'function') continue;
        to.push(k);
        if (Array.isArray(val)) {
            to.push(val.join(KeyCodes.UnitSeparator));
        } else {
            to.push(`${val}`);
        }
    }
    return to;
};

export const getSiteInvoke = async (invoke:SiteInvoke) => 
    siteExec(invoke.slug, async () => store.logInvoke('GET', invoke, await client.get(invoke)));
export const postSiteInvoke = async (invoke:SiteInvoke) =>
    siteExec(invoke.slug, async () => store.logInvoke('POST', invoke, await client.post(invoke)));
export const putSiteInvoke = async (invoke:SiteInvoke) =>
    siteExec(invoke.slug, async () => store.logInvoke('PUT', invoke, await client.put(invoke)));
export const patchSiteInvoke = async (invoke:SiteInvoke) => siteExec(invoke.slug, async () =>
    siteExec(invoke.slug, async () => store.logInvoke('PATCH', invoke, await client.patch(invoke))));
export const deleteSiteInvoke = async (invoke:SiteInvoke) =>
    siteExec(invoke.slug, async () => store.logInvoke('DELETE', invoke, await client.delete(invoke)));

const decodeBody = (body:any) => {
    if (body == null)
        return null;
    if (body instanceof ArrayBuffer || body instanceof Uint8Array)
        return new TextDecoder("utf-8").decode(body);
    if (typeof body == 'string')
        return JSON.parse(body);
    return body;
}

export const postSiteProxy = async (proxy:SiteProxy,body:any) => store.logProxy('POST', proxy, body,
    decodeBody(await client.postBody(proxy, body)));
export const putSiteProxy = async (proxy:SiteProxy,body:any) => store.logProxy('PUT', proxy, body,
    decodeBody(await client.putBody(proxy, body)));

const zero = () => 0, doubleZero = () => 0.0;
const types:{[id:string]:() => any} = {
    Byte: zero, Int16: zero, Int32: zero, Int64: zero, SByte: zero, UInt16: zero, UInt32: zero, UInt64: zero,
    Double: doubleZero, Single: doubleZero, Decimal: doubleZero,
    DateTime: () => new Date().toISOString(), DateTimeOffset: () => new Date().toISOString(),
    TimeSpan: () => '00:00:00',
    Guid: () => '00000000000000000000000000000000',
    Boolean: () => false,
};

export const dateFmtHMS = (d: Date = new Date()) =>
    `${d.getFullYear()-2000}${padInt(d.getMonth() + 1)}${padInt(d.getDate())}-${padInt(d.getHours())}${padInt(d.getMinutes())}${padInt(d.getSeconds())}`;

export const defaultValue = (prop:MetadataPropertyType) => {
    const f = types[prop.type];
    return f ? f() : '';
};

export const editValue = (prop:MetadataPropertyType,value:any) => {
    // log(prop.name, prop.type, prop.isValueType, value);
    return value;
};

export function sanitizedModel(model:any):{[index:string]:any} {
  let to:any = {};
  Object.keys(model).forEach(k => {
      if (model[k] !== '') {
          to[k] = model[k];
      }
  });
  return to;
}

export function toPropsMap(props:MetadataPropertyType[]) {
    let to:{[index:string]:MetadataPropertyType} = {};
    for (let i=0; i<props.length; i++) {
        let prop = props[i];
        to[prop.name] = prop;
    }
    return to;
}

export const getId = (type:MetadataType, row:any) => {
    const pk = type.properties.find(x => x.isPrimaryKey);
    return pk && getField(row, pk.name);
};

export function renderValue(o: any) {
    return Array.isArray(o)
        ? o.join(', ')
        : typeof o == "undefined"
            ? ""
            : typeof o == "object"
                ? JSON.stringify(o)
                : o + "";
}

export function allKeys(results:any[]) {
    const props:{ [index:string]: string; } = {};
    if (results?.length > 0) {
        results.forEach((row) =>
            Object.keys(row).forEach(h =>
                props[h] = h));
    }
    return Object.keys(props);
}

export function gridProps(grid:string[][],props:MetadataPropertyType[]) {
    const to:MetadataPropertyType[][] = [];
    const propMap:{[index:string]:MetadataPropertyType} = {};
    props.forEach(x => propMap[x.name] = x);
    const added:{[index:string]:string} = {};
    grid.forEach(r => {
        const propRow:MetadataPropertyType[] = [];
        r.forEach(f => {
            const propType = propMap[f];
            if (propType != null) {
                propRow.push(propType);
                added[f] = f;
            }
        });
        if (propRow.length > 0)
            to.push(propRow);
    });
    props.filter(p => !added[p.name]).forEach(p => to.push([p]));
    return to;
}

export function initInlineModal(id:string) {
    let modal = document.querySelector(id) as HTMLDivElement;
    let parentRect = modal.parentElement!.getBoundingClientRect();
    modal.style.top = (parentRect.top) + 'px';
}

export async function siteExec(slug:string, fn:(() => Promise<any>)) {
    try {
        const ret = await fn();
        return ret;
    } catch (e) {
        log('siteExec',slug,e);
        if ((e.responseStatus || e).errorCode === 'Unauthorized') {
            bus.$emit('signout', { slug });
        }
        throw e;
    }
}

export async function exec(c:any, fn:() => Promise<any>) {
    try {
        c.loading = true;
        c.responseStatus = null;
        c.success = null;

        return await fn();

    } catch (e) {
        log(e);
        c.responseStatus = e.responseStatus || (typeof e == 'string' ? { errorCode:'Error', message:e } : null) || e;
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
    if (isAdminAuth(session))
        return true;
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
    
    log(`loading site: ${slug}...`);
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

Vue.filter('upper', function (value:string) {
    return value?.toUpperCase();
});
Vue.filter('datefmt', function (value:string) {
    return toDateFmt(value);
});

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
    log('on$app', app.slug, app.result);
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
    log('signout',slug);
    bus.$emit('appSession', { slug, result:null });
    bus.$emit('signedout');
});

bus.$on('appSession', (siteResult:{ slug:string, result:IAuthSession }) => {
    const newSessions = Object.assign({}, store.appSessions);
    newSessions[siteResult.slug] = siteResult.result;
    bus.$set(store, 'appSessions', newSessions);
    if (siteResult.result) {
        bus.$emit('signedin');
    }
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

bus.$on('appPrefs', (siteResult:{ slug:string, request:string, query?:QueryPrefs }) => {
    const { slug, request, query } = siteResult;
    log('appPrefs', slug, request, query);
    const siteIndex = store.sites.findIndex(x => x.slug == slug);
    const site = store.sites[siteIndex];
    if (!site) return;
    if (query) {
        const appPrefs = site.prefs || new AppPrefs({ query:{} });
        Vue.set(appPrefs.query, request, query);
        Vue.set(site, 'prefs', appPrefs);
        Vue.set(store.sites, siteIndex, site);
    }
    Vue.set(store.appDirty, slug, true);
    log('isDirty', store.isDirty(slug));
    bus.$emit('savePrefs', { slug });
});

export const checkAuth = async () => {
    try {
        bus.$emit('signin', await client.post(new Authenticate()));
    } catch (e) {
        bus.$emit('signout');
    }
};
