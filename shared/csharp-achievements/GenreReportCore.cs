using System.Globalization;
using System.Text;
using System.Text.Json;

namespace AchievementsEngine;

/// <summary>
/// ARE GAMES hub "あなたの記録" report. Pure C# (no JS-interop dependency) so the very same
/// code runs inside Blazor WebAssembly in the browser AND in a native console test
/// (tools/csharp/HubTests) against the shared golden vectors in tools/parity/hub-vectors.json.
///
/// Language-agnostic on purpose: it returns ids and numbers only. The JS side owns every
/// word the player reads (ja / en / zh / ko).
///
/// Inputs (all JSON strings, never trusted):
///   gamesJson : {"genres":["rpg",...], "games":[{"id":"a1","genre":"rpg","adult":false},...]}
///               (a bare array of games is accepted too). Games must be given in the order the
///               player should see them; that order breaks every tie.
///   logJson   : {"g":{"a1":{"n":3,"last":1700000000000}}, "d":{"2026-11-25":2}}
///   today     : "yyyy-MM-dd" in the player's local time (the engine never reads a clock, so
///               the same input always gives the same answer).
///
/// Rules worth knowing:
///   * Games for adults (20+) are never counted as a goal and are never recommended, but a
///     20+ game the player has really played does count (so percentages never pass 100).
///   * Unknown ids / negative or non-numeric counts are ignored; counts are capped at 99999.
///   * Days in the future (a wrong device clock) and malformed day keys are ignored.
///   * A streak is still alive on the morning after: it counts back from today, or from
///     yesterday when today has no play yet.
/// </summary>
public static class GenreReportCore
{
    private const long MaxPlays = 99999;

    private sealed class Game
    {
        public string Id = "";
        public string Genre = "";
        public bool Adult;
        public long N;
        public double Last;
    }

    public static string Compute(string? gamesJson, string? logJson, string? today)
    {
        try
        {
            var genres = new List<string>();
            var games = ParseGames(gamesJson, genres);
            ApplyLog(games, logJson, out var days);
            return Build(games, genres, days, today);
        }
        catch (Exception ex)
        {
            return ErrorJson(ex.Message);
        }
    }

    private static string ErrorJson(string message)
    {
        using var ms = new MemoryStream();
        using (var w = new Utf8JsonWriter(ms))
        {
            w.WriteStartObject();
            w.WriteString("error", message);
            w.WriteEndObject();
        }
        return Encoding.UTF8.GetString(ms.ToArray());
    }

    private static List<Game> ParseGames(string? json, List<string> genres)
    {
        var list = new List<Game>();
        if (string.IsNullOrWhiteSpace(json)) return list;
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        JsonElement arr;
        if (root.ValueKind == JsonValueKind.Array)
        {
            arr = root;
        }
        else if (root.ValueKind == JsonValueKind.Object)
        {
            if (root.TryGetProperty("genres", out var gs) && gs.ValueKind == JsonValueKind.Array)
                foreach (var g in gs.EnumerateArray())
                    if (g.ValueKind == JsonValueKind.String && g.GetString() is { Length: > 0 } gid && !genres.Contains(gid))
                        genres.Add(gid);
            if (!root.TryGetProperty("games", out arr) || arr.ValueKind != JsonValueKind.Array)
                return list;
        }
        else
        {
            throw new FormatException("games must be an object or an array");
        }

        var seen = new HashSet<string>(StringComparer.Ordinal);
        foreach (var e in arr.EnumerateArray())
        {
            if (e.ValueKind != JsonValueKind.Object) continue;
            var id = e.TryGetProperty("id", out var i) && i.ValueKind == JsonValueKind.String ? i.GetString() ?? "" : "";
            var genre = e.TryGetProperty("genre", out var g) && g.ValueKind == JsonValueKind.String ? g.GetString() ?? "" : "";
            if (id.Length == 0 || !seen.Add(id)) continue;
            var adult = e.TryGetProperty("adult", out var a) && a.ValueKind == JsonValueKind.True;
            list.Add(new Game { Id = id, Genre = genre, Adult = adult });
            if (genre.Length > 0 && !genres.Contains(genre)) genres.Add(genre);
        }
        return list;
    }

    private static void ApplyLog(List<Game> games, string? json, out SortedSet<DateOnly> days)
    {
        days = new SortedSet<DateOnly>();
        if (string.IsNullOrWhiteSpace(json)) return;
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        if (root.ValueKind != JsonValueKind.Object) return;
        if (root.TryGetProperty("g", out var g) && g.ValueKind == JsonValueKind.Object)
        {
            foreach (var game in games)
            {
                if (!g.TryGetProperty(game.Id, out var e) || e.ValueKind != JsonValueKind.Object) continue;
                game.N = ReadCount(e, "n");
                if (e.TryGetProperty("last", out var l) && l.ValueKind == JsonValueKind.Number && l.TryGetDouble(out var ld) && double.IsFinite(ld) && ld > 0)
                    game.Last = ld;
            }
        }
        if (root.TryGetProperty("d", out var d) && d.ValueKind == JsonValueKind.Object)
        {
            foreach (var p in d.EnumerateObject())
            {
                if (p.Value.ValueKind != JsonValueKind.Number || !p.Value.TryGetDouble(out var cnt) || !(cnt >= 1)) continue;
                if (DateOnly.TryParseExact(p.Name, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var day))
                    days.Add(day);
            }
        }
    }

    private static long ReadCount(JsonElement obj, string name)
    {
        if (!obj.TryGetProperty(name, out var v) || v.ValueKind != JsonValueKind.Number || !v.TryGetDouble(out var d)) return 0;
        if (double.IsNaN(d) || d < 1) return 0;
        return d >= MaxPlays ? MaxPlays : (long)Math.Floor(d);
    }

    private static int Pct(int part, int whole) =>
        whole <= 0 ? 0 : (int)Math.Round(100.0 * part / whole, MidpointRounding.AwayFromZero);

    private static string Tier(int tried, int total)
    {
        if (tried <= 0 || total <= 0) return "none";
        if (tried >= total) return "gold";
        if (tried * 2 >= total) return "silver";
        return "bronze";
    }

    private static string Build(List<Game> games, List<string> genres, SortedSet<DateOnly> days, string? todayText)
    {
        // The goal set: everything except 20+ games the player has not played.
        bool InScope(Game g) => !g.Adult || g.N > 0;

        long totalPlays = games.Sum(g => g.N);
        int gamesTotal = games.Count(InScope);
        int gamesTried = games.Count(g => g.N > 0);

        // ---- genres
        var rows = new List<(string Id, long Plays, int Tried, int Total)>();
        foreach (var gn in genres)
        {
            var inGenre = games.Where(g => g.Genre == gn).ToList();
            rows.Add((gn, inGenre.Sum(g => g.N), inGenre.Count(g => g.N > 0), inGenre.Count(InScope)));
        }

        Game? favoriteGame = null;
        foreach (var g in games)
            if (g.N > 0 && (favoriteGame == null || g.N > favoriteGame.N)) favoriteGame = g;
        string favoriteGenre = "";
        long bestGenrePlays = 0;
        foreach (var r in rows)
            if (r.Plays > bestGenrePlays) { bestGenrePlays = r.Plays; favoriteGenre = r.Id; }

        // ---- streak
        int current = 0, best = 0;
        DateOnly today;
        if (!DateOnly.TryParseExact(todayText ?? "", "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out today))
            today = days.Count > 0 ? days.Max : DateOnly.MinValue;
        var valid = days.Where(x => x <= today).ToList();
        if (valid.Count > 0)
        {
            var set = new HashSet<DateOnly>(valid);
            DateOnly? start = set.Contains(today) ? today : (today > DateOnly.MinValue ? today.AddDays(-1) : null);
            if (start.HasValue && set.Contains(start.Value))
            {
                var d = start.Value;
                while (set.Contains(d))
                {
                    current++;
                    if (d == DateOnly.MinValue) break;
                    d = d.AddDays(-1);
                }
            }
            int run = 0;
            DateOnly? prev = null;
            foreach (var x in valid) // SortedSet order: oldest first
            {
                run = prev.HasValue && x.DayNumber == prev.Value.DayNumber + 1 ? run + 1 : 1;
                if (run > best) best = run;
                prev = x;
            }
        }

        // ---- next game
        (string Id, string Reason) next = ("", "none");
        var candidates = games.Where(g => !g.Adult).ToList();
        if (candidates.Count > 0)
        {
            Game? pick;
            if (totalPlays == 0)
            {
                next = (candidates[0].Id, "start");
            }
            else if (favoriteGenre.Length > 0 && (pick = candidates.FirstOrDefault(g => g.Genre == favoriteGenre && g.N == 0)) != null)
            {
                next = (pick.Id, "sameGenre");
            }
            else
            {
                pick = null;
                foreach (var gn in genres)
                {
                    if (games.Any(g => g.Genre == gn && g.N > 0)) continue;
                    pick = candidates.FirstOrDefault(g => g.Genre == gn);
                    if (pick != null) break;
                }
                if (pick != null)
                {
                    next = (pick.Id, "newGenre");
                }
                else if ((pick = candidates.FirstOrDefault(g => g.N == 0)) != null)
                {
                    next = (pick.Id, "unplayed");
                }
                else
                {
                    Game least = candidates[0];
                    foreach (var g in candidates)
                        if (g.N < least.N || (g.N == least.N && g.Last < least.Last)) least = g;
                    next = (least.Id, "leastPlayed");
                }
            }
        }

        // ---- badges (id, current, target)
        int genresTried = rows.Count(r => r.Tried > 0);
        int genresWithGames = rows.Count(r => r.Total > 0);
        int masters = rows.Count(r => r.Total >= 2 && r.Tried >= r.Total);
        long maxPlays = games.Count == 0 ? 0 : games.Max(g => g.N);
        int daysPlayed = valid.Count;
        var badges = new List<(string Id, long Cur, long Target, bool Unlocked)>
        {
            ("first", totalPlays, 1, totalPlays >= 1),
            ("tried3", gamesTried, 3, gamesTried >= 3),
            ("triedAll", gamesTried, Math.Max(gamesTotal, 1), gamesTotal > 0 && gamesTried >= gamesTotal),
            ("genres3", genresTried, 3, genresTried >= 3),
            ("genresAll", genresTried, Math.Max(genresWithGames, 1), genresWithGames > 0 && genresTried >= genresWithGames),
            ("fan10", maxPlays, 10, maxPlays >= 10),
            ("master", masters, 1, masters >= 1),
            ("streak3", best, 3, best >= 3),
            ("streak7", best, 7, best >= 7),
            ("days7", daysPlayed, 7, daysPlayed >= 7),
        };

        using var ms = new MemoryStream();
        using (var w = new Utf8JsonWriter(ms))
        {
            w.WriteStartObject();
            w.WriteNumber("totalPlays", totalPlays);
            w.WriteNumber("gamesTried", gamesTried);
            w.WriteNumber("gamesTotal", gamesTotal);
            w.WriteNumber("percent", Pct(gamesTried, gamesTotal));
            w.WriteString("favoriteGame", favoriteGame?.Id ?? "");
            w.WriteString("favoriteGenre", favoriteGenre);
            w.WriteStartObject("streak");
            w.WriteNumber("current", current);
            w.WriteNumber("best", best);
            w.WriteNumber("days", daysPlayed);
            w.WriteEndObject();
            w.WriteStartObject("next");
            w.WriteString("id", next.Id);
            w.WriteString("reason", next.Reason);
            w.WriteEndObject();
            w.WriteStartArray("genres");
            foreach (var r in rows)
            {
                w.WriteStartObject();
                w.WriteString("id", r.Id);
                w.WriteNumber("plays", r.Plays);
                w.WriteNumber("tried", r.Tried);
                w.WriteNumber("total", r.Total);
                w.WriteNumber("percent", Pct(r.Tried, r.Total));
                w.WriteString("tier", Tier(r.Tried, r.Total));
                w.WriteEndObject();
            }
            w.WriteEndArray();
            w.WriteStartArray("badges");
            foreach (var b in badges)
            {
                w.WriteStartObject();
                w.WriteString("id", b.Id);
                w.WriteBoolean("unlocked", b.Unlocked);
                w.WriteNumber("current", b.Cur);
                w.WriteNumber("target", b.Target);
                w.WriteEndObject();
            }
            w.WriteEndArray();
            w.WriteEndObject();
        }
        return Encoding.UTF8.GetString(ms.ToArray());
    }
}
