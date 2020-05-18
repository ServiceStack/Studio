using System.Collections.Generic;

namespace Studio.ServiceModel.Types
{
    public class AppPrefs
    {
        public Dictionary<string, QueryPrefs> Query { get; set; }
        public List<string> Views { get; set; }
    }
    
    public class QueryPrefs
    {
        public string SearchField { get; set; }
        public string SearchType { get; set; }
        public string SearchText { get; set; }
        public int Skip { get; set; }
        public int Take { get; set; }
        public string OrderBy { get; set; }
        public Dictionary<string,string> Filters { get; set; }
        public List<string> Fields { get; set; }
    }
    
}