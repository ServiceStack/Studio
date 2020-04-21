using System;
using System.Collections.Generic;
using ServiceStack;
using Studio.ServiceModel.Types;

namespace Studio.ServiceModel
{
    public class ModifyConnection : IReturn<ModifyConnectionResponse>
    {
        public string AddBaseUrl { get; set; }
        public string RemoveSlug { get; set; }
    }

    public class ModifyConnectionResponse
    {
        public string Slug { get; set; }
        
        public AppMetadata Result { get; set; }

        public List<SiteSetting> Sites { get; set; }

        public ResponseStatus ResponseStatus { get; set; }
    }
}