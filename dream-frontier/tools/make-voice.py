# 使い方：pip install kokoro-onnx pyopenjtalk soundfile（と ffmpeg）。kokoro.onnx・voices.bin を おいて、python3 make-voice.py <出力フォルダ>
# Kokoro（日本語）：espeak ではなく、pyopenjtalk の読み（日本語用）を IPA に変換して わたす
import soundfile as sf, subprocess, json, os, re, sys
import pyopenjtalk
from kokoro_onnx import Kokoro
from voice_lines import L   # このフォルダの voice_lines.py
OUT = sys.argv[1] if len(sys.argv) > 1 else "/tmp/voice_new"
FN = lambda i: i if i.startswith(("cosmo_", "cosmo2_", "ann_")) else "cheese_" + i   # cosmo_ / ann_ で はじまる ものは そのまま ファイル名に する
os.makedirs(OUT, exist_ok=True)
V = {"gf": ("jf_tebukuro", 1.0, 1.0), "gm": ("jm_kumo", 1.0, 1.0), "gaku": ("jm_kumo", 1.0, 1.14), "mimi": ("jf_alpha", 1.0, 1.10),
     "cat": ("jm_kumo", 0.98, 0.82), "mouse": ("jf_nezumi", 1.05, 1.38),
     "cmd": ("jm_kumo", 0.97, 0.80), "gov": ("jm_kumo", 0.80, 0.64), "pico": ("jf_nezumi", 1.02, 1.38), "bot": ("jf_nezumi", 1.0, 1.22), "pilot": ("jm_kumo", 1.04, 1.02)}
MAP = {"a": "a", "i": "i", "u": "ɯ", "e": "e", "o": "o", "A": "a", "I": "i", "U": "ɯ", "E": "e", "O": "o", "N": "ɴ", "cl": "ʔ",
       "k": "k", "g": "ɡ", "s": "s", "sh": "ɕ", "z": "z", "j": "ʥ", "t": "t", "ts": "ʦ", "ch": "ʨ", "d": "d", "n": "n", "ny": "ɲ", "h": "h", "hy": "ç", "f": "ɸ",
       "b": "b", "p": "p", "m": "m", "y": "j", "r": "ɾ", "w": "w", "ky": "kʲ", "gy": "ɡʲ", "py": "pʲ", "by": "bʲ", "my": "mʲ", "ry": "ɾʲ", "dy": "dʲ", "ty": "tʲ", "v": "b"}
def chunk_ph(txt):
    ph = pyopenjtalk.g2p(txt).split(" "); out = []
    for p in ph:
        if p in ("pau", "sil", ""): continue
        m = MAP.get(p)
        if m is None: print("??", p); continue
        # ー と 同じ母音の れんぞくは 長音に
        if out and m in "aieoɯ" and out[-1] == m and p.islower(): out[-1] = m + "ː"; continue
        out.append(m)
    return "".join(out)
def phon(text):
    text = text.replace("　", " "); parts = re.split(r"([、。！？!?])", text); s = ""
    for i in range(0, len(parts), 2):
        seg = re.sub(r"\s+", "", parts[i]); p = parts[i + 1] if i + 1 < len(parts) else ""
        if seg: s += chunk_ph(seg)
        s += {"、": ", ", "。": ". ", "！": "! ", "!": "! ", "？": "? ", "?": "? ", "": " "}[p]
    return s.strip()
if __name__ == "__main__":
    k = Kokoro("kokoro.onnx", "voices.bin"); man = {}
    only = set(sys.argv[2:]) if len(sys.argv) > 2 else None
    for i, (who, text) in L.items():
        if only and i not in only: continue
        v, sp, pit = V[who]; ph = phon(text); print(i, ph)
        s, sr = k.create(ph, voice=v, speed=sp, lang="ja", is_phonemes=True)
        wav = f"/tmp/{i}.wav"; sf.write(wav, s, sr)
        af = "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse"
        if abs(pit - 1) > .001: af = f"asetrate={int(sr*pit)},aresample={sr},atempo={1/pit:.4f}," + af
        af += ",loudnorm=I=-18:TP=-2,afade=t=in:d=0.02"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-af", af, "-ac", "1", "-b:a", "56k", "-ar", "24000", f"{OUT}/{FN(i)}.mp3"], check=True)
        d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"{OUT}/{FN(i)}.mp3"]))
        man[i] = {"w": who, "t": text, "d": round(d, 2)}; print("  ->", round(d, 2))
    json.dump(man, open(f"{OUT}/voice_manifest.json", "w"), ensure_ascii=False, indent=1)
