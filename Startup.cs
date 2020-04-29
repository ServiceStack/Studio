using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Funq;
using ServiceStack;
using ServiceStack.Desktop;
using ServiceStack.Text;
using ServiceStack.Validation;
using Studio.ServiceInterface;

namespace Studio
{
    public class Startup : ModularStartup
    {
        public new void ConfigureServices(IServiceCollection services)
        {
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseServiceStack(new AppHost
            {
                AppSettings = new NetCoreAppSettings(Configuration)
            });
        }
    }

    public class AppHost : AppHostBase
    {
        public AppHost() : base("ServiceStack Studio", typeof(StudioServices).Assembly) {}

        public override void Configure(Container container)
        {
            Env.StrictMode = true;
            SetConfig(new HostConfig
            {
                EmbeddedResourceBaseTypes = { typeof(DesktopAssets) },
                DebugMode = AppSettings.Get("debug", HostingEnvironment.IsDevelopment()),
                UseSameSiteCookies = false,
                UseSecureCookies = true,
                AddRedirectParamsToQueryString = true,
                ReturnsInnerException = false,
            });

            if (Config.DebugMode)
            {
                Plugins.AddIfNotExists(new HotReloadFeature {
                    VirtualFiles = VirtualFiles, //Monitor all folders for changes including /src & /wwwroot
                });

                //generate types
                RegisterService<GetCrudEventsService>("/crudevents/{Model}");
                RegisterService<GetValidationRulesService>("/validation/rules/{Type}");
                RegisterService<ModifyValidationRulesService>("/validation/rules");
            }
            
            Plugins.AddIfNotExists(new SessionFeature());    // store client auth in session 
            
            DesktopConfig.Instance.ImportParams.Add("debug"); //needs to happen at appHost initialization
            DesktopConfig.Instance.ImportParams.Add("connect"); //needs to happen at appHost initialization

            Plugins.AddIfNotExists(new SharpPagesFeature {
                // Args = { ["connect"] = "https://localhost:5001" } //test ?connect={url} import scheme
            });
            
            var sites = StudioServices.LoadAppSettings();
            foreach (var baseUrl in sites.Keys)
            {
                try
                {
                    var uri = new Uri(baseUrl);                    
                    DesktopConfig.Instance.ProxyConfigs.Add(new ProxyConfig {
                        Scheme = uri.Scheme,
                        TargetScheme = uri.Scheme,
                        Domain = uri.Host,
                        AllowCors = true,
                        IgnoreHeaders = { "X-Frame-Options", "Content-Security-Policy" }, 
                    });
                }
                catch (Exception e)
                {
                    OnStartupException(e);
                }
            }

        }
    }
}
