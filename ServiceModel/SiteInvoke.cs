using System.Collections.Generic;
using System.Runtime.Serialization;
using ServiceStack;

namespace Studio.ServiceModel
{
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
}