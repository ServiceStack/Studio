using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Funq;
using ServiceStack;
using ServiceStack.Admin;
using ServiceStack.Configuration;
using ServiceStack.Desktop;
using ServiceStack.NativeTypes.Dart;
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

    public class ExportTypes : IReturn<ExportTypes>
    {
        public AuditBase AuditBase { get; set; }
        public EmptyResponse EmptyResponse { get; set; }
        public IdResponse IdResponse { get; set; }
        public StringResponse StringResponse { get; set; }
        public StringsResponse StringsResponse { get; set; }
    }

    public class ExportTypesService : IService
    {
        public object Any(ExportTypes request) => request;
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
                UseSecureCookies = true,
                AddRedirectParamsToQueryString = true,
            });

            if (Config.DebugMode)
            {
                //generate types
                RegisterService<GetCrudEventsService>("/crudevents/{Model}");
                RegisterService<GetValidationRulesService>("/validation/rules/{Type}");
                RegisterService<ModifyValidationRulesService>("/validation/rules");
                RegisterService<AdminUsersService>("/ss_admin/users");
            }
            
            Plugins.Add(new SessionFeature()); // store client auth in session
            // DartGenerator.ArrayTypes;
        }
    }
    
    // Pre Configure SharpPagesFeature & DesktopFeature 
    public class ConfigureSharpAppFeatures : IPreConfigureAppHost, IPostInitPlugin
    {
        public void PreConfigure(IAppHost appHost)
        {
            var debug = appHost.AppSettings.Get("debug", appHost.GetHostingEnvironment().IsDevelopment());

            appHost.Plugins.Add(new SharpPagesFeature {
                EnableSpaFallback = true,
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

        public void AfterPluginsLoaded(IAppHost appHost)
        {
            appHost.Plugins.Add(new HotReloadFeature {
                VirtualFiles = appHost.VirtualFiles, //Monitor all folders for changes including /src & /wwwroot
            });
        }
    }
    
}
