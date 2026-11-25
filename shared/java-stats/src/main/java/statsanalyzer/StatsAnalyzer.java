package statsanalyzer;

import java.util.ArrayList;
import java.util.List;
import org.teavm.jso.JSExport;

/**
 * Small analytics engine for per-run game records (race lap times, RPG battle
 * scores, shooter mission results, etc.), written in Java and compiled to
 * JavaScript with TeaVM (https://teavm.org). It is deliberately generic and
 * wire-format based (not tied to any one game's save schema) so the same
 * compiled module can be loaded by several different games and handed their
 * own history of numeric results.
 *
 * Wire format for {@link #analyze}: a single string of
 *   "<value>:<unixMillis>;<value>:<unixMillis>;..."
 * records, oldest first. This avoids pulling in a JSON library for a module
 * whose whole point is to stay small; each game's own JS glue code is
 * responsible for turning its existing localStorage save data into this
 * compact format before calling into the compiled Java code, and for parsing
 * the small JSON report that comes back.
 */
public final class StatsAnalyzer {

    private StatsAnalyzer() {
    }

    public static void main(String[] args) {
        // Entry point required by TeaVM; all real work happens in the
        // @JSExport-annotated static methods below, which become callable
        // top-level JS functions once stats-analyzer.js is loaded.
    }

    /**
     * @param recordsRaw   records in the wire format described above.
     * @param lowerIsBetter true for things like lap times (smaller = better),
     *                      false for things like scores or kill counts.
     * @return a small JSON object (string) with best/worst/average/median,
     *         a trend classification, the current "improvement streak" and a
     *         simple standard deviation, e.g.
     *         {"count":12,"best":41.2,"worst":58.9,"average":47.3,
     *          "median":46.8,"stdev":4.9,"trend":"improving",
     *          "trendDelta":-3.1,"streak":4,"recentAverage":43.0}
     */
    @JSExport
    public static String analyze(String recordsRaw, boolean lowerIsBetter) {
        List<Record> records = parse(recordsRaw);
        int n = records.size();
        if (n == 0) {
            return "{\"count\":0}";
        }

        double best = lowerIsBetter ? Double.POSITIVE_INFINITY : Double.NEGATIVE_INFINITY;
        double worst = lowerIsBetter ? Double.NEGATIVE_INFINITY : Double.POSITIVE_INFINITY;
        double sum = 0;
        double[] values = new double[n];
        for (int i = 0; i < n; i++) {
            double v = records.get(i).value;
            values[i] = v;
            sum += v;
            if (lowerIsBetter) {
                if (v < best) best = v;
                if (v > worst) worst = v;
            } else {
                if (v > best) best = v;
                if (v < worst) worst = v;
            }
        }
        double average = sum / n;

        double[] sorted = values.clone();
        java.util.Arrays.sort(sorted);
        double median = (n % 2 == 1)
                ? sorted[n / 2]
                : (sorted[n / 2 - 1] + sorted[n / 2]) / 2.0;

        double variance = 0;
        for (double v : values) {
            double d = v - average;
            variance += d * d;
        }
        double stdev = Math.sqrt(variance / n);

        // Trend: compare the average of the newer half of the run history to
        // the older half. Needs at least 4 data points to be meaningful.
        String trend = "flat";
        double trendDelta = 0;
        if (n >= 4) {
            int half = n / 2;
            double oldAvg = average(values, 0, half);
            double newAvg = average(values, n - half, n);
            trendDelta = newAvg - oldAvg;
            double threshold = Math.max(stdev * 0.15, 0.001);
            if (lowerIsBetter) {
                if (trendDelta < -threshold) trend = "improving";
                else if (trendDelta > threshold) trend = "declining";
            } else {
                if (trendDelta > threshold) trend = "improving";
                else if (trendDelta < -threshold) trend = "declining";
            }
        }

        // Current improvement streak: how many of the most recent runs, read
        // backwards, each improved on (or matched) the one right before it.
        int streak = 0;
        for (int i = n - 1; i > 0; i--) {
            boolean improved = lowerIsBetter
                    ? values[i] <= values[i - 1]
                    : values[i] >= values[i - 1];
            if (improved) {
                streak++;
            } else {
                break;
            }
        }

        int recentWindow = Math.min(5, n);
        double recentAverage = average(values, n - recentWindow, n);

        StringBuilder json = new StringBuilder(128);
        json.append("{\"count\":").append(n);
        json.append(",\"best\":").append(num(best));
        json.append(",\"worst\":").append(num(worst));
        json.append(",\"average\":").append(num(average));
        json.append(",\"median\":").append(num(median));
        json.append(",\"stdev\":").append(num(stdev));
        json.append(",\"trend\":\"").append(trend).append('"');
        json.append(",\"trendDelta\":").append(num(trendDelta));
        json.append(",\"streak\":").append(streak);
        json.append(",\"recentAverage\":").append(num(recentAverage));
        json.append('}');
        return json.toString();
    }

    /** Simple health/sanity probe used by the integration test page. */
    @JSExport
    public static String ping() {
        return "pong-from-java-teavm";
    }


    /**
     * Play-habit summary for the ARE GAMES hub ("あそび方の傾向").
     *
     * @param hoursCsv    24 comma separated counts: plays that started in each hour of the
     *                    day (0..23, device local time). Missing / negative / malformed
     *                    entries count as 0; extra entries are ignored.
     * @param weekdaysCsv 7 comma separated counts, Sunday = 0 .. Saturday = 6.
     * @return JSON such as
     *         {"total":12,"peakHour":21,"band":"evening","bands":{"morning":1,"day":2,"evening":6,"night":3},
     *          "weekendShare":50,"peakWeekday":6}
     *         ("band" is "none" and the peaks are -1 when nothing has been played yet.)
     *         Bands: morning 5-10, day 11-16, evening 17-21, night 22-4. Ties go to the earliest.
     */
    @JSExport
    public static String habits(String hoursCsv, String weekdaysCsv) {
        long[] h = parseCounts(hoursCsv, 24);
        long[] w = parseCounts(weekdaysCsv, 7);
        long total = 0;
        int peakHour = -1;
        long peakVal = 0;
        long[] bands = new long[4]; // morning, day, evening, night
        for (int i = 0; i < 24; i++) {
            total += h[i];
            if (h[i] > peakVal) {
                peakVal = h[i];
                peakHour = i;
            }
            bands[bandOf(i)] += h[i];
        }
        int band = -1;
        long bandVal = 0;
        for (int b = 0; b < 4; b++) {
            if (bands[b] > bandVal) {
                bandVal = bands[b];
                band = b;
            }
        }
        long wTotal = 0;
        int peakWeekday = -1;
        long wPeak = 0;
        for (int i = 0; i < 7; i++) {
            wTotal += w[i];
            if (w[i] > wPeak) {
                wPeak = w[i];
                peakWeekday = i;
            }
        }
        long weekend = w[0] + w[6];
        long share = wTotal == 0 ? 0 : Math.round(100.0 * weekend / wTotal);
        String[] names = {"morning", "day", "evening", "night"};
        StringBuilder json = new StringBuilder();
        json.append("{\"total\":").append(total);
        json.append(",\"peakHour\":").append(peakHour);
        json.append(",\"band\":\"").append(band < 0 ? "none" : names[band]).append('"');
        json.append(",\"bands\":{");
        for (int b = 0; b < 4; b++) {
            if (b > 0) json.append(',');
            json.append('"').append(names[b]).append("\":").append(bands[b]);
        }
        json.append('}');
        json.append(",\"weekendShare\":").append(share);
        json.append(",\"peakWeekday\":").append(peakWeekday);
        json.append('}');
        return json.toString();
    }

    private static int bandOf(int hour) {
        if (hour >= 5 && hour <= 10) return 0;
        if (hour >= 11 && hour <= 16) return 1;
        if (hour >= 17 && hour <= 21) return 2;
        return 3;
    }

    private static long[] parseCounts(String csv, int size) {
        long[] out = new long[size];
        if (csv == null || csv.isEmpty()) {
            return out;
        }
        String[] parts = csv.split(",");
        for (int i = 0; i < size && i < parts.length; i++) {
            try {
                long v = Long.parseLong(parts[i].trim());
                out[i] = v < 0 ? 0 : Math.min(v, 1_000_000_000L);
            } catch (NumberFormatException ignored) {
                out[i] = 0;
            }
        }
        return out;
    }

    private static double average(double[] values, int fromInclusive, int toExclusive) {
        double s = 0;
        int c = 0;
        for (int i = fromInclusive; i < toExclusive; i++) {
            s += values[i];
            c++;
        }
        return c == 0 ? 0 : s / c;
    }

    private static String num(double v) {
        if (Double.isInfinite(v) || Double.isNaN(v)) {
            return "0";
        }
        // Round to 3 decimals without pulling in String.format (keeps the
        // compiled JS small).
        double rounded = Math.round(v * 1000.0) / 1000.0;
        if (rounded == Math.floor(rounded) && !Double.isInfinite(rounded)) {
            return Long.toString((long) rounded);
        }
        return Double.toString(rounded);
    }

    private static List<Record> parse(String raw) {
        List<Record> out = new ArrayList<>();
        if (raw == null || raw.isEmpty()) {
            return out;
        }
        String[] parts = raw.split(";");
        for (String part : parts) {
            if (part.isEmpty()) continue;
            int idx = part.indexOf(':');
            try {
                if (idx < 0) {
                    out.add(new Record(Double.parseDouble(part), 0));
                } else {
                    double v = Double.parseDouble(part.substring(0, idx));
                    long ts = Long.parseLong(part.substring(idx + 1));
                    out.add(new Record(v, ts));
                }
            } catch (NumberFormatException ignored) {
                // skip malformed entries rather than failing the whole batch
            }
        }
        return out;
    }

    private static final class Record {
        final double value;
        final long timestamp;

        Record(double value, long timestamp) {
            this.value = value;
            this.timestamp = timestamp;
        }
    }
}
