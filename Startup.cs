using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Funq;
using ServiceStack;
using ServiceStack.Validation;
using Studio.ServiceInterface;
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
        public AppHost() : base("ServiceStack Studio", typeof(MyServices).Assembly) { }

        public override void Configure(Container container)
        {
            SetConfig(new HostConfig
            {
                EmbeddedResourceBaseTypes = { typeof(ServiceStack.Desktop.DesktopAssets) },
                DebugMode = HostingEnvironment.IsDevelopment(),
                UseSameSiteCookies = true,
                AddRedirectParamsToQueryString = true,
                ReturnsInnerException = false,
            });

            if (Config.DebugMode)
            {
                Plugins.Add(new HotReloadFeature {
                    VirtualFiles = VirtualFiles, //Monitor all folders for changes including /src & /wwwroot
                });

                //generate types
                RegisterService<GetCrudEventsService>("/crudevents/{Model}");
                RegisterService<GetValidationRulesService>("/validation/rules/{Type}");
                RegisterService<ModifyValidationRulesService>("/validation/rules");
            }
            
            Plugins.Add(new SessionFeature());    // store client auth in session 
            
            Plugins.Add(new SharpPagesFeature());
            
            StudioServices.LoadAppSettings();
        }
    }
}
