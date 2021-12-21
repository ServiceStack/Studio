using System;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Funq;
using ServiceStack;
using ServiceStack.Admin;
using ServiceStack.Configuration;
using ServiceStack.Desktop;
using ServiceStack.Script;
using ServiceStack.Text;
using ServiceStack.Validation;
using Studio.ServiceInterface;

[assembly: HostingStartup(typeof(Studio.AppHost))]

namespace Studio;

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

public class AppHost : AppHostBase, IHostingStartup
{
    public void Configure(IWebHostBuilder builder) => builder
        .ConfigureServices(services => {
            // Configure ASP.NET Core IOC Dependencies
        })
        .Configure(app => {
            // Configure ASP.NET Core App
            if (!HasInit)
                app.UseServiceStack(new AppHost());
        })
        .ConfigureAppHost(afterPluginsLoaded: appHost => {
            appHost.Plugins.Add(new HotReloadFeature {
                VirtualFiles = appHost.VirtualFiles, //Monitor all folders for changes including /src & /wwwroot
            });
        });
           
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
        

        Plugins.Add(new SharpPagesFeature {
            EnableSpaFallback = true,
            ScriptMethods = { new AppScripts() }
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

    public override void OnStartupException(Exception ex)
    {
        Console.WriteLine(ex);
        base.OnStartupException(ex);
    }
}

public class AppScripts : ScriptMethods
{
}
