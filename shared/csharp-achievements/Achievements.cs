using System.Text.Json;
using Microsoft.JSInterop;

namespace AchievementsEngine;

/// <summary>
/// Generic, data-driven achievement/badge rule engine, written in C# and compiled
/// to WebAssembly via the Blazor WebAssembly toolchain. It is intentionally game
/// agnostic: each game supplies its own small JSON "rule set" (what to check) and
/// its own flattened stats object (what the player has actually done, usually
/// read straight out of the game's existing localStorage save data). The engine
/// evaluates every rule against the stats and reports which badges are newly
/// unlocked, which are in progress, and a completion percentage - logic that is
/// genuinely nicer to express with typed records + System.Text.Json than by hand
/// in ad hoc JS, and is reused unmodified by four different games.
/// </summary>
public static class Achievements
{
    private sealed class Rule
    {
        public string id { get; set; } = "";
        public string title { get; set; } = "";
        public string desc { get; set; } = "";
        public string icon { get; set; } = "🏅";
        /// dotted path into the stats object, e.g. "best.course3" or "plays"
        public string field { get; set; } = "";
        /// one of: gte, lte, gt, lt, eq, neq
        public string op { get; set; } = "gte";
        public double value { get; set; }
    }

    /// <summary>
    /// rulesJson: JSON array of Rule objects.
    /// statsJson: arbitrary JSON object (numbers/bools/strings, possibly nested).
    /// previouslyUnlockedJson: JSON array of rule ids already unlocked before this
    ///   call, so the result can flag which ones are brand-new this run (used for
    ///   a one-time "achievement unlocked!" toast on the JS side).
    /// Returns a JSON array of:
    ///   { id, title, desc, icon, unlocked, justUnlocked, progress (0..1), current, target }
    /// </summary>
    [JSInvokable]
    public static string Evaluate(string rulesJson, string statsJson, string previouslyUnlockedJson)
    {
        try
        {
            var rules = JsonSerializer.Deserialize<List<Rule>>(rulesJson) ?? new();
            using var statsDoc = JsonDocument.Parse(string.IsNullOrWhiteSpace(statsJson) ? "{}" : statsJson);
            var prevUnlocked = new HashSet<string>(
                JsonSerializer.Deserialize<List<string>>(previouslyUnlockedJson) ?? new());

            var results = new List<object>();

            foreach (var rule in rules)
            {
                double current = ReadNumber(statsDoc.RootElement, rule.field);
                bool unlocked = rule.op switch
                {
                    "gte" => current >= rule.value,
                    "lte" => current <= rule.value,
                    "gt" => current > rule.value,
                    "lt" => current < rule.value,
                    "eq" => Math.Abs(current - rule.value) < 1e-9,
                    "neq" => Math.Abs(current - rule.value) >= 1e-9,
                    _ => false,
                };

                double progress;
                if (rule.op is "lte" or "lt")
                {
                    // Lower-is-better rules (e.g. a time): progress is undefined
                    // once unlocked, otherwise we can't meaningfully show a ratio
                    // without a known starting point, so just show 0/1.
                    progress = unlocked ? 1.0 : 0.0;
                }
                else
                {
                    progress = rule.value <= 0 ? (unlocked ? 1.0 : 0.0)
                        : Math.Clamp(current / rule.value, 0.0, 1.0);
                }

                results.Add(new
                {
                    id = rule.id,
                    title = rule.title,
                    desc = rule.desc,
                    icon = rule.icon,
                    unlocked,
                    justUnlocked = unlocked && !prevUnlocked.Contains(rule.id),
                    progress,
                    current,
                    target = rule.value,
                });
            }

            return JsonSerializer.Serialize(results);
        }
        catch (Exception ex)
        {
            return JsonSerializer.Serialize(new { error = ex.Message });
        }
    }

    /// <summary>Simple self-check used by the integration test page / smoke test.</summary>
    [JSInvokable]
    public static string Ping() => "pong-from-csharp-wasm";

    private static double ReadNumber(JsonElement root, string dottedPath)
    {
        if (string.IsNullOrEmpty(dottedPath)) return 0;
        var current = root;
        foreach (var part in dottedPath.Split('.'))
        {
            if (current.ValueKind != JsonValueKind.Object || !current.TryGetProperty(part, out var next))
                return 0;
            current = next;
        }
        return current.ValueKind switch
        {
            JsonValueKind.Number => current.GetDouble(),
            JsonValueKind.True => 1,
            JsonValueKind.False => 0,
            _ => 0,
        };
    }
}
