/* Options:
Date: 2020-04-18 06:59:38
Version: 5.8
Tip: To override a DTO option, remove "//" prefix before updating
BaseUrl: https://localhost:5002

//GlobalNamespace: 
//MakePropertiesOptional: False
//AddServiceStackTypes: True
//AddResponseStatus: False
//AddImplicitVersion: 
//AddDescriptionAsComments: True
//IncludeTypes: 
//ExcludeTypes: 
//DefaultImports: 
*/


export interface IReturn<T>
{
    createResponse(): T;
}

export interface IReturnVoid
{
    createResponse(): void;
}

export interface IHasSessionId
{
    sessionId: string;
}

export interface IHasBearerToken
{
    bearerToken: string;
}

export interface IPost
{
}

export class AppPrefs
{
    public queryConditions: { [index: string]: Condition[]; };
    public views: string[];

    public constructor(init?: Partial<AppPrefs>) { (Object as any).assign(this, init); }
}

export class SiteSetting
{
    public slug: string;
    public baseUrl: string;
    public name: string;
    public description: string;
    public iconUrl: string;
    public plugins: string[];
    public auth: string[];
    public addedDate: string;
    public accessDate: string;
    public prefs: AppPrefs;

    public constructor(init?: Partial<SiteSetting>) { (Object as any).assign(this, init); }
}

// @DataContract
export class ResponseError
{
    // @DataMember(Order=1)
    public errorCode: string;

    // @DataMember(Order=2)
    public fieldName: string;

    // @DataMember(Order=3)
    public message: string;

    // @DataMember(Order=4)
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<ResponseError>) { (Object as any).assign(this, init); }
}

// @DataContract
export class ResponseStatus
{
    // @DataMember(Order=1, EmitDefaultValue=true)
    public errorCode: string;

    // @DataMember(Order=2, EmitDefaultValue=true)
    public message: string;

    // @DataMember(Order=3, EmitDefaultValue=true)
    public stackTrace: string;

    // @DataMember(Order=4, EmitDefaultValue=true)
    public errors: ResponseError[];

    // @DataMember(Order=5, EmitDefaultValue=true)
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<ResponseStatus>) { (Object as any).assign(this, init); }
}

export class AppInfo
{
    public baseUrl: string;
    public serviceStackVersion: string;
    public serviceName: string;
    public serviceDescription: string;
    public serviceIconUrl: string;
    public brandUrl: string;
    public brandImageUrl: string;
    public textColor: string;
    public linkColor: string;
    public backgroundColor: string;
    public backgroundImageUrl: string;
    public iconUrl: string;
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<AppInfo>) { (Object as any).assign(this, init); }
}

export class NavItem
{
    public label: string;
    public href: string;
    public exact?: boolean;
    public id: string;
    public className: string;
    public iconClass: string;
    public show: string;
    public hide: string;
    public children: NavItem[];
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<NavItem>) { (Object as any).assign(this, init); }
}

export class MetaAuthProvider
{
    public name: string;
    public type: string;
    public navItem: NavItem;
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<MetaAuthProvider>) { (Object as any).assign(this, init); }
}

export class AuthInfo
{
    public hasAuthSecret?: boolean;
    public hasAuthRepository?: boolean;
    public includesRoles?: boolean;
    public includesOAuthTokens?: boolean;
    public htmlRedirect: string;
    public authProviders: MetaAuthProvider[];
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<AuthInfo>) { (Object as any).assign(this, init); }
}

export class AutoQueryConvention
{
    public name: string;
    public value: string;
    public types: string;

    public constructor(init?: Partial<AutoQueryConvention>) { (Object as any).assign(this, init); }
}

export class AutoQueryInfo
{
    public maxLimit?: number;
    public untypedQueries?: boolean;
    public rawSqlFilters?: boolean;
    public autoQueryViewer?: boolean;
    public async?: boolean;
    public orderByPrimaryKey?: boolean;
    public crudEvents?: boolean;
    public crudEventsServices?: boolean;
    public accessRole: string;
    public namedConnection: string;
    public viewerConventions: AutoQueryConvention[];
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<AutoQueryInfo>) { (Object as any).assign(this, init); }
}

export class ScriptMethodType
{
    public name: string;
    public paramNames: string[];
    public paramTypes: string[];
    public returnType: string;

    public constructor(init?: Partial<ScriptMethodType>) { (Object as any).assign(this, init); }
}

export class ValidationInfo
{
    public hasValidationSource?: boolean;
    public hasValidationSourceAdmin?: boolean;
    public serviceRoutes: { [index: string]: string[]; };
    public typeValidators: ScriptMethodType[];
    public propertyValidators: ScriptMethodType[];
    public accessRole: string;
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<ValidationInfo>) { (Object as any).assign(this, init); }
}

export class SharpPagesInfo
{
    public apiPath: string;
    public scriptAdminRole: string;
    public metadataDebugAdminRole: string;
    public metadataDebug?: boolean;
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<SharpPagesInfo>) { (Object as any).assign(this, init); }
}

export class PluginInfo
{
    public loaded: string[];
    public auth: AuthInfo;
    public autoQuery: AutoQueryInfo;
    public validation: ValidationInfo;
    public sharpPages: SharpPagesInfo;
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<PluginInfo>) { (Object as any).assign(this, init); }
}

export class MetadataTypesConfig
{
    public baseUrl: string;
    public usePath: string;
    public makePartial: boolean;
    public makeVirtual: boolean;
    public makeInternal: boolean;
    public baseClass: string;
    public package: string;
    public addReturnMarker: boolean;
    public addDescriptionAsComments: boolean;
    public addDataContractAttributes: boolean;
    public addIndexesToDataMembers: boolean;
    public addGeneratedCodeAttributes: boolean;
    public addImplicitVersion?: number;
    public addResponseStatus: boolean;
    public addServiceStackTypes: boolean;
    public addModelExtensions: boolean;
    public addPropertyAccessors: boolean;
    public excludeGenericBaseTypes: boolean;
    public settersReturnThis: boolean;
    public makePropertiesOptional: boolean;
    public exportAsTypes: boolean;
    public excludeImplementedInterfaces: boolean;
    public addDefaultXmlNamespace: string;
    public makeDataContractsExtensible: boolean;
    public initializeCollections: boolean;
    public addNamespaces: string[];
    public defaultNamespaces: string[];
    public defaultImports: string[];
    public includeTypes: string[];
    public excludeTypes: string[];
    public treatTypesAsStrings: string[];
    public exportValueTypes: boolean;
    public globalNamespace: string;
    public excludeNamespace: boolean;
    public ignoreTypes: string[];
    public exportTypes: string[];
    public exportAttributes: string[];
    public ignoreTypesInNamespaces: string[];

    public constructor(init?: Partial<MetadataTypesConfig>) { (Object as any).assign(this, init); }
}

export class MetadataTypeName
{
    public name: string;
    public namespace: string;
    public genericArgs: string[];

    public constructor(init?: Partial<MetadataTypeName>) { (Object as any).assign(this, init); }
}

export class MetadataDataContract
{
    public name: string;
    public namespace: string;

    public constructor(init?: Partial<MetadataDataContract>) { (Object as any).assign(this, init); }
}

export class MetadataDataMember
{
    public name: string;
    public order?: number;
    public isRequired?: boolean;
    public emitDefaultValue?: boolean;

    public constructor(init?: Partial<MetadataDataMember>) { (Object as any).assign(this, init); }
}

export class MetadataAttribute
{
    public name: string;
    public constructorArgs: MetadataPropertyType[];
    public args: MetadataPropertyType[];

    public constructor(init?: Partial<MetadataAttribute>) { (Object as any).assign(this, init); }
}

export class MetadataPropertyType
{
    public name: string;
    public type: string;
    public isValueType?: boolean;
    public isSystemType?: boolean;
    public isEnum?: boolean;
    public isPrimaryKey?: boolean;
    public typeNamespace: string;
    public genericArgs: string[];
    public value: string;
    public description: string;
    public dataMember: MetadataDataMember;
    public readOnly?: boolean;
    public paramType: string;
    public displayType: string;
    public isRequired?: boolean;
    public allowableValues: string[];
    public allowableMin?: number;
    public allowableMax?: number;
    public attributes: MetadataAttribute[];

    public constructor(init?: Partial<MetadataPropertyType>) { (Object as any).assign(this, init); }
}

export class MetadataType
{
    public name: string;
    public namespace: string;
    public genericArgs: string[];
    public inherits: MetadataTypeName;
    public implements: MetadataTypeName[];
    public displayType: string;
    public description: string;
    public isNested?: boolean;
    public isEnum?: boolean;
    public isEnumInt?: boolean;
    public isInterface?: boolean;
    public isAbstract?: boolean;
    public dataContract: MetadataDataContract;
    public properties: MetadataPropertyType[];
    public attributes: MetadataAttribute[];
    public innerTypes: MetadataTypeName[];
    public enumNames: string[];
    public enumValues: string[];
    public enumMemberValues: string[];
    public enumDescriptions: string[];
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<MetadataType>) { (Object as any).assign(this, init); }
}

export class MetadataRoute
{
    public path: string;
    public verbs: string;
    public notes: string;
    public summary: string;

    public constructor(init?: Partial<MetadataRoute>) { (Object as any).assign(this, init); }
}

export class MetadataOperationType
{
    public request: MetadataType;
    public response: MetadataType;
    public actions: string[];
    public returnsVoid: boolean;
    public returnType: MetadataTypeName;
    public routes: MetadataRoute[];
    public dataModel: MetadataTypeName;
    public viewModel: MetadataTypeName;
    public requiresAuth: boolean;
    public requiredRoles: string[];
    public requiresAnyRole: string[];
    public requiredPermissions: string[];
    public requiresAnyPermission: string[];

    public constructor(init?: Partial<MetadataOperationType>) { (Object as any).assign(this, init); }
}

export class MetadataTypes
{
    public config: MetadataTypesConfig;
    public namespaces: string[];
    public types: MetadataType[];
    public operations: MetadataOperationType[];

    public constructor(init?: Partial<MetadataTypes>) { (Object as any).assign(this, init); }
}

export class AppMetadata
{
    public app: AppInfo;
    public contentTypeFormats: { [index: string]: string; };
    public plugins: PluginInfo;
    public api: MetadataTypes;
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<AppMetadata>) { (Object as any).assign(this, init); }
}

// @DataContract
export class QueryBase
{
    // @DataMember(Order=1, EmitDefaultValue=true)
    public skip?: number;

    // @DataMember(Order=2, EmitDefaultValue=true)
    public take?: number;

    // @DataMember(Order=3, EmitDefaultValue=true)
    public orderBy: string;

    // @DataMember(Order=4, EmitDefaultValue=true)
    public orderByDesc: string;

    // @DataMember(Order=5, EmitDefaultValue=true)
    public include: string;

    // @DataMember(Order=6, EmitDefaultValue=true)
    public fields: string;

    // @DataMember(Order=7, EmitDefaultValue=true)
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<QueryBase>) { (Object as any).assign(this, init); }
}

export class QueryDb<T> extends QueryBase
{

    public constructor(init?: Partial<QueryDb<T>>) { super(init); (Object as any).assign(this, init); }
}

// @DataContract
export class CrudEvent
{
    // @DataMember(Order=1, EmitDefaultValue=true)
    public id: number;

    // @DataMember(Order=2, EmitDefaultValue=true)
    public eventType: string;

    // @DataMember(Order=3, EmitDefaultValue=true)
    public model: string;

    // @DataMember(Order=4, EmitDefaultValue=true)
    public modelId: string;

    // @DataMember(Order=5, EmitDefaultValue=true)
    public eventDate: string;

    // @DataMember(Order=6, EmitDefaultValue=true)
    public rowsUpdated?: number;

    // @DataMember(Order=7, EmitDefaultValue=true)
    public requestType: string;

    // @DataMember(Order=8, EmitDefaultValue=true)
    public requestBody: string;

    // @DataMember(Order=9, EmitDefaultValue=true)
    public userAuthId: string;

    // @DataMember(Order=10, EmitDefaultValue=true)
    public userAuthName: string;

    // @DataMember(Order=11, EmitDefaultValue=true)
    public remoteIp: string;

    // @DataMember(Order=12, EmitDefaultValue=true)
    public urn: string;

    // @DataMember(Order=13, EmitDefaultValue=true)
    public refId?: number;

    // @DataMember(Order=14, EmitDefaultValue=true)
    public refIdStr: string;

    // @DataMember(Order=15, EmitDefaultValue=true)
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<CrudEvent>) { (Object as any).assign(this, init); }
}

export class Condition
{
    public searchField: string;
    public searchType: string;
    public searchText: string;

    public constructor(init?: Partial<Condition>) { (Object as any).assign(this, init); }
}

export class GetSitesResponse
{
    public sites: SiteSetting[];
    public responseStatus: ResponseStatus;

    public constructor(init?: Partial<GetSitesResponse>) { (Object as any).assign(this, init); }
}

// @DataContract
export class AuthenticateResponse implements IHasSessionId, IHasBearerToken
{
    // @DataMember(Order=11, EmitDefaultValue=true)
    public responseStatus: ResponseStatus;

    // @DataMember(Order=1, EmitDefaultValue=true)
    public userId: string;

    // @DataMember(Order=2, EmitDefaultValue=true)
    public sessionId: string;

    // @DataMember(Order=3, EmitDefaultValue=true)
    public userName: string;

    // @DataMember(Order=4, EmitDefaultValue=true)
    public displayName: string;

    // @DataMember(Order=5, EmitDefaultValue=true)
    public referrerUrl: string;

    // @DataMember(Order=6, EmitDefaultValue=true)
    public bearerToken: string;

    // @DataMember(Order=7, EmitDefaultValue=true)
    public refreshToken: string;

    // @DataMember(Order=8, EmitDefaultValue=true)
    public profileUrl: string;

    // @DataMember(Order=9, EmitDefaultValue=true)
    public roles: string[];

    // @DataMember(Order=10, EmitDefaultValue=true)
    public permissions: string[];

    // @DataMember(Order=12, EmitDefaultValue=true)
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<AuthenticateResponse>) { (Object as any).assign(this, init); }
}

export class GetAppMetadataResponse
{
    public slug: string;
    public result: AppMetadata;
    public responseStatus: ResponseStatus;

    public constructor(init?: Partial<GetAppMetadataResponse>) { (Object as any).assign(this, init); }
}

export class AddConnectionResponse
{
    public slug: string;
    public result: AppMetadata;
    public sites: SiteSetting[];
    public responseStatus: ResponseStatus;

    public constructor(init?: Partial<AddConnectionResponse>) { (Object as any).assign(this, init); }
}

export class HelloResponse
{
    public result: string;

    public constructor(init?: Partial<HelloResponse>) { (Object as any).assign(this, init); }
}

// @DataContract
export class QueryResponse<T>
{
    // @DataMember(Order=1, EmitDefaultValue=true)
    public offset: number;

    // @DataMember(Order=2, EmitDefaultValue=true)
    public total: number;

    // @DataMember(Order=3, EmitDefaultValue=true)
    public results: T[];

    // @DataMember(Order=4, EmitDefaultValue=true)
    public meta: { [index: string]: string; };

    // @DataMember(Order=5, EmitDefaultValue=true)
    public responseStatus: ResponseStatus;

    public constructor(init?: Partial<QueryResponse<T>>) { (Object as any).assign(this, init); }
}

// @DataContract
export class AssignRolesResponse
{
    // @DataMember(Order=1, EmitDefaultValue=true)
    public allRoles: string[];

    // @DataMember(Order=2, EmitDefaultValue=true)
    public allPermissions: string[];

    // @DataMember(Order=3, EmitDefaultValue=true)
    public meta: { [index: string]: string; };

    // @DataMember(Order=4, EmitDefaultValue=true)
    public responseStatus: ResponseStatus;

    public constructor(init?: Partial<AssignRolesResponse>) { (Object as any).assign(this, init); }
}

// @DataContract
export class UnAssignRolesResponse
{
    // @DataMember(Order=1, EmitDefaultValue=true)
    public allRoles: string[];

    // @DataMember(Order=2, EmitDefaultValue=true)
    public allPermissions: string[];

    // @DataMember(Order=3, EmitDefaultValue=true)
    public meta: { [index: string]: string; };

    // @DataMember(Order=4, EmitDefaultValue=true)
    public responseStatus: ResponseStatus;

    public constructor(init?: Partial<UnAssignRolesResponse>) { (Object as any).assign(this, init); }
}

// @DataContract
export class RegisterResponse
{
    // @DataMember(Order=1, EmitDefaultValue=true)
    public userId: string;

    // @DataMember(Order=2, EmitDefaultValue=true)
    public sessionId: string;

    // @DataMember(Order=3, EmitDefaultValue=true)
    public userName: string;

    // @DataMember(Order=4, EmitDefaultValue=true)
    public referrerUrl: string;

    // @DataMember(Order=5, EmitDefaultValue=true)
    public bearerToken: string;

    // @DataMember(Order=6, EmitDefaultValue=true)
    public refreshToken: string;

    // @DataMember(Order=7, EmitDefaultValue=true)
    public responseStatus: ResponseStatus;

    // @DataMember(Order=8, EmitDefaultValue=true)
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<RegisterResponse>) { (Object as any).assign(this, init); }
}

export class GetSites implements IReturn<GetSitesResponse>
{

    public constructor(init?: Partial<GetSites>) { (Object as any).assign(this, init); }
    public createResponse() { return new GetSitesResponse(); }
    public getTypeName() { return 'GetSites'; }
}

// @Route("/sites/{Slug}")
export class SiteAuthenticate implements IReturn<AuthenticateResponse>
{
    public slug: string;
    public provider: string;
    public state: string;
    public oauth_token: string;
    public oauth_verifier: string;
    public userName: string;
    public password: string;
    public rememberMe?: boolean;
    public useTokenCookie?: boolean;
    public accessToken: string;
    public accessTokenSecret: string;
    public scope: string;
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<SiteAuthenticate>) { (Object as any).assign(this, init); }
    public createResponse() { return new AuthenticateResponse(); }
    public getTypeName() { return 'SiteAuthenticate'; }
}

export class GetAppMetadata implements IReturn<GetAppMetadataResponse>
{
    public slug: string;

    public constructor(init?: Partial<GetAppMetadata>) { (Object as any).assign(this, init); }
    public createResponse() { return new GetAppMetadataResponse(); }
    public getTypeName() { return 'GetAppMetadata'; }
}

// @DataContract
export class SiteInvoke implements IReturn<string>
{
    // @DataMember(Order=1, EmitDefaultValue=true)
    public slug: string;

    // @DataMember(Order=2, EmitDefaultValue=true)
    public request: string;

    // @DataMember(Order=3, EmitDefaultValue=true)
    public args: string[];

    public constructor(init?: Partial<SiteInvoke>) { (Object as any).assign(this, init); }
    public createResponse() { return ''; }
    public getTypeName() { return 'SiteInvoke'; }
}

// @DataContract
export class SiteProxy
{
    // @DataMember(Order=1, EmitDefaultValue=true)
    public slug: string;

    // @DataMember(Order=2, EmitDefaultValue=true)
    public request: string;

    // @DataMember(Order=3, EmitDefaultValue=true)
    public query: string[];

    public constructor(init?: Partial<SiteProxy>) { (Object as any).assign(this, init); }
}

export class RemoveConnection implements IReturnVoid
{
    // @Validate(Validator="NotNull")
    public slug: string;

    public constructor(init?: Partial<RemoveConnection>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'RemoveConnection'; }
}

export class AddConnection implements IReturn<AddConnectionResponse>
{
    // @Validate(Validator="NotNull")
    public baseUrl: string;

    public constructor(init?: Partial<AddConnection>) { (Object as any).assign(this, init); }
    public createResponse() { return new AddConnectionResponse(); }
    public getTypeName() { return 'AddConnection'; }
}

export class GetSiteAppPrefs implements IReturn<AppPrefs>
{
    public slug: string;

    public constructor(init?: Partial<GetSiteAppPrefs>) { (Object as any).assign(this, init); }
    public createResponse() { return new AppPrefs(); }
    public getTypeName() { return 'GetSiteAppPrefs'; }
}

export class SaveSiteAppPrefs implements IReturnVoid
{
    public slug: string;
    public appPrefs: AppPrefs;

    public constructor(init?: Partial<SaveSiteAppPrefs>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'SaveSiteAppPrefs'; }
}

// @Route("/hello")
// @Route("/hello/{Name}")
export class Hello implements IReturn<HelloResponse>
{
    public name: string;

    public constructor(init?: Partial<Hello>) { (Object as any).assign(this, init); }
    public createResponse() { return new HelloResponse(); }
    public getTypeName() { return 'Hello'; }
}

// @Route("/crudevents/{Model}")
// @DataContract
export class GetCrudEvents extends QueryDb<CrudEvent> implements IReturn<QueryResponse<CrudEvent>>
{
    // @DataMember(Order=1, EmitDefaultValue=true)
    public authSecret: string;

    // @DataMember(Order=2, EmitDefaultValue=true)
    public model: string;

    // @DataMember(Order=3, EmitDefaultValue=true)
    public id: string;

    public constructor(init?: Partial<GetCrudEvents>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new QueryResponse<CrudEvent>(); }
    public getTypeName() { return 'GetCrudEvents'; }
}

// @Route("/auth")
// @Route("/auth/{provider}")
// @DataContract
export class Authenticate implements IReturn<AuthenticateResponse>, IPost
{
    // @DataMember(Order=1, EmitDefaultValue=true)
    public provider: string;

    // @DataMember(Order=2, EmitDefaultValue=true)
    public state: string;

    // @DataMember(Order=3, EmitDefaultValue=true)
    public oauth_token: string;

    // @DataMember(Order=4, EmitDefaultValue=true)
    public oauth_verifier: string;

    // @DataMember(Order=5, EmitDefaultValue=true)
    public userName: string;

    // @DataMember(Order=6, EmitDefaultValue=true)
    public password: string;

    // @DataMember(Order=7, EmitDefaultValue=true)
    public rememberMe?: boolean;

    // @DataMember(Order=9, EmitDefaultValue=true)
    public errorView: string;

    // @DataMember(Order=10, EmitDefaultValue=true)
    public nonce: string;

    // @DataMember(Order=11, EmitDefaultValue=true)
    public uri: string;

    // @DataMember(Order=12, EmitDefaultValue=true)
    public response: string;

    // @DataMember(Order=13, EmitDefaultValue=true)
    public qop: string;

    // @DataMember(Order=14, EmitDefaultValue=true)
    public nc: string;

    // @DataMember(Order=15, EmitDefaultValue=true)
    public cnonce: string;

    // @DataMember(Order=16, EmitDefaultValue=true)
    public useTokenCookie?: boolean;

    // @DataMember(Order=17, EmitDefaultValue=true)
    public accessToken: string;

    // @DataMember(Order=18, EmitDefaultValue=true)
    public accessTokenSecret: string;

    // @DataMember(Order=19, EmitDefaultValue=true)
    public scope: string;

    // @DataMember(Order=20, EmitDefaultValue=true)
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<Authenticate>) { (Object as any).assign(this, init); }
    public createResponse() { return new AuthenticateResponse(); }
    public getTypeName() { return 'Authenticate'; }
}

// @Route("/assignroles")
// @DataContract
export class AssignRoles implements IReturn<AssignRolesResponse>, IPost
{
    // @DataMember(Order=1, EmitDefaultValue=true)
    public userName: string;

    // @DataMember(Order=2, EmitDefaultValue=true)
    public permissions: string[];

    // @DataMember(Order=3, EmitDefaultValue=true)
    public roles: string[];

    // @DataMember(Order=4, EmitDefaultValue=true)
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<AssignRoles>) { (Object as any).assign(this, init); }
    public createResponse() { return new AssignRolesResponse(); }
    public getTypeName() { return 'AssignRoles'; }
}

// @Route("/unassignroles")
// @DataContract
export class UnAssignRoles implements IReturn<UnAssignRolesResponse>, IPost
{
    // @DataMember(Order=1, EmitDefaultValue=true)
    public userName: string;

    // @DataMember(Order=2, EmitDefaultValue=true)
    public permissions: string[];

    // @DataMember(Order=3, EmitDefaultValue=true)
    public roles: string[];

    // @DataMember(Order=4, EmitDefaultValue=true)
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<UnAssignRoles>) { (Object as any).assign(this, init); }
    public createResponse() { return new UnAssignRolesResponse(); }
    public getTypeName() { return 'UnAssignRoles'; }
}

// @Route("/register")
// @DataContract
export class Register implements IReturn<RegisterResponse>, IPost
{
    // @DataMember(Order=1, EmitDefaultValue=true)
    public userName: string;

    // @DataMember(Order=2, EmitDefaultValue=true)
    public firstName: string;

    // @DataMember(Order=3, EmitDefaultValue=true)
    public lastName: string;

    // @DataMember(Order=4, EmitDefaultValue=true)
    public displayName: string;

    // @DataMember(Order=5, EmitDefaultValue=true)
    public email: string;

    // @DataMember(Order=6, EmitDefaultValue=true)
    public password: string;

    // @DataMember(Order=7, EmitDefaultValue=true)
    public confirmPassword: string;

    // @DataMember(Order=8, EmitDefaultValue=true)
    public autoLogin?: boolean;

    // @DataMember(Order=10, EmitDefaultValue=true)
    public errorView: string;

    // @DataMember(Order=11, EmitDefaultValue=true)
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<Register>) { (Object as any).assign(this, init); }
    public createResponse() { return new RegisterResponse(); }
    public getTypeName() { return 'Register'; }
}

