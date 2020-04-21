using System.Collections.Generic;
using ServiceStack;

namespace Studio.ServiceModel
{
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
}