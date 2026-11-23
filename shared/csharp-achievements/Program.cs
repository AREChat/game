using Microsoft.AspNetCore.Components.WebAssembly.Hosting;

// Headless Blazor WebAssembly host: no Razor UI is rendered. This process exists
// purely so the C# AchievementsEngine.Achievements class (marked [JSInvokable])
// can be called from plain JavaScript via DotNet.invokeMethodAsync, so existing
// vanilla-JS games can use a real C#/.NET WASM module without adopting Blazor's
// component model.
var builder = WebAssemblyHostBuilder.CreateDefault(args);
var host = builder.Build();

await host.RunAsync();
