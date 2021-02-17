/* Options:
Date: 2020-10-26 00:56:24
Version: 5.9
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

export interface IGet
{
}

export interface IPost
{
}

export interface IPut
{
}

export interface IDelete
{
}

// @DataContract
export class AuditBase
{
    // @DataMember(Order=1)
    public createdDate: string;

    // @DataMember(Order=2)
    // @Required()
    public createdBy: string;

    // @DataMember(Order=3)
    public modifiedDate: string;

    // @DataMember(Order=4)
    // @Required()
    public modifiedBy: string;

    // @DataMember(Order=5)
    public deletedDate?: string;

    // @DataMember(Order=6)
    public deletedBy: string;

    public constructor(init?: Partial<AuditBase>) { (Object as any).assign(this, init); }
}

export class QueryPrefs
{
    public searchField: string;
    public searchType: string;
    public searchText: string;
    public skip: number;
    public take: number;
    public orderBy: string;
    public filters: { [index: string]: string; };
    public fields: string[];

    public constructor(init?: Partial<QueryPrefs>) { (Object as any).assign(this, init); }
}

export class AppPrefs
{
    public query: { [index: string]: QueryPrefs; };
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
    // @DataMember(Order=1)
    public errorCode: string;

    // @DataMember(Order=2)
    public message: string;

    // @DataMember(Order=3)
    public stackTrace: string;

    // @DataMember(Order=4)
    public errors: ResponseError[];

    // @DataMember(Order=5)
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
    public serviceRoutes: { [index: string]: string[]; };
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<AuthInfo>) { (Object as any).assign(this, init); }
}

export class AutoQueryConvention
{
    public name: string;
    public value: string;
    public types: string;
    public valueType: string;

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
    public spaFallback?: boolean;
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<SharpPagesInfo>) { (Object as any).assign(this, init); }
}

export class RequestLogsInfo
{
    public requiredRoles: string[];
    public requestLogger: string;
    public serviceRoutes: { [index: string]: string[]; };
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<RequestLogsInfo>) { (Object as any).assign(this, init); }
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

export class AdminUsersInfo
{
    public accessRole: string;
    public enabled: string[];
    public userAuth: MetadataType;
    public userAuthDetails: MetadataType;
    public allRoles: string[];
    public allPermissions: string[];
    public queryUserAuthProperties: string[];
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<AdminUsersInfo>) { (Object as any).assign(this, init); }
}

export class PluginInfo
{
    public loaded: string[];
    public auth: AuthInfo;
    public autoQuery: AutoQueryInfo;
    public validation: ValidationInfo;
    public sharpPages: SharpPagesInfo;
    public requestLogs: RequestLogsInfo;
    public adminUsers: AdminUsersInfo;
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<PluginInfo>) { (Object as any).assign(this, init); }
}

export class CustomPlugin
{
    public accessRole: string;
    public serviceRoutes: { [index: string]: string[]; };
    public enabled: string[];
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<CustomPlugin>) { (Object as any).assign(this, init); }
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
    public tags: string[];

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
    public customPlugins: { [index: string]: CustomPlugin; };
    public api: MetadataTypes;
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<AppMetadata>) { (Object as any).assign(this, init); }
}

// @DataContract
export class QueryBase
{
    // @DataMember(Order=1)
    public skip?: number;

    // @DataMember(Order=2)
    public take?: number;

    // @DataMember(Order=3)
    public orderBy: string;

    // @DataMember(Order=4)
    public orderByDesc: string;

    // @DataMember(Order=5)
    public include: string;

    // @DataMember(Order=6)
    public fields: string;

    // @DataMember(Order=7)
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
    // @DataMember(Order=1)
    public id: number;

    // @DataMember(Order=2)
    public eventType: string;

    // @DataMember(Order=3)
    public model: string;

    // @DataMember(Order=4)
    public modelId: string;

    // @DataMember(Order=5)
    public eventDate: string;

    // @DataMember(Order=6)
    public rowsUpdated?: number;

    // @DataMember(Order=7)
    public requestType: string;

    // @DataMember(Order=8)
    public requestBody: string;

    // @DataMember(Order=9)
    public userAuthId: string;

    // @DataMember(Order=10)
    public userAuthName: string;

    // @DataMember(Order=11)
    public remoteIp: string;

    // @DataMember(Order=12)
    public urn: string;

    // @DataMember(Order=13)
    public refId?: number;

    // @DataMember(Order=14)
    public refIdStr: string;

    // @DataMember(Order=15)
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<CrudEvent>) { (Object as any).assign(this, init); }
}

export class ValidateRule
{
    public validator: string;
    public condition: string;
    public errorCode: string;
    public message: string;

    public constructor(init?: Partial<ValidateRule>) { (Object as any).assign(this, init); }
}

export class ValidationRule extends ValidateRule
{
    public id: number;
    // @Required()
    public type: string;

    public field: string;
    public createdBy: string;
    public createdDate?: string;
    public modifiedBy: string;
    public modifiedDate?: string;
    public suspendedBy: string;
    public suspendedDate?: string;
    public notes: string;

    public constructor(init?: Partial<ValidationRule>) { super(init); (Object as any).assign(this, init); }
}

// @DataContract
export class AdminUserBase
{
    // @DataMember(Order=1)
    public userName: string;

    // @DataMember(Order=2)
    public firstName: string;

    // @DataMember(Order=3)
    public lastName: string;

    // @DataMember(Order=4)
    public displayName: string;

    // @DataMember(Order=5)
    public email: string;

    // @DataMember(Order=6)
    public password: string;

    // @DataMember(Order=7)
    public profileUrl: string;

    // @DataMember(Order=8)
    public userAuthProperties: { [index: string]: string; };

    // @DataMember(Order=9)
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<AdminUserBase>) { (Object as any).assign(this, init); }
}

export class ExportTypes implements IReturn<ExportTypes>
{
    public auditBase: AuditBase;

    public constructor(init?: Partial<ExportTypes>) { (Object as any).assign(this, init); }
    public createResponse() { return new ExportTypes(); }
    public getTypeName() { return 'ExportTypes'; }
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
    // @DataMember(Order=1)
    public userId: string;

    // @DataMember(Order=2)
    public sessionId: string;

    // @DataMember(Order=3)
    public userName: string;

    // @DataMember(Order=4)
    public displayName: string;

    // @DataMember(Order=5)
    public referrerUrl: string;

    // @DataMember(Order=6)
    public bearerToken: string;

    // @DataMember(Order=7)
    public refreshToken: string;

    // @DataMember(Order=8)
    public profileUrl: string;

    // @DataMember(Order=9)
    public roles: string[];

    // @DataMember(Order=10)
    public permissions: string[];

    // @DataMember(Order=11)
    public responseStatus: ResponseStatus;

    // @DataMember(Order=12)
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

export class ModifyConnectionResponse
{
    public slug: string;
    public result: AppMetadata;
    public sites: SiteSetting[];
    public responseStatus: ResponseStatus;

    public constructor(init?: Partial<ModifyConnectionResponse>) { (Object as any).assign(this, init); }
}

// @DataContract
export class QueryResponse<T>
{
    // @DataMember(Order=1)
    public offset: number;

    // @DataMember(Order=2)
    public total: number;

    // @DataMember(Order=3)
    public results: T[];

    // @DataMember(Order=4)
    public meta: { [index: string]: string; };

    // @DataMember(Order=5)
    public responseStatus: ResponseStatus;

    public constructor(init?: Partial<QueryResponse<T>>) { (Object as any).assign(this, init); }
}

// @DataContract
export class GetValidationRulesResponse
{
    // @DataMember(Order=1)
    public results: ValidationRule[];

    // @DataMember(Order=2)
    public responseStatus: ResponseStatus;

    public constructor(init?: Partial<GetValidationRulesResponse>) { (Object as any).assign(this, init); }
}

// @DataContract
export class AdminUserResponse
{
    // @DataMember(Order=1)
    public id: string;

    // @DataMember(Order=2)
    public result: { [index: string]: Object; };

    // @DataMember(Order=3)
    public responseStatus: ResponseStatus;

    public constructor(init?: Partial<AdminUserResponse>) { (Object as any).assign(this, init); }
}

// @DataContract
export class AdminUsersResponse
{
    // @DataMember(Order=1)
    public results: { [index:string]: Object; }[];

    // @DataMember(Order=2)
    public responseStatus: ResponseStatus;

    public constructor(init?: Partial<AdminUsersResponse>) { (Object as any).assign(this, init); }
}

// @DataContract
export class AdminDeleteUserResponse
{
    // @DataMember(Order=1)
    public id: string;

    // @DataMember(Order=2)
    public responseStatus: ResponseStatus;

    public constructor(init?: Partial<AdminDeleteUserResponse>) { (Object as any).assign(this, init); }
}

// @DataContract
export class AssignRolesResponse
{
    // @DataMember(Order=1)
    public allRoles: string[];

    // @DataMember(Order=2)
    public allPermissions: string[];

    // @DataMember(Order=3)
    public meta: { [index: string]: string; };

    // @DataMember(Order=4)
    public responseStatus: ResponseStatus;

    public constructor(init?: Partial<AssignRolesResponse>) { (Object as any).assign(this, init); }
}

// @DataContract
export class UnAssignRolesResponse
{
    // @DataMember(Order=1)
    public allRoles: string[];

    // @DataMember(Order=2)
    public allPermissions: string[];

    // @DataMember(Order=3)
    public meta: { [index: string]: string; };

    // @DataMember(Order=4)
    public responseStatus: ResponseStatus;

    public constructor(init?: Partial<UnAssignRolesResponse>) { (Object as any).assign(this, init); }
}

// @DataContract
export class RegisterResponse
{
    // @DataMember(Order=1)
    public userId: string;

    // @DataMember(Order=2)
    public sessionId: string;

    // @DataMember(Order=3)
    public userName: string;

    // @DataMember(Order=4)
    public referrerUrl: string;

    // @DataMember(Order=5)
    public bearerToken: string;

    // @DataMember(Order=6)
    public refreshToken: string;

    // @DataMember(Order=7)
    public responseStatus: ResponseStatus;

    // @DataMember(Order=8)
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
    // @DataMember(Order=1)
    public slug: string;

    // @DataMember(Order=2)
    public request: string;

    // @DataMember(Order=3)
    public args: string[];

    public constructor(init?: Partial<SiteInvoke>) { (Object as any).assign(this, init); }
    public createResponse() { return ''; }
    public getTypeName() { return 'SiteInvoke'; }
}

// @DataContract
export class SiteProxy implements IReturn<Uint8Array>
{
    // @DataMember(Order=1)
    public slug: string;

    // @DataMember(Order=2)
    public request: string;

    // @DataMember(Order=3)
    public query: string[];

    public constructor(init?: Partial<SiteProxy>) { (Object as any).assign(this, init); }
    public createResponse() { return new Uint8Array(0); }
    public getTypeName() { return 'SiteProxy'; }
}

export class ModifyConnection implements IReturn<ModifyConnectionResponse>
{
    public addBaseUrl: string;
    public removeSlug: string;

    public constructor(init?: Partial<ModifyConnection>) { (Object as any).assign(this, init); }
    public createResponse() { return new ModifyConnectionResponse(); }
    public getTypeName() { return 'ModifyConnection'; }
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

// @Route("/crudevents/{Model}")
// @DataContract
export class GetCrudEvents extends QueryDb<CrudEvent> implements IReturn<QueryResponse<CrudEvent>>
{
    // @DataMember(Order=1)
    public authSecret: string;

    // @DataMember(Order=2)
    public model: string;

    // @DataMember(Order=3)
    public modelId: string;

    public constructor(init?: Partial<GetCrudEvents>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new QueryResponse<CrudEvent>(); }
    public getTypeName() { return 'GetCrudEvents'; }
}

// @Route("/validation/rules/{Type}")
// @DataContract
export class GetValidationRules implements IReturn<GetValidationRulesResponse>
{
    // @DataMember(Order=1)
    public authSecret: string;

    // @DataMember(Order=2)
    public type: string;

    public constructor(init?: Partial<GetValidationRules>) { (Object as any).assign(this, init); }
    public createResponse() { return new GetValidationRulesResponse(); }
    public getTypeName() { return 'GetValidationRules'; }
}

// @Route("/validation/rules")
// @DataContract
export class ModifyValidationRules implements IReturnVoid
{
    // @DataMember(Order=1)
    public authSecret: string;

    // @DataMember(Order=2)
    public saveRules: ValidationRule[];

    // @DataMember(Order=3)
    public deleteRuleIds: number[];

    // @DataMember(Order=4)
    public suspendRuleIds: number[];

    // @DataMember(Order=5)
    public unsuspendRuleIds: number[];

    // @DataMember(Order=6)
    public clearCache?: boolean;

    public constructor(init?: Partial<ModifyValidationRules>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'ModifyValidationRules'; }
}

// @DataContract
export class AdminGetUser implements IReturn<AdminUserResponse>, IGet
{
    // @DataMember(Order=10)
    public id: string;

    public constructor(init?: Partial<AdminGetUser>) { (Object as any).assign(this, init); }
    public createResponse() { return new AdminUserResponse(); }
    public getTypeName() { return 'AdminGetUser'; }
}

// @DataContract
export class AdminQueryUsers implements IReturn<AdminUsersResponse>, IGet
{
    // @DataMember(Order=1)
    public query: string;

    // @DataMember(Order=2)
    public orderBy: string;

    // @DataMember(Order=3)
    public skip?: number;

    // @DataMember(Order=4)
    public take?: number;

    public constructor(init?: Partial<AdminQueryUsers>) { (Object as any).assign(this, init); }
    public createResponse() { return new AdminUsersResponse(); }
    public getTypeName() { return 'AdminQueryUsers'; }
}

// @DataContract
export class AdminCreateUser extends AdminUserBase implements IReturn<AdminUserResponse>, IPost
{
    // @DataMember(Order=10)
    public roles: string[];

    // @DataMember(Order=11)
    public permissions: string[];

    public constructor(init?: Partial<AdminCreateUser>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new AdminUserResponse(); }
    public getTypeName() { return 'AdminCreateUser'; }
}

// @DataContract
export class AdminUpdateUser extends AdminUserBase implements IReturn<AdminUserResponse>, IPut
{
    // @DataMember(Order=10)
    public id: string;

    // @DataMember(Order=11)
    public lockUser?: boolean;

    // @DataMember(Order=12)
    public unlockUser?: boolean;

    // @DataMember(Order=13)
    public addRoles: string[];

    // @DataMember(Order=14)
    public removeRoles: string[];

    // @DataMember(Order=15)
    public addPermissions: string[];

    // @DataMember(Order=16)
    public removePermissions: string[];

    public constructor(init?: Partial<AdminUpdateUser>) { super(init); (Object as any).assign(this, init); }
    public createResponse() { return new AdminUserResponse(); }
    public getTypeName() { return 'AdminUpdateUser'; }
}

// @DataContract
export class AdminDeleteUser implements IReturn<AdminDeleteUserResponse>, IDelete
{
    // @DataMember(Order=10)
    public id: string;

    public constructor(init?: Partial<AdminDeleteUser>) { (Object as any).assign(this, init); }
    public createResponse() { return new AdminDeleteUserResponse(); }
    public getTypeName() { return 'AdminDeleteUser'; }
}

// @Route("/script")
export class EvalScript implements IReturn<string>
{
    public authSecret: string;
    public evaluateScript: string;
    public evaluateCode: string;
    public evaluateLisp: string;
    public renderScript: string;
    public renderCode: string;
    public renderLisp: string;
    public evaluateScriptAsync: string;
    public evaluateCodeAsync: string;
    public evaluateLispAsync: string;
    public renderScriptAsync: string;
    public renderCodeAsync: string;
    public renderLispAsync: string;

    public constructor(init?: Partial<EvalScript>) { (Object as any).assign(this, init); }
    public createResponse() { return ''; }
    public getTypeName() { return 'EvalScript'; }
}

// @Route("/desktop/downloads/{File}/url/{Url*}")
export class DesktopDownloadUrl implements IReturnVoid
{
    public file: string;
    public url: string;
    public open: boolean;
    public start: string;

    public constructor(init?: Partial<DesktopDownloadUrl>) { (Object as any).assign(this, init); }
    public createResponse() {}
    public getTypeName() { return 'DesktopDownloadUrl'; }
}

// @Route("/auth")
// @Route("/auth/{provider}")
// @DataContract
export class Authenticate implements IReturn<AuthenticateResponse>, IPost
{
    // @DataMember(Order=1)
    public provider: string;

    // @DataMember(Order=2)
    public state: string;

    // @DataMember(Order=3)
    public oauth_token: string;

    // @DataMember(Order=4)
    public oauth_verifier: string;

    // @DataMember(Order=5)
    public userName: string;

    // @DataMember(Order=6)
    public password: string;

    // @DataMember(Order=7)
    public rememberMe?: boolean;

    // @DataMember(Order=9)
    public errorView: string;

    // @DataMember(Order=10)
    public nonce: string;

    // @DataMember(Order=11)
    public uri: string;

    // @DataMember(Order=12)
    public response: string;

    // @DataMember(Order=13)
    public qop: string;

    // @DataMember(Order=14)
    public nc: string;

    // @DataMember(Order=15)
    public cnonce: string;

    // @DataMember(Order=16)
    public useTokenCookie?: boolean;

    // @DataMember(Order=17)
    public accessToken: string;

    // @DataMember(Order=18)
    public accessTokenSecret: string;

    // @DataMember(Order=19)
    public scope: string;

    // @DataMember(Order=20)
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<Authenticate>) { (Object as any).assign(this, init); }
    public createResponse() { return new AuthenticateResponse(); }
    public getTypeName() { return 'Authenticate'; }
}

// @Route("/assignroles")
// @DataContract
export class AssignRoles implements IReturn<AssignRolesResponse>, IPost
{
    // @DataMember(Order=1)
    public userName: string;

    // @DataMember(Order=2)
    public permissions: string[];

    // @DataMember(Order=3)
    public roles: string[];

    // @DataMember(Order=4)
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<AssignRoles>) { (Object as any).assign(this, init); }
    public createResponse() { return new AssignRolesResponse(); }
    public getTypeName() { return 'AssignRoles'; }
}

// @Route("/unassignroles")
// @DataContract
export class UnAssignRoles implements IReturn<UnAssignRolesResponse>, IPost
{
    // @DataMember(Order=1)
    public userName: string;

    // @DataMember(Order=2)
    public permissions: string[];

    // @DataMember(Order=3)
    public roles: string[];

    // @DataMember(Order=4)
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<UnAssignRoles>) { (Object as any).assign(this, init); }
    public createResponse() { return new UnAssignRolesResponse(); }
    public getTypeName() { return 'UnAssignRoles'; }
}

// @Route("/register")
// @DataContract
export class Register implements IReturn<RegisterResponse>, IPost
{
    // @DataMember(Order=1)
    public userName: string;

    // @DataMember(Order=2)
    public firstName: string;

    // @DataMember(Order=3)
    public lastName: string;

    // @DataMember(Order=4)
    public displayName: string;

    // @DataMember(Order=5)
    public email: string;

    // @DataMember(Order=6)
    public password: string;

    // @DataMember(Order=7)
    public confirmPassword: string;

    // @DataMember(Order=8)
    public autoLogin?: boolean;

    // @DataMember(Order=10)
    public errorView: string;

    // @DataMember(Order=11)
    public meta: { [index: string]: string; };

    public constructor(init?: Partial<Register>) { (Object as any).assign(this, init); }
    public createResponse() { return new RegisterResponse(); }
    public getTypeName() { return 'Register'; }
}
