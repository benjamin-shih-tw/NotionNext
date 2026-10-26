#!/usr/bin/env python3
"""Generate 2026/10/27–11/27 CP contests from live AtCoder Problems data.
Standard library only. Refuses to write if any verification fails.
"""
import csv
import io
import json
import random
import re
import sys
import time
import urllib.request
from collections import Counter
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

BASE = "https://kenkoooo.com/atcoder/resources/"
START = date(2026, 10, 27)
END = date(2026, 11, 27)
CUTOFF = datetime(2026, 10, 26, 23, 59, tzinfo=timezone(timedelta(hours=8))).timestamp()
ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "lib/cp/contests.js"
OUT = ROOT / "lib/cp/schedule-2026-10-27.js"
AUDIT = ROOT / "cp-audit/2026-10-27_2026-11-27"
IMPORT = "import { CP_DATED_CONTESTS } from './schedule-2026-10-27'\n"
SPREAD = "  ...CP_DATED_CONTESTS,\n"


def download(name):
    url = BASE + name + ".json"
    print("Fetching and checking:", url, flush=True)
    req = urllib.request.Request(url, headers={"User-Agent": "CP-Schedule-Validator/1.0"})
    last = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                raw = r.read()
            data = json.loads(raw)
            if len(raw) < 1000:
                raise ValueError("Unusually short response")
            time.sleep(1.2)
            return data
        except Exception as e:
            last = e
            time.sleep(2 + attempt * 2)
    raise RuntimeError(f"Cannot verify {url}: {last}")


def color(x):
    if 400 <= x < 800:
        return "brown"
    if 800 <= x < 1200:
        return "green"
    return None


def difficulty(models, pid):
    obj = models.get(pid)
    if not isinstance(obj, dict):
        return None
    d = obj.get("difficulty")
    if isinstance(d, bool) or not isinstance(d, (int, float)):
        return None
    if not (-100000 < d < 100000):
        return None
    return float(d)


def write(path, s):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(s, encoding="utf-8")
    tmp.replace(path)


def main():
    if not SRC.is_file():
        raise RuntimeError("Run this script inside the NotionNext repository.")
    original = SRC.read_text(encoding="utf-8")
    if IMPORT in original and OUT.is_file():
        print("Schedule already installed; refusing to regenerate over existing sessions.")
        return

    models = download("problem-models")
    problems = download("merged-problems")
    contests = download("contests")
    models_again = download("problem-models")
    if not isinstance(models, dict) or not isinstance(problems, list) or not isinstance(contests, list):
        raise RuntimeError("Invalid AtCoder Problems data.")
    pm = {p.get("id"): p for p in problems if isinstance(p, dict)}
    cm = {c.get("id"): c for c in contests if isinstance(c, dict)}
    excluded = set(re.findall(r"abc\d{3}_[a-z]", original))

    pool = {"brown": [], "green": []}
    for pid in models:
        m = re.fullmatch(r"abc(\d{3})_([cde])", pid)
        if not m or pid in excluded:
            continue
        d = difficulty(models, pid)
        if d is None:
            continue
        band = color(d)
        if (band == "brown" and not 450 <= d <= 750) or (band == "green" and not 850 <= d <= 1150):
            continue
        if band is None:
            continue
        p = pm.get(pid)
        c = cm.get("abc" + m.group(1))
        if not p or not c or p.get("contest_id") != c.get("id"):
            continue
        if c.get("start_epoch_second", float("inf")) > CUTOFF:
            continue
        if p.get("problem_index", m.group(2).upper()) != m.group(2).upper():
            continue
        name = p.get("title") or p.get("name")
        if not isinstance(name, str) or not name:
            continue
        pool[band].append({
            "id": pid, "title": name, "difficulty": round(d),
            "rawDifficulty": d, "band": band, "topic": "賽後填寫觀察",
            "url": f"https://atcoder.jp/contests/{c['id']}/tasks/{pid}"
        })
    print("Eligible candidates:", {k: len(v) for k, v in pool.items()})
    if len(pool["brown"]) < 56 or len(pool["green"]) < 108:
        raise RuntimeError("Not enough verified brown/green problems. No files modified.")

    rng = random.Random(202610271127)
    used_ids = set(excluded)
    usage = Counter()
    results = []
    day = START
    while day <= END:
        weekday = day.weekday()
        if weekday == 6:
            day += timedelta(days=1)
            continue
        big = weekday == 5
        sessions = [("big", 150, ["brown"] * 2 + ["green"] * 3)] if big else [
            ("a", 50, ["brown", "green", "green"]),
            ("b", 50, ["brown", "green", "green"])
        ]
        same_day_sources = set()
        for session, minutes, bands in sessions:
            picked = []
            for i, band in enumerate(bands):
                available = [
                    p for p in pool[band]
                    if p["id"] not in used_ids
                    and p["id"].split("_")[0] not in same_day_sources
                ]
                if not available:
                    raise RuntimeError("No unique problems remain; no files modified.")
                target = (570 if i == 0 else 975) if not big else (600 if i < 2 else 990)
                available.sort(key=lambda p: (
                    abs(p["rawDifficulty"] - target)
                    + 160 * usage[p["id"].split("_")[0]]
                ))
                choice = rng.choice(available[:min(12, len(available))])
                picked.append(choice)
                used_ids.add(choice["id"])
                source = choice["id"].split("_")[0]
                same_day_sources.add(source)
                usage[source] += 1
            results.append({
                "slug": f"d{day:%Y%m%d}-{session}",
                "date": day.isoformat(),
                "day": f"{day:%m/%d}",
                "session": session.upper(),
                "title": f"{day:%Y/%m/%d} {'Big Mashup' if big else session.upper() + ' Mashup'}",
                "durationMinutes": minutes, "kind": "big" if big else "mini",
                "problems": picked
            })
        day += timedelta(days=1)

    rows = [
        {"date": r["date"], "session": r["session"], "slug": r["slug"],
         "problemId": p["id"], "difficulty": p["rawDifficulty"], "band": p["band"], "url": p["url"]}
        for r in results for p in r["problems"]
    ]
    if len(results) != 52 or len(rows) != 164 or len({r["problemId"] for r in rows}) != 164:
        raise RuntimeError("Calendar or uniqueness validation failed; no files modified.")
    if Counter(r["band"] for r in rows) != Counter({"brown": 56, "green": 108}):
        raise RuntimeError("Color distribution invalid; no files modified.")
    for r in rows:
        first = r["difficulty"]
        second = difficulty(models_again, r["problemId"])
        if second is None or abs(second - first) > 0.000001 or color(first) != r["band"]:
            raise RuntimeError(f"DOUBLE CHECK FAILED: {r['problemId']}. No files modified.")

    marker = "export const CP_CONTESTS = [\n"
    if marker not in original:
        raise RuntimeError("Unexpected lib/cp/contests.js structure; no files modified.")
    new_main = IMPORT + original.replace(marker, marker + SPREAD, 1)
    static_updates = {}
    for relative, prefix, replacement in [
        ("pages/cp/index.js", "export async function getStaticProps({ locale }) {",
         """export function getStaticProps() {
  return { props: { meta: { title: 'CP Training', description: 'Mashup contest runner' } } }
}
"""),
        ("pages/cp/[slug].js", "export async function getStaticProps({ params, locale }) {",
         """export function getStaticProps({ params }) {
  const contest = getCpContest(params.slug)
  if (!contest) return { notFound: true }
  return { props: { contest, meta: {
    title: contest.title,
    description: 'Mashup contest runner'
  } } }
}
""")
    ]:
        f = ROOT / relative
        content = f.read_text(encoding="utf-8")
        if "fetchGlobalAllData" in content:
            if prefix not in content:
                raise RuntimeError(f"Cannot safely patch {relative}. No files modified.")
            content = content[:content.index(prefix)] + replacement
            content = content.replace("import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'\n", "")
            static_updates[f] = content

    # All validation passes before ANY repository files are written.
    js = "// Auto-generated from AtCoder Problems. Verified twice.\n"
    js += "export const CP_DATED_CONTESTS = " + json.dumps(results, ensure_ascii=False, indent=2) + "\n"
    write(OUT, js)
    write(SRC, new_main)
    for path, content in static_updates.items():
        write(path, content)
    data = io.StringIO()
    w = csv.DictWriter(data, fieldnames=list(rows[0].keys()))
    w.writeheader()
    w.writerows(rows)
    write(AUDIT / "verified_problems.csv", data.getvalue())
    write(AUDIT / "verification.json", json.dumps({
        "source": BASE, "doubleChecked": True,
        "start": START.isoformat(), "end": END.isoformat(),
        "contests": len(results), "uniqueProblems": len(rows),
        "colors": dict(Counter(r["band"] for r in rows))
    }, indent=2) + "\n")
    print("SUCCESS: 52 contests; 164 UNIQUE problems; double-checked difficulty")
    print("Brown: 56  Green: 108")
    print("Next: git add lib/cp pages/cp cp-audit && git commit && git push")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("ERROR:", e, file=sys.stderr)
        sys.exit(1)
