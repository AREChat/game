package statsanalyzer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class StatsAnalyzerTest {

    private static String csv(int... v) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < v.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(v[i]);
        }
        return sb.toString();
    }

    private static int[] hours(int hour, int n) {
        int[] h = new int[24];
        h[hour] = n;
        return h;
    }

    @Test
    void emptyIsNone() {
        assertEquals("{\"total\":0,\"peakHour\":-1,\"band\":\"none\",\"bands\":{\"morning\":0,\"day\":0,\"evening\":0,\"night\":0},\"weekendShare\":0,\"peakWeekday\":-1}",
                StatsAnalyzer.habits("", ""));
        assertEquals(StatsAnalyzer.habits("", ""), StatsAnalyzer.habits(null, null));
        assertEquals(StatsAnalyzer.habits("", ""), StatsAnalyzer.habits("0,0,0", "0"));
    }

    @Test
    void bandBoundaries() {
        // 境目：4時=night 5時=morning 10時=morning 11時=day 16時=day 17時=evening 21時=evening 22時=night 0時=night
        String[][] cases = {{"4", "night"}, {"5", "morning"}, {"10", "morning"}, {"11", "day"}, {"16", "day"}, {"17", "evening"}, {"21", "evening"}, {"22", "night"}, {"0", "night"}, {"23", "night"}};
        for (String[] c : cases) {
            String j = StatsAnalyzer.habits(csv(hours(Integer.parseInt(c[0]), 3)), "");
            assertTrue(j.contains("\"band\":\"" + c[1] + "\""), c[0] + " → " + j);
            assertTrue(j.contains("\"peakHour\":" + c[0] + ","), j);
            assertTrue(j.contains("\"total\":3"), j);
        }
    }

    @Test
    void tiesGoToTheEarliest() {
        int[] h = new int[24];
        h[20] = 5;
        h[8] = 5;
        String j = StatsAnalyzer.habits(csv(h), "0,0,0,0,0,0,0");
        assertTrue(j.contains("\"peakHour\":8,"), j);
        assertTrue(j.contains("\"band\":\"morning\""), j);
        String w = StatsAnalyzer.habits(csv(h), "0,0,4,0,0,4,0");
        assertTrue(w.contains("\"peakWeekday\":2}"), w);
    }

    @Test
    void weekendShare() {
        assertTrue(StatsAnalyzer.habits("", "3,0,0,0,0,0,1").contains("\"weekendShare\":100"));
        assertTrue(StatsAnalyzer.habits("", "0,1,1,1,1,1,0").contains("\"weekendShare\":0"));
        assertTrue(StatsAnalyzer.habits("", "1,1,1,1,0,0,2").contains("\"weekendShare\":50"));
        assertTrue(StatsAnalyzer.habits("", "1,0,0,0,0,0,0").contains("\"peakWeekday\":0"));
        assertTrue(StatsAnalyzer.habits("", "0,0,0,0,0,0,5").contains("\"peakWeekday\":6"));
        // 1/3 → 33
        assertTrue(StatsAnalyzer.habits("", "1,2,0,0,0,0,0").contains("\"weekendShare\":33"));
    }

    @Test
    void badInputsDoNotThrow() {
        String[] bads = {"x", "1,2,x,4", "-5,-6", ",,,", "1e5", "99999999999999999999", " 1 , 2 ", "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27"};
        for (String b : bads) {
            String j = StatsAnalyzer.habits(b, b);
            assertTrue(j.startsWith("{\"total\":") && j.endsWith("}"), b + " → " + j);
        }
        // 負の数は 0 / とても大きい数は 上限
        assertTrue(StatsAnalyzer.habits("-5,-6", "").contains("\"total\":0"));
        assertTrue(StatsAnalyzer.habits("99999999999999999999", "").contains("\"total\":0"));
        assertTrue(StatsAnalyzer.habits("5000000000", "").contains("\"total\":1000000000"));
        // 25番目以降は 無視
        String many = "0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,9,9";
        assertTrue(StatsAnalyzer.habits(many, "").contains("\"total\":0"));
        // 空白は 許す
        assertTrue(StatsAnalyzer.habits(" 1 , 2 ", "").contains("\"total\":3"));
    }

    @Test
    void bandsSumToTotal() {
        int[] h = new int[24];
        for (int i = 0; i < 24; i++) h[i] = i + 1;
        String j = StatsAnalyzer.habits(csv(h), "");
        assertTrue(j.contains("\"total\":300"), j);
        long morning = 0, day = 0, evening = 0, night = 0;
        for (int i = 0; i < 24; i++) {
            long v = h[i];
            if (i >= 5 && i <= 10) morning += v;
            else if (i >= 11 && i <= 16) day += v;
            else if (i >= 17 && i <= 21) evening += v;
            else night += v;
        }
        assertEquals(300, morning + day + evening + night);
        assertTrue(j.contains("\"morning\":" + morning + ",\"day\":" + day + ",\"evening\":" + evening + ",\"night\":" + night), j);
    }

    @Test
    void analyzeStillWorks() {
        String j = StatsAnalyzer.analyze("10:1;20:2;30:3", false);
        assertTrue(j.contains("\"count\":3") && j.contains("\"best\":30"), j);
        assertEquals("{\"count\":0}", StatsAnalyzer.analyze("", false));
        assertTrue(StatsAnalyzer.analyze("bad;1:2;x:y", true).contains("\"count\":1"));
        assertEquals("pong-from-java-teavm", StatsAnalyzer.ping());
    }
}
