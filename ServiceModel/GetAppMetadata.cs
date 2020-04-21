using ServiceStack;

namespace Studio.ServiceModel
{
    public class GetAppMetadata : IReturn<GetAppMetadataResponse>
    {
        public string Slug { get; set; }
    }

    public class GetAppMetadataResponse
    {
        public string Slug { get; set; }
        public AppMetadata Result { get; set; }

        public ResponseStatus ResponseStatus { get; set; }
    }
}