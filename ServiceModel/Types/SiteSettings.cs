using System;
using System.Collections.Generic;
using System.Runtime.Serialization;

namespace Studio.ServiceModel.Types
{
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
}