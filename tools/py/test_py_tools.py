"""Python の道具の テスト：  python3 -m unittest discover -s tools/py -v"""
import hashlib
import io
import json
import os
import sys
import tempfile
import unittest
from contextlib import redirect_stdout

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import genre_covers  # noqa: E402
import registry_md  # noqa: E402
import sheet_slicer  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))


class SlicerTests(unittest.TestCase):
    def test_selftest_passes(self):
        with redirect_stdout(io.StringIO()):
            self.assertEqual(sheet_slicer.selftest(), 0)

    def test_cli_errors_have_exit_codes(self):
        self.assertEqual(sheet_slicer.main([]), 1)
        self.assertEqual(sheet_slicer.main(["nope.png", "--grid", "2x2"]), 1)
        self.assertEqual(sheet_slicer.main(["nope.png", "--grid", "x"]), 1)

    def test_cli_end_to_end(self):
        with tempfile.TemporaryDirectory() as d:
            sheet = os.path.join(d, "s.png")
            sheet_slicer._make_test_sheet(sheet)
            with redirect_stdout(io.StringIO()):
                rc = sheet_slicer.main([sheet, "--grid", "4x2", "--names", "a,b,c,d,e,f,g,h", "--out", os.path.join(d, "o"), "--fit", "64"])
            self.assertEqual(rc, 0)
            m = json.load(open(os.path.join(d, "o", "manifest.json"), encoding="utf-8"))
            self.assertEqual(m["count"], 8)
            self.assertTrue(all(os.path.isfile(os.path.join(d, "o", s["file"])) for s in m["sprites"]))

    def test_unicode_names_are_rejected_or_kept_safe(self):
        # 日本語の名前は そのまま 使えない（URL・ファイル名で こまるので _ に置きかえる）
        self.assertEqual(sheet_slicer.safe_name("りんご"), "___")
        with self.assertRaises(sheet_slicer.SliceError):
            sheet_slicer.safe_name("")
        with self.assertRaises(sheet_slicer.SliceError):
            sheet_slicer.safe_name(".hidden")


class CoverTests(unittest.TestCase):
    def test_covers_are_deterministic_and_small(self):
        a = genre_covers.build(None)
        b = genre_covers.build(None)
        self.assertEqual({k: hashlib.sha256(v).hexdigest() for k, v in a.items()}, {k: hashlib.sha256(v).hexdigest() for k, v in b.items()})
        reg = json.load(open(os.path.join(ROOT, "shared", "games-registry.json"), encoding="utf-8"))
        self.assertEqual(set(a), {f"genre-{g['id']}.webp" for g in reg["genres"]})
        for name, data in a.items():
            self.assertLess(len(data), 60 * 1024, name)
            self.assertGreater(len(data), 2000, name)

    def test_committed_covers_are_current(self):
        with redirect_stdout(io.StringIO()):
            self.assertEqual(genre_covers.main(["--check"]), 0)


class RegistryMdTests(unittest.TestCase):
    def test_markdown_covers_every_game(self):
        reg = json.load(open(os.path.join(ROOT, "shared", "games-registry.json"), encoding="utf-8"))
        md = registry_md.render(reg)
        for g in reg["games"]:
            self.assertIn(g["name"]["ja"], md)
        for gn in reg["genres"]:
            self.assertIn(gn["name"]["ja"], md)

    def test_committed_md_is_current(self):
        with redirect_stdout(io.StringIO()):
            self.assertEqual(registry_md.main(["--check"]), 0)


if __name__ == "__main__":
    unittest.main()
