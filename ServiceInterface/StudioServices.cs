using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Studio.ServiceModel;
using ServiceStack;
using ServiceStack.Auth;
using ServiceStack.DataAnnotations;
using ServiceStack.Text;
using ServiceStack.Web;
using Studio.ServiceModel.Types;

namespace Studio.ServiceInterface
{
    public class SiteInfo
    {
        public string BaseUrl { get; set; }
        public string Slug { get; set; }
        public string Name { get; set; }
        public AppMetadata Metadata { get; set; }
        public List<string> Plugins { get; set; } 
        public List<string> Auth { get; set; } 
        public DateTime AddedDate { get; set; }
        public DateTime AccessDate { get; set; }
        
        public AppPrefs Prefs { get; set; }
    }

    public class SiteSession
    {
        public string Slug { get; set; }
        public string SessionId { get; set; }
        public string BearerToken { get; set; }
        public string UserName { get; set; }
        public string Password { get; set; }
        public string AuthSecret { get; set; }
        public AuthenticateResponse User { get; set; } 

        public static string GetKey(IRequest req, string slug)
        {
            return $"urn:sitesession:{slug}:{req.GetSessionId()}";
        }

        public static SiteSession Create(SiteAuthenticate request, AuthenticateResponse user)
        {
            var to = new SiteSession {
                Slug = request.Slug,
                User = user,
            };
            if (user != null && request.provider != "authsecret")
            {
                if (!string.IsNullOrEmpty(user.BearerToken))
                    to.BearerToken = user.BearerToken;
                else if (!string.IsNullOrEmpty(user.SessionId))
                    to.SessionId = user.SessionId;
            }
            if (request.AccessToken != null)
            {
                if (request.provider == "bearer")
                    to.BearerToken = request.AccessToken;
                else if (request.provider == "session")
                    to.SessionId = request.AccessToken;
                else if (request.provider == "authsecret")
                    to.AuthSecret = request.AccessToken;
            }
            return to;
        }
    }

    public class StudioServices : Service
    {
        public static ConcurrentDictionary<string, SiteInfo> Sites =
            new ConcurrentDictionary<string, SiteInfo>(StringComparer.OrdinalIgnoreCase);
        
        public object Any(GetSites request) => new GetSitesResponse {
            Sites = CreateSiteSettings().Sites,
        };
        
        static readonly HashSet<string> nonProviders = new HashSet<string> {
            "bearer",
            "session",
            "authsecret",
        };

        public object Any(SiteAuthenticate request)
        {
            var siteInfo = AssertSite(request.Slug);
            var siteSession = SessionBag.Get<SiteSession>();
            if (siteSession?.User != null && request.provider != AuthenticateService.LogoutAction)
                return siteSession.User;

            try
            {
                var client = CreateSiteClient(siteInfo);
                var authRequest = request.ConvertTo<Authenticate>();

                if (request.AccessToken?.IndexOf(':') >= 0) //required for AuthProviders needing both Access+Secret (e.g. twitter)
                {
                    authRequest.AccessTokenSecret = request.AccessToken.LeftPart(':'); //secret is first part when both provided
                    authRequest.AccessToken = request.AccessToken.RightPart(':');
                } 
                    
                if (nonProviders.Contains(request.provider))
                {
                    authRequest.provider = null;
                    if (request.provider == "bearer")
                    {
                        client.BearerToken = request.AccessToken;
                    }
                    else if (request.provider == "session")
                    {
                        client.SetSessionId(request.AccessToken);
                    }
                    else if (request.provider == "authsecret")
                    {
                        client.Headers[HttpHeaders.XParamOverridePrefix + Keywords.AuthSecret] = request.AccessToken;
                    }
                }

                var response = client.Post(authRequest);
                siteSession = SiteSession.Create(request, response);
                SessionBag.Set(siteSession);
            }
            finally
            {
                if (request.provider == AuthenticateService.LogoutAction)
                {
                    SessionBag.Remove<SiteSession>();
                    siteSession = null;
                }
            }
            
            return siteSession?.User;
        }
        
        public object Any(GetAppMetadata request)
        {
            AssertSite(request.Slug);

            var site = GetSite(request.Slug);
            return new GetAppMetadataResponse {
                Slug = request.Slug,
                Result = InitSite(site).Metadata,
            };
        }

        private static string ToUrlEncoded(List<string> args)
        {
            if (!args.IsEmpty())
            {
                if (args.Count % 2 != 0)
                    throw new ArgumentException(@"Invalid odd number of arguments, expected [key1,value1,key2,value2,...]", nameof(SiteInvoke.Args));

                var sb = StringBuilderCache.Allocate();
                for (var i = 0; i < args.Count; i += 2)
                {
                    if (sb.Length > 0)
                        sb.Append('&');
                    
                    var key = args[i];
                    var val = args[i + 1];
                    sb.Append(key).Append('=').Append(val.UrlEncode());
                }
                return StringBuilderCache.ReturnAndFree(sb);
            }
            return string.Empty;
        }

        public async Task Any(SiteInvoke request)
        {
            var site = AssertSite(request.Slug);
            if (request.Request == null)
                throw new ArgumentNullException(nameof(request.Request));

            var url = site.BaseUrl.CombineWith("json", "reply", request.Request);
            var qs = ToUrlEncoded(request.Args);
            var sendInBody = HttpUtils.HasRequestBody(Request.Verb);
            if (!string.IsNullOrEmpty(qs) && !sendInBody)
            {
                url += "?" + qs;
            }

            var webReq = CreateSiteWebRequest(site, url);
            ProxyFeatureHandler.InitWebRequest(Request as IHttpRequest, webReq);

            if (!string.IsNullOrEmpty(qs) && sendInBody)
            {
                webReq.ContentType = MimeTypes.FormUrlEncoded;
                await using var requestStream = await webReq.GetRequestStreamAsync();
                await requestStream.WriteAsync(MemoryProvider.Instance.ToUtf8(qs));
            }
            
            var proxy = new ProxyFeatureHandler();
            await proxy.ProxyToResponse((IHttpResponse) Response, webReq);
        }

        public async Task Any(SiteProxy request)
        {
            var site = AssertSite(request.Slug);
            if (request.Request == null)
                throw new ArgumentNullException(nameof(request.Request));

            var url = site.BaseUrl.CombineWith("json", "reply", request.Request);
            var qs = ToUrlEncoded(request.Query);
            if (!string.IsNullOrEmpty(qs))
                url += "?" + qs;

            var webReq = CreateSiteWebRequest(site, url);

            var proxy = new ProxyFeatureHandler();
            await proxy.ProxyRequestAsync((IHttpRequest) Request, webReq);
        }

        private static SiteInfo GetSite(string slug) => 
            Sites.Values.FirstOrDefault(x => x.Slug == slug);

        private static SiteInfo AssertSite(string slug) => string.IsNullOrEmpty(slug) 
            ? throw new ArgumentNullException(nameof(SiteInfo.Slug)) 
            : GetSite(slug) ?? throw HttpError.NotFound("Site does not exist");

        private JsonServiceClient CreateSiteClient(SiteInfo siteInfo)
        {
            var client = new JsonServiceClient(siteInfo.BaseUrl);
            var siteSession = SessionBag.Get<SiteSession>();
            if (siteSession != null)
            {
                if (siteSession.BearerToken != null)
                {
                    client.BearerToken = siteSession.BearerToken;
                }
                else if (siteSession.SessionId != null)
                {
                    client.RequestFilter = req => 
                        req.Headers["X-" + Keywords.SessionId] = siteSession.SessionId;
                }
                else if (siteSession.UserName != null && siteSession.Password != null)
                {
                    client.SetCredentials(siteSession.UserName, siteSession.Password);
                }
                else if (siteSession.AuthSecret != null)
                {
                    client.RequestFilter = req => 
                        req.Headers[HttpHeaders.XParamOverridePrefix + Keywords.AuthSecret] = siteSession.AuthSecret;
                }
            }
            return client;
        }

        private HttpWebRequest CreateSiteWebRequest(SiteInfo siteInfo, string url)
        {
            var req = (HttpWebRequest)WebRequest.Create(url);
            var siteSession = SessionBag.Get<SiteSession>();
            if (siteSession != null)
            {
                if (siteSession.BearerToken != null)
                {
                    req.AddBearerToken(siteSession.BearerToken);
                }
                else if (siteSession.SessionId != null)
                {
                    var overrideParam = "X-" + Keywords.SessionId;
                    req.Headers[overrideParam] = siteSession.SessionId;
                }
                else if (siteSession.UserName != null && siteSession.Password != null)
                {
                    req.AddBasicAuth(siteSession.UserName, siteSession.Password);
                }
                else if (siteSession.AuthSecret != null)
                {
                    var overrideParam = HttpHeaders.XParamOverridePrefix + Keywords.AuthSecret;
                    req.Headers[overrideParam] = siteSession.AuthSecret;
                }
            }
            return req;
        }

        public object Any(ModifyConnection request)
        {
            if (!string.IsNullOrEmpty(request.AddBaseUrl))
            {
                var baseUrl = request.AddBaseUrl;
                if ((baseUrl.Contains("://") && Sites.TryGetValue(baseUrl, out var site)) ||
                    Sites.TryGetValue("http://" + baseUrl, out site) ||
                    Sites.TryGetValue("https://" + baseUrl, out site))
                {
                    return new ModifyConnectionResponse {
                        Slug = site.Slug,
                        Sites = CreateSiteSettings().Sites,
                        Result = InitSite(site).Metadata,
                    };
                }

                var useBaseUrl = baseUrl;
                if (baseUrl.IndexOf("://", StringComparison.Ordinal) == -1)
                    useBaseUrl = "https://" + baseUrl;

                AppMetadata appMetadata;
                try 
                { 
                    appMetadata = GetAppMetadata(useBaseUrl);
                }
                catch (Exception e)
                {
                    if (useBaseUrl == baseUrl)
                        throw;

                    appMetadata = GetAppMetadata("http://" + useBaseUrl);
                }

                var slug = useBaseUrl.RightPart("://").SafeVarName().Replace("__","_");
                var siteInfo = new SiteInfo {
                    BaseUrl = useBaseUrl,
                    Slug = slug,
                    Metadata = appMetadata,
                    AddedDate = DateTime.Now,
                    AccessDate = DateTime.Now,
                };

                Sites[useBaseUrl] = siteInfo;

                SaveSettings();
            
                return new ModifyConnectionResponse {
                    Slug = slug,
                    Result = appMetadata,
                    Sites = CreateSiteSettings().Sites,
                };
            }

            if (!string.IsNullOrEmpty(request.RemoveSlug))
            {
                string removeKey = null;
                foreach (var entry in Sites)
                {
                    if (entry.Value.Slug == request.RemoveSlug)
                    {
                        removeKey = entry.Key;
                        break;
                    }
                }

                if (removeKey != null && Sites.TryRemove(removeKey, out _))
                {
                    SaveSettings();
                }
                
                return new ModifyConnection();
            }

            throw new ArgumentNullException(nameof(ModifyConnection.AddBaseUrl));
        }

        private SiteInfo InitSite(SiteInfo site)
        {
            if (site == null)
                throw HttpError.NotFound("Site not found");

            site.AccessDate = DateTime.Now;
            if (site.Metadata == null)
            {
                site.Metadata = GetAppMetadata(site.BaseUrl);
                site.Name = site.Metadata.App.ServiceName;
            }
            SaveSettings();
            return site;
        }

        public object Any(GetSiteAppPrefs request)
        {
            var site = AssertSite(request.Slug);
            return site.Prefs;
        }

        public void Any(SaveSiteAppPrefs request)
        {
            var site = AssertSite(request.Slug);
            site.Prefs = request.AppPrefs;
            SaveSettings();
        }

        private static AppMetadata GetAppMetadata(string baseUrl)
        {
            string appResponseJson = null;
            try
            {
                appResponseJson = baseUrl.CombineWith("/metadata/app.json")
                    .GetJsonFromUrl();
            
                if (!appResponseJson.Trim().StartsWith("{"))
                    throw new Exception("Not a remote ServiceStack Instance");
            }
            catch (Exception appEx)
            {
                string ssMetadata;
                try
                {
                    ssMetadata = baseUrl.CombineWith("/metadata").GetStringFromUrl();
                }
                catch (Exception ssEx)
                {
                    throw new Exception("Not a remote ServiceStack Instance", ssEx);
                }

                if (ssMetadata.IndexOf("https://servicestack.net", StringComparison.Ordinal) == -1)
                    throw new Exception("Not a remote ServiceStack Instance");

                throw new Exception("ServiceStack Instance v5.8.1 or higher required", appEx);
            }

            AppMetadata appMetadata;
            try
            {
                appMetadata = appResponseJson.FromJson<AppMetadata>();
            }
            catch (Exception e)
            {
                throw new Exception("Could not read AppMetadata, try upgrading this App or remote ServiceStack Instance", e);
            }

            return appMetadata;
        }

        public void SaveSettings()
        {
            var settingsPath = GetAppSettingsPath();
            try
            {
                var settings = CreateSiteSettings();
                using var scope = CreateJsScope();
                var json = settings.ToJson().IndentJson();
                File.WriteAllText(settingsPath, json);
            }
            catch (Exception e)
            {
                throw new Exception($"Could not save to '{settingsPath}'", e);
            }
        }

        private static JsConfigScope CreateJsScope()
        {
            return JsConfig.With(new Config {
                DateHandler = DateHandler.ISO8601,
            });
        }

        private static SiteSettings CreateSiteSettings()
        {
            var settings = new SiteSettings {
                Sites = Sites.Values.OrderByDescending(x => x.AccessDate).Map(x => new SiteSetting {
                    Slug = x.Slug,
                    BaseUrl = x.BaseUrl,
                    AddedDate = x.AddedDate,
                    AccessDate = x.AccessDate,
                    Name = x.Metadata?.App.ServiceName ?? x.Name,
                    Description = x.Metadata?.App.ServiceDescription,
                    IconUrl = x.Metadata?.App.IconUrl,
                    Plugins = x.Metadata?.Plugins.Loaded ?? x.Plugins,
                    Auth = x.Metadata?.Plugins.Auth?.AuthProviders.Map(a => a.Name) ?? x.Auth,
                    Prefs = x.Prefs.OnSave(),
                }),
            };
            return settings;
        }

        public static ConcurrentDictionary<string, SiteInfo> LoadAppSettings()
        {
            var appSettingsPath = GetAppSettingsPath();
            try
            {
                Directory.CreateDirectory(Path.GetDirectoryName(appSettingsPath));
            }
            catch {}
            if (File.Exists(appSettingsPath))
            {
                try 
                { 
                    using var scope = CreateJsScope();
                    var json = File.ReadAllText(appSettingsPath);
                    var siteSettings = json.FromJson<SiteSettings>();
                    foreach (var siteSetting in siteSettings.Sites.Safe())
                    {
                        var siteInfo = siteSetting.ConvertTo<SiteInfo>();
                        Sites[siteInfo.BaseUrl] = siteInfo;
                    }
                }
                catch (Exception e)
                {
                    throw new Exception($"Could not load '{appSettingsPath}': {e.Message}", e);
                }
            }
            return Sites;
        }

        public static string GetAppSettingsPath()
        {
            var settingsPath = Path.Combine(GetAppPath(), "site.settings");
            return settingsPath;
        }

        public static string GetAppPath()
        {
            var homeDir = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            return Path.Combine(homeDir, ".servicestack", "studio");
        }
    }

    public static class AppExtensions
    {
        public static AppPrefs OnSave(this AppPrefs prefs)
        {
            if (prefs == null) return null;

            if (prefs.QueryConditions != null)
            {
                var keysToRemove = new List<string>();
                foreach (var entry in prefs.QueryConditions)
                {
                    if (entry.Value.IsEmpty())
                        keysToRemove.Add(entry.Key);
                }
                keysToRemove.Each(x => prefs.QueryConditions.Remove(x));
            }
            
            return prefs;
        }
    }
}