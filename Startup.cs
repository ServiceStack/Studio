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
        public AppHost() : base("ServiceStack Studio", typeof(StudioServices).Assembly) { }

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
            
            Plugins.AddIfNotExists(new SharpPagesFeature());
            
            // Plugins.Add(new ProxyFeature(
            //     matchingRequests: req => req.PathInfo.StartsWith("/github"),
            //     resolveUrl: req => $"https://github.com" + req.RawUrl.Replace("/github", "/")) {
            //     IgnoreResponseHeaders = {
            //         "X-Frame-Options"
            //     }
            // });
            // Plugins.Add(new ProxyFeature(
            //     matchingRequests: req => req.PathInfo.StartsWith("/facebook"),
            //     resolveUrl: req => $"https://www.facebook.com" + req.RawUrl.Replace("/facebook", "/")) {
            //     IgnoreResponseHeaders = {
            //         "X-Frame-Options"
            //     }
            // });
            // Plugins.Add(new ProxyFeature(
            //     matchingRequests: req => req.PathInfo.StartsWith("/auth"),
            //     resolveUrl: req => {
            //         return req.RawUrl;
            //     }) {
            //     IgnoreResponseHeaders = {
            //         "X-Frame-Options"
            //     },
            //     ProxyResponseFilter = (httpRes, webRes) => {
            //         var location = webRes.Headers[HttpHeaders.Location];
            //         if (location == null)
            //             return;
            //         if (location.StartsWith("https://www.facebook.com"))
            //             webRes.Headers[HttpHeaders.Location] = location.Replace("https://www.facebook.com/", "/facebook");
            //         else if (location.StartsWith("https://github.com"))
            //             webRes.Headers[HttpHeaders.Location] = location.Replace("https://github.com/", "/github");
            //     },
            //     TransformResponse = async (res, stream) => {
            //         var location = res.GetHeader(HttpHeaders.Location);
            //         if (location.StartsWith("https://www.facebook.com"))
            //         {
            //             var resBody = await stream.ReadToEndAsync();
            //             var replacedBody = resBody.Replace("https://www.facebook.com/", "/facebook");
            //             return MemoryStreamFactory.GetStream(replacedBody.ToUtf8Bytes());
            //         }
            //         else if (location.StartsWith("https://github.com"))
            //         {
            //             var resBody = await stream.ReadToEndAsync();
            //             var replacedBody = resBody.Replace("https://github.com/", "/github");
            //             return MemoryStreamFactory.GetStream(replacedBody.ToUtf8Bytes());
            //         }
            //         return stream;
            //     },
            // });
            
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
