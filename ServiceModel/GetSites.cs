using System.Collections.Generic;
using ServiceStack;
using Studio.ServiceModel.Types;

namespace Studio.ServiceModel
{
    public class GetSites : IReturn<GetSitesResponse> { }

    public class GetSitesResponse
    {
        public List<SiteSetting> Sites { get; set; }

        public ResponseStatus ResponseStatus { get; set; }
    }
}