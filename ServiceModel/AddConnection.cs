using System;
using System.Collections.Generic;
using System.IO;
using System.Runtime.Serialization;
using Studio.ServiceInterface;
using ServiceStack;
using ServiceStack.Web;

namespace Studio.ServiceModel
{
    public class AddConnection : IReturn<AddConnectionResponse>
    {
        [Validate("NotNull")]
        public string BaseUrl { get; set; }
    }

    public class AddConnectionResponse
    {
        public string Slug { get; set; }
        
        public AppMetadata Result { get; set; }

        public List<SiteSetting> Sites { get; set; }

        public ResponseStatus ResponseStatus { get; set; }
    }
    
    public class RemoveConnection : IReturnVoid
    {
        [Validate("NotNull")]
        public string Slug { get; set; }
    }

    public class GetSites : IReturn<GetSitesResponse> {}

    public class GetSitesResponse
    {
        public List<SiteSetting> Sites { get; set; }

        public ResponseStatus ResponseStatus { get; set; }
    }

    public class GetAppMetadata : IReturn<GetAppMetadataResponse>
    {
        public string Slug { get; set; }
    }

    public class GetAppMetadataResponse
    {
        public string Slug { get; set; }
        public AppMetadata Result { get; set; }

        public ResponseStatus ResponseStatus { get; set; }
    }

    [Route("/sites/{Slug}")]
    public class SiteAuthenticate : IReturn<AuthenticateResponse>
    {
        public string Slug { get; set; }
        public string provider { get; set; }
        public string State { get; set; }
        public string oauth_token { get; set; }
        public string oauth_verifier { get; set; }
        public string UserName { get; set; }
        public string Password { get; set; }
        public bool? RememberMe { get; set; }

        public bool? UseTokenCookie { get; set; }

        public string AccessToken { get; set; }
        public string AccessTokenSecret { get; set; }
        public string scope { get; set; }
        public Dictionary<string, string> Meta { get; set; }
    }
    
    [DataContract]
    public class SiteInvoke : IReturn<string>
    {
        [DataMember(Order = 1)]
        public string Slug { get; set; }

        [DataMember(Order = 2)]
        public string Request { get; set; }

        [DataMember(Order = 3)]
        public List<string> Args { get; set; }
    }
    
    [DataContract]
    public class SiteProxy : IRequiresRequestStream
    {
        [DataMember(Order = 1)]
        public string Slug { get; set; }

        [DataMember(Order = 2)]
        public string Request { get; set; }

        [DataMember(Order = 3)]
        public List<string> Query { get; set; }

        public Stream RequestStream { get; set; }
    }
    
    [DataContract]
    public class SiteSettings
    {
        [DataMember(Name = "sites")]
        public List<SiteSetting> Sites { get; set; }
    }

    public class SiteSetting
    {
        public string Slug { get; set; }
        public string BaseUrl { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string IconUrl { get; set; }
        public List<string> Plugins { get; set; } 
        public List<string> Auth { get; set; } 
        public DateTime AddedDate { get; set; }
        public DateTime AccessDate { get; set; }
        public AppPrefs Prefs { get; set; }
    }

    public class Condition
    {
        public string SearchField { get; set; }
        public string SearchType { get; set; }
        public string SearchText { get; set; }
    }

    public class AppPrefs
    {
        public Dictionary<string, List<Condition>> QueryConditions { get; set; }
        public List<string> Views { get; set; }
    }

    public class GetSiteAppPrefs : IReturn<AppPrefs>
    {
        public string Slug { get; set; }
    }

    public class SaveSiteAppPrefs : IReturnVoid
    {
        public string Slug { get; set; }
        public AppPrefs AppPrefs { get; set; }
    }
    
}