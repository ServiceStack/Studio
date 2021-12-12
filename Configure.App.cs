using System;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using ServiceStack;
using ServiceStack.Configuration;
using ServiceStack.Desktop;
using ServiceStack.Script;
using Studio.ServiceInterface;

[assembly: HostingStartup(typeof(Studio.ConfigureApp))]

namespace Studio
{
    // Pre Configure SharpPagesFeature & DesktopFeature 
    public class ConfigureApp : IHostingStartup
    {
        public void Configure(IWebHostBuilder builder) => builder
            .ConfigureAppHost(afterConfigure: appHost => {
                    var debug = appHost.AppSettings.Get("debug", appHost.GetHostingEnvironment().IsDevelopment());

                    appHost.Plugins.Add(new SharpPagesFeature {
                        EnableSpaFallback = true,
                        ScriptMethods = { new AppScripts() }
                        // Args = { ["connect"] = "https://localhost:5001" } //test ?connect={url} import scheme
                    });

                    var sites = StudioServices.LoadAppSettings();
                    appHost.Plugins.Add(new DesktopFeature {
                        AccessRole = debug
                            ? RoleNames.AllowAnon
                            : RoleNames.Admin,
                        ImportParams = {
                            "debug",
                            "connect",
                        },
                        ProxyConfigs = sites.Keys.Map(baseUrl => new Uri(baseUrl))
                            .Map(uri => new ProxyConfig {
                                Scheme = uri.Scheme,
                                TargetScheme = uri.Scheme,
                                Domain = uri.Host,
                                AllowCors = true,
                                IgnoreHeaders = { "X-Frame-Options", "Content-Security-Policy" },
                            })
                    });
                }
                , afterPluginsLoaded: appHost => {
                    appHost.Plugins.Add(new HotReloadFeature {
                        VirtualFiles = appHost.VirtualFiles, //Monitor all folders for changes including /src & /wwwroot
                    });
                });
    }

    public class AppScripts : ScriptMethods
    {
    }
}