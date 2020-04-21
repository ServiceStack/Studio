using ServiceStack;
using Studio.ServiceModel.Types;

namespace Studio.ServiceModel
{
    public class SaveSiteAppPrefs : IReturnVoid
    {
        public string Slug { get; set; }
        public AppPrefs AppPrefs { get; set; }
    }
}