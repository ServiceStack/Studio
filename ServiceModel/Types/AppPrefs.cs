using System.Collections.Generic;

namespace Studio.ServiceModel.Types
{
    public class AppPrefs
    {
        public Dictionary<string, List<Condition>> QueryConditions { get; set; }
        public List<string> Views { get; set; }
    }

    public class Condition
    {
        public string SearchField { get; set; }
        public string SearchType { get; set; }
        public string SearchText { get; set; }
    }
    
}