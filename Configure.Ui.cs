using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using ServiceStack;

namespace Studio
{
    public class ConfigureUi : IConfigureAppHost
    {
        public void Configure(IAppHost appHost)
        {
            Svg.Load(appHost.RootDirectory.GetDirectory("/assets/svg"));
        }
    }
}
