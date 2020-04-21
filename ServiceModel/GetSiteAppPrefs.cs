using ServiceStack;
using Studio.ServiceModel.Types;

namespace Studio.ServiceModel
{
    public class GetSiteAppPrefs : IReturn<AppPrefs>
    {
        public string Slug { get; set; }
    }
}