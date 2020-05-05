using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Funq;
using ServiceStack;
using ServiceStack.Configuration;
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
                DebugMode = AppSettings.Get("debug", HostingEnvironment.IsDevelopment()),
                UseSameSiteCookies = false,
                UseSecureCookies = true,
                AddRedirectParamsToQueryString = true,
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
            
            Plugins.AddIfNotExists(new SharpPagesFeature {
                // Args = { ["connect"] = "https://localhost:5001" } //test ?connect={url} import scheme
            });
            
            var sites = StudioServices.LoadAppSettings();
            Plugins.Add(new DesktopFeature {
                AccessRole = Config.DebugMode 
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
    }
}
