using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Kinetix.Domain.Models;
using Kinetix.Domain.Services;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Kinetix.Api.Tests;

public sealed class SolarAndHealthTests : IClassFixture<WebApplicationFactory<Program>>
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) }
    };

    private readonly HttpClient _client;
    private readonly SaigonSolarEngine _solarEngine = new();

    public SolarAndHealthTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetHealth_Returns200HealthyWithNet10Metadata()
    {
        var resp = await _client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

        var json = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("healthy", json.GetProperty("status").GetString());
        Assert.Equal("Kinetix.Api", json.GetProperty("service").GetString());
        Assert.Equal(".NET 10", json.GetProperty("runtime").GetString());
        Assert.Equal(12, json.GetProperty("residencesLoaded").GetInt32());
        Assert.True(resp.Headers.Contains("X-Content-Type-Options"));
    }

    [Fact]
    public async Task GetResidences_ReturnsAll12Units_AndSupportsTierAndBudgetFilters()
    {
        var allJson = await _client.GetFromJsonAsync<JsonElement>("/api/v1/residences");
        Assert.Equal(12, allJson.GetProperty("count").GetInt32());

        var penthouses = await _client.GetFromJsonAsync<JsonElement>("/api/v1/residences?tier=PENTHOUSE");
        Assert.Equal(2, penthouses.GetProperty("count").GetInt32());

        var under25B = await _client.GetFromJsonAsync<JsonElement>("/api/v1/residences?maxPriceVnd=25000000000");
        Assert.Equal(5, under25B.GetProperty("count").GetInt32());
    }

    [Fact]
    public void SaigonSolar_VernalEquinoxNoon_AchievesAccurate79Point2DegSouthElevation()
    {
        var res = _solarEngine.ComputeExposure(new SolarExposureRequest(12.0, SolarSeason.VernalEquinox, 180.0));

        Assert.Equal(SaigonSolarEngine.SaigonLatitudeDeg, res.LatitudeDeg);
        Assert.InRange(res.SolarNoonAltitudeDeg, 79.0, 79.5);
        Assert.InRange(res.SolarAltitudeDeg, 78.0, 79.5);
        Assert.Equal("S", res.SolarNoonCardinal);
        Assert.InRange(res.SolarAzimuthDeg, 165.0, 195.0);
    }

    [Fact]
    public void SaigonSolar_SummerSolsticeNoon_PassesNorthOfZenithAt77Point3Deg()
    {
        var res = _solarEngine.ComputeExposure(new SolarExposureRequest(12.0, SolarSeason.SummerSolstice, 0.0));

        Assert.InRange(res.SolarNoonAltitudeDeg, 77.1, 77.6);
        Assert.Equal("N", res.SolarNoonCardinal);
        Assert.InRange(res.SolarAltitudeDeg, 76.0, 77.6);
        Assert.True(res.SolarAzimuthDeg >= 340.0 || res.SolarAzimuthDeg <= 20.0);
    }

    [Fact]
    public void SaigonSolar_WinterSolsticeNoon_Achieves55Point8DegSouthElevation()
    {
        var res = _solarEngine.ComputeExposure(new SolarExposureRequest(12.0, SolarSeason.WinterSolstice, 180.0));

        Assert.InRange(res.SolarNoonAltitudeDeg, 55.5, 56.1);
        Assert.Equal("S", res.SolarNoonCardinal);
        Assert.InRange(res.SolarAltitudeDeg, 54.5, 56.5);
    }

    [Fact]
    public void SaigonSolar_WestBalconyAt1530_ReceivesSignificantlyHigherThermalLoadThanEast()
    {
        var west = _solarEngine.ComputeExposure(new SolarExposureRequest(15.5, SolarSeason.VernalEquinox, 270.0));
        var east = _solarEngine.ComputeExposure(new SolarExposureRequest(15.5, SolarSeason.VernalEquinox, 90.0));

        Assert.True(west.DirectSunHit);
        Assert.False(east.DirectSunHit);
        Assert.True(west.ExteriorFacadeIrradianceWm2 > east.ExteriorFacadeIrradianceWm2 * 3);
        Assert.True(west.PenetrationDepthM > 0.0);
        Assert.Equal(0.0, east.PenetrationDepthM);
    }

    [Fact]
    public async Task PostSolarExposure_Endpoint_Returns200With13HourlyPoints()
    {
        var req = new SolarExposureRequest(15.0, SolarSeason.AutumnEquinox, 258.0, 2.6, 6.8, 0.36);
        var resp = await _client.PostAsJsonAsync("/api/v1/architecture/solar-exposure", req, JsonOpts);

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var result = await resp.Content.ReadFromJsonAsync<SolarExposureResult>(JsonOpts);
        Assert.NotNull(result);
        Assert.Equal(13, result.DailyProfile.Count);
        Assert.Equal(6, result.DailyProfile[0].LocalHour);
        Assert.Equal(18, result.DailyProfile[^1].LocalHour);
        Assert.True(result.DirectSunHit);
        Assert.True(result.ExteriorFacadeIrradianceWm2 > result.InteriorSolarGainWm2);
    }

    [Fact]
    public async Task PostSolarExposure_Endpoint_Returns400OnOutOfRangeHour()
    {
        var req = new SolarExposureRequest(22.5, SolarSeason.VernalEquinox, 180.0);
        var resp = await _client.PostAsJsonAsync("/api/v1/architecture/solar-exposure", req, JsonOpts);
        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }
}
