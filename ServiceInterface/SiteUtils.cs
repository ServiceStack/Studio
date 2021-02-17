using System;
using System.Collections.Generic;
using ServiceStack;
using ServiceStack.Text;

namespace Studio.ServiceInterface
{
    public static class SiteUtils
    {
        private static char[] UrlPathDelims = {':', '/'};
        
        /// <summary>
        /// Allow slugs to capture URLs, Examples:
        /// techstacks.io                  => https://techstacks.io
        /// http.techstacks.io             => http://techstacks.io
        /// techstacks.io:1000             => https://techstacks.io:1000
        /// techstacks.io:1000:site1:site2 => https://techstacks.io:1000/site1/site2
        /// techstacks.io:site1%7Csite2    => https://techstacks.io/site1|site2
        /// </summary>
        public static string UrlFromSlug(this string slug)
        {
            var url = slug;
            var isUrl = url.StartsWith("https://") || url.StartsWith("http://");
            var firstPos = url.IndexOf(':');
            if (!isUrl && firstPos >= 0)
            {
                var atPort = url.RightPart(':');
                var endPos = atPort.IndexOfAny(UrlPathDelims);
                var testPort = endPos >= 0
                    ? atPort.Substring(0,endPos)
                    : atPort.Substring(0,atPort.Length - 1);
                url = int.TryParse(testPort, out _)
                    ? url.LeftPart(':') + ':' + atPort.Replace(':', '/')
                    : url.LeftPart(':') + '/' + atPort.Replace(':', '/');
            }
            url = url.UrlDecode();
            if (!isUrl)
            {
                url = url.StartsWith("http.") || url.StartsWith("https.")
                    ? url.LeftPart('.') + "://" + url.RightPart('.')
                    : "https://" + url;
            }
            return url;
        }

        /// <summary>
        /// Convert URL to URL-friendly slugs, Examples:
        /// https://techstacks.io                  => techstacks.io 
        /// http://techstacks.io                   => http.techstacks.io 
        /// https://techstacks.io:1000             => techstacks.io:1000 
        /// https://techstacks.io:1000/site1/site2 => techstacks.io:1000:site1:site2 
        /// https://techstacks.io/site1|site2      => techstacks.io:site|site2 
        /// </summary>
        public static string UrlToSlug(this string url)
        {
            var slug = url;
            if (slug.StartsWith("https://"))
                slug = slug.Substring("https://".Length);
            else if (slug.StartsWith("http://"))
                slug = "http." + slug.Substring("http://".Length);
            slug = slug.Replace('/', ':');
            return slug;
        }
        
        public static string ToUrlEncoded(this List<string> args)
        {
            if (!args.IsEmpty())
            {
                if (args.Count % 2 != 0)
                    throw new ArgumentException(@"Invalid odd number of arguments, expected [key1,value1,key2,value2,...]", nameof(args));

                var sb = StringBuilderCache.Allocate();
                for (var i = 0; i < args.Count; i += 2)
                {
                    if (sb.Length > 0)
                        sb.Append('&');
                    
                    var key = args[i];
                    var val = args[i + 1];
                    val = val?.Replace((char)31, ','); // 31 1F US (unit separator) 
                    sb.Append(key).Append('=').Append(val.UrlEncode());
                }
                return StringBuilderCache.ReturnAndFree(sb);
            }
            return string.Empty;
        }

        public static AppMetadata GetAppMetadata(this string baseUrl)
        {
            string appResponseJson = null;
            try
            {
                appResponseJson = baseUrl.CombineWith("/metadata/app.json")
                    .GetJsonFromUrl();
            
                if (!appResponseJson.Trim().StartsWith("{"))
                    throw new Exception("Not a remote ServiceStack Instance");
            }
            catch (Exception appEx)
            {
                string ssMetadata;
                try
                {
                    ssMetadata = baseUrl.CombineWith("/metadata").GetStringFromUrl();
                }
                catch (Exception ssEx)
                {
                    throw new Exception("Not a remote ServiceStack Instance", ssEx);
                }

                if (ssMetadata.IndexOf("https://servicestack.net", StringComparison.Ordinal) == -1)
                    throw new Exception("Not a remote ServiceStack Instance");

                throw new Exception("ServiceStack Instance v5.8.1 or higher required", appEx);
            }

            AppMetadata appMetadata;
            try
            {
                appMetadata = appResponseJson.FromJson<AppMetadata>();
            }
            catch (Exception e)
            {
                throw new Exception("Could not read AppMetadata, try upgrading this App or remote ServiceStack Instance", e);
            }

            return appMetadata;
        }
    }
}