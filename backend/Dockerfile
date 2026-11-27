# Stage 1: Restore & Publish .NET 10 Minimal API
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
WORKDIR /src

COPY Kinetix.sln ./
COPY src/Kinetix.Domain/Kinetix.Domain.csproj src/Kinetix.Domain/
COPY src/Kinetix.Api/Kinetix.Api.csproj src/Kinetix.Api/
RUN dotnet restore src/Kinetix.Api/Kinetix.Api.csproj

COPY src/ ./src/
RUN dotnet publish src/Kinetix.Api/Kinetix.Api.csproj -c Release -o /app/publish --no-restore

# Stage 2: Hardened Non-Root ASP.NET Core 10 Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache icu-libs wget
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false \
    ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish ./

USER $APP_UID
EXPOSE 8080

HEALTHCHECK --interval=20s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health > /dev/null || exit 1

ENTRYPOINT ["dotnet", "Kinetix.Api.dll"]
