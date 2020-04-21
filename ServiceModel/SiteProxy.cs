using System.Collections.Generic;
using System.IO;
using System.Runtime.Serialization;
using ServiceStack;
using ServiceStack.Web;

namespace Studio.ServiceModel
{
    [DataContract]
    public class SiteProxy : IRequiresRequestStream, IReturn<byte[]>
    {
        [DataMember(Order = 1)]
        public string Slug { get; set; }

        [DataMember(Order = 2)]
        public string Request { get; set; }

        [DataMember(Order = 3)]
        public List<string> Query { get; set; }

        public Stream RequestStream { get; set; }
    }
}