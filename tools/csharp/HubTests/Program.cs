using System.Text.Json;
using AchievementsEngine;

// Native checks for GenreReportCore: golden vectors + invariants under random / hostile input.
// Exit code 0 = all passed.
var root = args.Length > 0 ? args[0] : Directory.GetCurrentDirectory();
var vectorsPath = Path.Combine(root, "tools", "parity", "hub-vectors.json");
int checks = 0, fails = 0;
void Check(bool ok, string what)
{
    checks++;
    if (!ok) { fails++; Console.WriteLine("FAIL: " + what); }
}

// ---------- 1. golden vectors ----------
bool Subset(JsonElement want, JsonElement got, string path, List<string> why)
{
    switch (want.ValueKind)
    {
        case JsonValueKind.Object:
            if (got.ValueKind != JsonValueKind.Object) { why.Add($"{path}: expected object, got {got.ValueKind}"); return false; }
            var ok = true;
            foreach (var p in want.EnumerateObject())
            {
                if (!got.TryGetProperty(p.Name, out var g)) { why.Add($"{path}.{p.Name}: missing"); ok = false; continue; }
                if (!Subset(p.Value, g, path + "." + p.Name, why)) ok = false;
            }
            return ok;
        case JsonValueKind.Array:
            if (got.ValueKind != JsonValueKind.Array || got.GetArrayLength() != want.GetArrayLength())
            { why.Add($"{path}: array length {(got.ValueKind == JsonValueKind.Array ? got.GetArrayLength() : -1)} != {want.GetArrayLength()}"); return false; }
            var all = true;
            for (int i = 0; i < want.GetArrayLength(); i++)
                if (!Subset(want[i], got[i], $"{path}[{i}]", why)) all = false;
            return all;
        default:
            if (want.GetRawText() == got.GetRawText()) return true;
            why.Add($"{path}: expected {want.GetRawText()}, got {got.GetRawText()}");
            return false;
    }
}

using (var vdoc = JsonDocument.Parse(File.ReadAllText(vectorsPath)))
{
    foreach (var v in vdoc.RootElement.GetProperty("genreReport").EnumerateArray())
    {
        var name = v.GetProperty("name").GetString();
        var result = GenreReportCore.Compute(v.GetProperty("games").GetRawText(), v.GetProperty("log").GetRawText(), v.GetProperty("today").GetString());
        using var rdoc = JsonDocument.Parse(result);
        var why = new List<string>();
        var ok = Subset(v.GetProperty("expect"), rdoc.RootElement, "$", why);
        Check(ok, $"vector '{name}': {string.Join("; ", why)}  ← {result}");
    }
}

// ---------- 2. hostile inputs never throw and always return JSON ----------
string[] weird = { "", " ", "{", "[", "null", "true", "123", "\"x\"", "[[]]", "{\"g\":5}", "{\"g\":{\"a\":{\"n\":\"9\"}},\"d\":[1]}", "{\"d\":{\"2026-11-25\":\"x\"}}", new string('[', 5000), "\u0000", "{\"g\":null,\"d\":null}" };
foreach (var a in weird)
foreach (var b in weird)
{
    string r;
    try { r = GenreReportCore.Compute(a, b, "2026-11-25"); }
    catch (Exception e) { Check(false, $"threw {e.GetType().Name} for games={Trunc(a)} log={Trunc(b)}"); continue; }
    try { using var d = JsonDocument.Parse(r); Check(d.RootElement.ValueKind == JsonValueKind.Object, "result is an object"); }
    catch { Check(false, $"result is not JSON: {Trunc(r)}"); }
}
foreach (var t in new string?[] { null, "", "x", "0000-00-00", "9999-12-31", "0001-01-01", "2026-11-25 ", "2026/11/25" })
    Check(JsonDocument.Parse(GenreReportCore.Compute("[]", "{}", t)).RootElement.ValueKind == JsonValueKind.Object, $"today={t}");
Check(JsonDocument.Parse(GenreReportCore.Compute(null, null, null)).RootElement.GetProperty("totalPlays").GetInt64() == 0, "all null");
// extreme dates must not throw
Check(!GenreReportCore.Compute("[{\"id\":\"a\",\"genre\":\"g\"}]", "{\"g\":{\"a\":{\"n\":1}},\"d\":{\"0001-01-01\":1}}", "0001-01-01").Contains("\"error\""), "MinValue day");
Check(!GenreReportCore.Compute("[{\"id\":\"a\",\"genre\":\"g\"}]", "{\"g\":{\"a\":{\"n\":1}},\"d\":{\"9999-12-31\":1}}", "9999-12-31").Contains("\"error\""), "MaxValue day");
Check(!GenreReportCore.Compute("[{\"id\":\"a\",\"genre\":\"g\"}]", "{\"g\":{\"a\":{\"n\":1}},\"d\":{\"0001-01-01\":1}}", "0001-01-02").Contains("\"error\""), "MinValue+1");

// ---------- 3. invariants with random data ----------
var rnd = new Random(20261125);
string[] genreIds = { "rpg", "mystery", "puzzle", "action", "card", "park", "sim" };
for (int round = 0; round < 3000; round++)
{
    int n = rnd.Next(0, 18);
    var games = new List<(string id, string genre, bool adult)>();
    for (int i = 0; i < n; i++) games.Add(("g" + i, genreIds[rnd.Next(genreIds.Length)], rnd.Next(5) == 0));
    var gj = JsonSerializer.Serialize(new { genres = genreIds, games = games.Select(x => new { id = x.id, genre = x.genre, adult = x.adult }) });
    var g = new Dictionary<string, object>();
    foreach (var x in games) if (rnd.Next(3) != 0) g[x.id] = new { n = rnd.Next(-2, 40), last = rnd.Next(0, 1000) };
    var d = new Dictionary<string, int>();
    var baseDay = new DateOnly(2026, 11, 25);
    for (int i = 0; i < rnd.Next(0, 30); i++) d[baseDay.AddDays(-rnd.Next(-3, 60)).ToString("yyyy-MM-dd")] = rnd.Next(-1, 5);
    var lj = JsonSerializer.Serialize(new { g, d });
    var r1 = GenreReportCore.Compute(gj, lj, "2026-11-25");
    var r2 = GenreReportCore.Compute(gj, lj, "2026-11-25");
    Check(r1 == r2, "deterministic");
    using var doc = JsonDocument.Parse(r1);
    var o = doc.RootElement;
    if (o.TryGetProperty("error", out _)) { Check(false, "error on valid input: " + r1); continue; }
    long total = o.GetProperty("totalPlays").GetInt64();
    int tried = o.GetProperty("gamesTried").GetInt32(), all = o.GetProperty("gamesTotal").GetInt32(), pct = o.GetProperty("percent").GetInt32();
    Check(total >= 0, "total >= 0");
    Check(tried <= all, $"tried <= total ({tried}/{all}) {r1}");
    Check(pct >= 0 && pct <= 100, "percent range");
    Check(all == 0 ? pct == 0 : pct == (int)Math.Round(100.0 * tried / all, MidpointRounding.AwayFromZero), "percent math");
    long gp = 0; int gt = 0, ga = 0;
    foreach (var row in o.GetProperty("genres").EnumerateArray())
    {
        gp += row.GetProperty("plays").GetInt64(); gt += row.GetProperty("tried").GetInt32(); ga += row.GetProperty("total").GetInt32();
        Check(row.GetProperty("tried").GetInt32() <= row.GetProperty("total").GetInt32(), "genre tried <= total");
        var tier = row.GetProperty("tier").GetString();
        Check(tier is "none" or "bronze" or "silver" or "gold", "tier value");
        Check((row.GetProperty("tried").GetInt32() == 0) == (tier == "none"), "tier none ⇔ nothing tried");
    }
    Check(gp == total && gt == tried && ga == all, "genre rows add up");
    var nx = o.GetProperty("next");
    var nid = nx.GetProperty("id").GetString()!;
    var reason = nx.GetProperty("reason").GetString();
    if (nid.Length > 0)
    {
        var pick = games.First(x => x.id == nid);
        Check(!pick.adult, "never recommend a 20+ game");
        Check(reason is "start" or "sameGenre" or "newGenre" or "unplayed" or "leastPlayed", "reason value");
    }
    else Check(reason == "none", "no id ⇒ none");
    var st = o.GetProperty("streak");
    Check(st.GetProperty("current").GetInt32() <= st.GetProperty("best").GetInt32(), "current <= best");
    Check(st.GetProperty("best").GetInt32() <= st.GetProperty("days").GetInt32(), "best <= days");
    foreach (var b in o.GetProperty("badges").EnumerateArray())
        Check(b.GetProperty("unlocked").GetBoolean() == (b.GetProperty("id").GetString() == "triedAll" || b.GetProperty("id").GetString() == "genresAll" ? b.GetProperty("unlocked").GetBoolean() : b.GetProperty("current").GetInt64() >= b.GetProperty("target").GetInt64()), "badge unlocked ⇔ current >= target");
    // adding one more play can never lock a badge
    if (games.Count > 0)
    {
        var gg = new Dictionary<string, object>(g);
        var victim = games[rnd.Next(games.Count)].id;
        long before = g.TryGetValue(victim, out var cur) ? Math.Max(0, (long)(int)cur.GetType().GetProperty("n")!.GetValue(cur)!) : 0;
        gg[victim] = new { n = before + 1, last = 5000 };
        var r3 = JsonDocument.Parse(GenreReportCore.Compute(gj, JsonSerializer.Serialize(new { g = gg, d }), "2026-11-25")).RootElement;
        var b1 = o.GetProperty("badges").EnumerateArray().ToList();
        var b3 = r3.GetProperty("badges").EnumerateArray().ToList();
        for (int i = 0; i < b1.Count; i++)
            if (b1[i].GetProperty("unlocked").GetBoolean() && b1[i].GetProperty("id").GetString() != "triedAll" && b1[i].GetProperty("id").GetString() != "genresAll")
                Check(b3[i].GetProperty("unlocked").GetBoolean(), $"one more play locked badge {b1[i].GetProperty("id").GetString()}");
        Check(r3.GetProperty("totalPlays").GetInt64() >= total, "plays never decrease");
    }
}

// ---------- 4. real registry through the same engine ----------
var regPath = Path.Combine(root, "shared", "games-registry.json");
if (File.Exists(regPath))
{
    using var reg = JsonDocument.Parse(File.ReadAllText(regPath));
    var gs = reg.RootElement.GetProperty("games").EnumerateArray().OrderBy(x => x.GetProperty("order").GetInt32()).ToList();
    var gen = reg.RootElement.GetProperty("genres").EnumerateArray().Select(x => x.GetProperty("id").GetString()!).ToList();
    var ordered = gen.SelectMany(gn => gs.Where(x => x.GetProperty("genre").GetString() == gn)).ToList();
    var gj = JsonSerializer.Serialize(new { genres = gen, games = ordered.Select(x => new { id = x.GetProperty("id").GetString(), genre = x.GetProperty("genre").GetString(), adult = x.TryGetProperty("adult", out var ad) && ad.ValueKind == JsonValueKind.True }) });
    var res = JsonDocument.Parse(GenreReportCore.Compute(gj, "{\"g\":{},\"d\":{}}", "2026-11-25")).RootElement;
    Check(res.GetProperty("gamesTotal").GetInt32() == ordered.Count(x => !(x.TryGetProperty("adult", out var ad) && ad.ValueKind == JsonValueKind.True)), "registry: total excludes 20+ games");
    Check(res.GetProperty("next").GetProperty("reason").GetString() == "start", "registry: empty record starts at the beginning");
    var firstId = ordered.First(x => !(x.TryGetProperty("adult", out var ad) && ad.ValueKind == JsonValueKind.True)).GetProperty("id").GetString();
    Check(res.GetProperty("next").GetProperty("id").GetString() == firstId, "registry: first game is recommended");
    Console.WriteLine($"registry: {ordered.Count} games / {gen.Count} genres go through the engine");
}

Console.WriteLine(fails == 0 ? $"OK: {checks} checks passed" : $"NG: {fails} of {checks} checks failed");
return fails == 0 ? 0 : 1;

static string Trunc(string? s) => s == null ? "null" : (s.Length > 40 ? s.Substring(0, 40) + "…" : s);
