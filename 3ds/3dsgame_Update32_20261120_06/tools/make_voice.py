"""make_voice.py - 台本の せりふから ボイス(合成音声)を つくる。
 使い方: python tools/make_voice.py   (プロジェクトの フォルダで。Windowsの「Microsoft Haruka」が ひつよう)
 1) tools/dump_lines.c で せりふの 一覧(スクリプトID・ステップ・しゃべる人・せりふ)を とりだす
 2) Windows の 音声合成(System.Speech)で 1行ずつ WAV に する
 3) しゃべる人ごとに 声の たかさを かえ(ピッチ変換)、12000Hz・8ビットの 小さな 生データ(.pcm)に して romfs/voice/<ID>_<ステップ>.pcm に おく
 台本の ID や 文が かわったら もう一度 実行する(tests/test_story.c が 古くなって いないか しらべる)。 """
import os, subprocess, sys, tempfile, wave, shutil
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
FROM_SCRIPT = 52          # S_CH5_ELDER 以降(第5章のおわり〜第6章)を ボイスつきに する(第1〜4章は 声なし)
RATE = 12000
PITCH = {"セラ": 1.14, "ガイ": 0.80, "ミオ": 1.02, "ルミナ": 1.26, "ヤミ": 0.74, "ダッシュ王": 0.84, "%N": 0.94,
         "村の人": 0.90, "子ども": 1.22, "おばあさん": 1.05, "旅人": 0.88, "アスレチックの おじさん": 0.82, "星読みの おじいさん": 0.80, "星の 記録": 1.1}

def find_gcc():
    import glob
    c = glob.glob(os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Packages\BrechtSanders*\mingw64\bin\gcc.exe"))
    return c[0] if c else "gcc"

def dump_lines():
    gcc = find_gcc()
    exe = os.path.join(ROOT, "build_host", "dump_lines.exe")
    os.makedirs(os.path.join(ROOT, "build_host"), exist_ok=True)
    env = dict(os.environ); env["PATH"] = os.path.dirname(gcc) + os.pathsep + env["PATH"]
    subprocess.check_call([gcc, "-std=c99", "-Isource", "tools/dump_lines.c", "source/data_story.c", "-o", exe], env=env)
    out = subprocess.check_output([exe, str(FROM_SCRIPT)]).decode("utf-8")
    rows = []
    for l in out.splitlines():
        p = l.split("\t")
        if len(p) == 4: rows.append((int(p[0]), int(p[1]), p[2], p[3]))
    return rows

def tts_text(t):
    t = t.replace("%N", "きみ").replace("……", "、、").replace("…", "、").replace(" ", "").replace("　", "").replace("♪", "")
    return t

def synth(rows, tmp):
    lst = os.path.join(tmp, "list.tsv")
    with open(lst, "w", encoding="utf-8") as f:
        for sid, step, who, text in rows:
            f.write("%d_%d\t%s\n" % (sid, step, tts_text(text)))
    ps = os.path.join(tmp, "synth.ps1")
    with open(ps, "w", encoding="utf-8-sig") as f:
        f.write("""
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice('Microsoft Haruka Desktop')
$s.Rate = 0
$fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(16000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
foreach ($line in [System.IO.File]::ReadAllLines('%s', [System.Text.Encoding]::UTF8)) {
  $p = $line.Split("`t")
  if ($p.Length -lt 2) { continue }
  $s.SetOutputToWaveFile('%s\\' + $p[0] + '.wav', $fmt)
  $s.Speak($p[1])
  $s.SetOutputToNull()
}
""" % (lst.replace("'", "''"), tmp.replace("'", "''")))
    subprocess.check_call(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ps])

def convert(wavpath, pitch):
    with wave.open(wavpath, "rb") as w:
        assert w.getnchannels() == 1 and w.getsampwidth() == 2
        sr = w.getframerate(); data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32)
    if len(data) == 0: return b""
    # 先頭と 末尾の むおんを けずる
    thr = 400
    idx = np.where(np.abs(data) > thr)[0]
    if len(idx): data = data[max(0, idx[0] - 200): idx[-1] + 600]
    # ピッチ変換(再生速度を pitch倍 にする = 長さは 1/pitch)+ 12000Hzへ
    n_out = int(len(data) / sr * RATE / pitch)
    if n_out < 10: return b""
    x = np.linspace(0, len(data) - 1, n_out)
    y = np.interp(x, np.arange(len(data)), data)
    # ひとつ ひとつ の 音の おおきさを そろえる
    peak = float(np.max(np.abs(y))) or 1.0
    y = y * (28000.0 / peak)
    y = np.clip(y, -32767, 32767)
    # 小さな 音を なめらかに(はじめと おわりに ちいさな フェード)
    f = min(120, len(y) // 4)
    if f > 0:
        y[:f] *= np.linspace(0, 1, f); y[-f:] *= np.linspace(1, 0, f)
    # 8ビット(符号つき)。ディザを いれて ざらつきを ならす
    rng = np.random.RandomState(7)
    q = np.floor(y / 256.0 + rng.uniform(-0.5, 0.5, len(y)) + 0.5)
    q = np.clip(q, -128, 127).astype(np.int8)
    return q.tobytes()

def main():
    rows = dump_lines()
    print("せりふ:", len(rows))
    tmp = tempfile.mkdtemp(prefix="voice_")
    try:
        synth(rows, tmp)
        outdir = os.path.join(ROOT, "romfs", "voice")
        if os.path.isdir(outdir): shutil.rmtree(outdir)
        os.makedirs(outdir)
        total = 0; made = 0
        for sid, step, who, text in rows:
            wp = os.path.join(tmp, "%d_%d.wav" % (sid, step))
            if not os.path.exists(wp): print("missing wav", sid, step); continue
            pcm = convert(wp, PITCH.get(who, 1.0))
            if not pcm: continue
            with open(os.path.join(outdir, "%d_%d.pcm" % (sid, step)), "wb") as f: f.write(pcm)
            total += len(pcm); made += 1
        print("ボイス: %d こ、あわせて %.1f MB (%.1f 分)" % (made, total / 1e6, total / RATE / 60))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

if __name__ == "__main__":
    main()
