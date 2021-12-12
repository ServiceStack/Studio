using System;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Funq;
using ServiceStack;
using ServiceStack.Admin;
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
    }

    public override void OnStartupException(Exception ex)
    {
        Console.WriteLine(ex);
        base.OnStartupException(ex);
    }
}
