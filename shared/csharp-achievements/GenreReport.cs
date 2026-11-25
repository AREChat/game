using Microsoft.JSInterop;

namespace AchievementsEngine;

/// <summary>
/// JS-callable entry for the hub "あなたの記録" panel. All logic lives in
/// <see cref="GenreReportCore"/>, which is also compiled into a native test project.
/// </summary>
public static class GenreReport
{
    [JSInvokable]
    public static string Report(string gamesJson, string logJson, string today)
        => GenreReportCore.Compute(gamesJson, logJson, today);
}
