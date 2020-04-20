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
        // This method gets called by the runtime. Use this method to add services to the container.
        // For more information on how to configure your application, visit https://go.microsoft.com/fwlink/?LinkID=398940
        public new void ConfigureServices(IServiceCollection services)
        {
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
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
        public AppHost() : base("AutoQueryStudio", typeof(MyServices).Assembly) { }

        // Configure your AppHost with the necessary configuration and dependencies your App needs
        public override void Configure(Container container)
        {
            SetConfig(new HostConfig
            {
                UseSameSiteCookies = true,
                AddRedirectParamsToQueryString = true,
                DebugMode = true,
                ReturnsInnerException = false,
            });

            if (Config.DebugMode)
            {
                Plugins.Add(new HotReloadFeature {
                    VirtualFiles = VirtualFiles, //Monitor all folders for changes including /src & /wwwroot
                });
            }
            
            Plugins.Add(new SessionFeature());    // store client auth in session 
            
            Plugins.Add(new SharpPagesFeature()); // enable server-side rendering, see: https://sharpscript.net/docs/sharp-pages

            //generate types
            RegisterService<GetCrudEventsService>("/crudevents/{Model}");
            RegisterService<GetValidationRulesService>("/validation/rules/{Type}");
            RegisterService<ModifyValidationRulesService>("/validation/rules");
            
            ConnectionServices.LoadAppSettings();
            //Plugins.Add(new ValidationFeature());
        }
    }
}
