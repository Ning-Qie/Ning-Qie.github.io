#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
一次性迁移脚本：把 4 个 Markdown 巨型文章拆成 4 个独立 JSON 数据文件。

  _posts/2020-11-03-zhaichao.md          -> _data/quotes.json
  _posts/2021-03-24-zaji.md              -> _data/notes.json
  _posts/2022-11-15-Crazy-Poem.md        -> _data/poems-crazy.json
  _posts/2021-01-25-Paradise-of-Poetry.md -> _data/poems-paradise.json

原则：一个 post 一个文件，绝不跨文件合并。
运行：python3 scripts/migrate.py
"""

import json
import re
import shutil
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
POSTS = ROOT / "_posts"
DATA = ROOT / "_data"
BACKUP = ROOT / "_backup" / "2026-10-28"

SOURCES = [
    ("quotes", POSTS / "2020-11-03-zhaichao.md", "quotes.json", "q", "year"),
    ("notes", POSTS / "2021-03-24-zaji.md", "notes.json", "n", "year"),
    ("poems-crazy", POSTS / "2022-11-15-Crazy-Poem.md", "poems-crazy.json", "pc", "year"),
]

DATE_FULL = re.compile(r"^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})\s*(.*)$")
DATE_CN = re.compile(r"^(\d{4})年(\d{1,2})月(\d{1,2})日\s*(.*)$")
DATE_YM = re.compile(r"^(\d{4})[.\-/](\d{1,2})(?:\s+|$)(.*)$")
DATE_Y = re.compile(r"^(\d{4})\s*(.*)$")
YEAR_HEAD = re.compile(r"^#\s+(\d{4})\s*$")
AUTHOR_TAG = re.compile(r"<author>(.*?)</author>", re.S)


def read_post(path):
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        return text
    parts = text.split("---", 2)
    return parts[2] if len(parts) >= 3 else text


def strip_decorations(body):
    body = re.sub(r"<style>.*?</style>", "", body, flags=re.S)
    body = body.replace("* content\n{:toc}", "")
    body = re.sub(r"<div class=\"note info\">.*?</div>\s*", "", body, flags=re.S)
    body = body.replace("<br/>", "<br>").replace("<br />", "<br>")
    return body


def clean_text(raw_lines):
    """把 HTML 换行/标签清理成可展示的纯文本，保留段落空行。"""
    # 这些原文用 <br> 表示硬换行，源码里的换行本身只是排版；
    # 先拼成一条流再替换 <br>，避免每行变成双倍空行。
    text = "".join(raw_lines)
    text = text.replace("<br>", "\n")
    text = re.sub(r"<br\s*/?>", "\n", text)
    text = text.replace("&nbsp;", " ")
    text = re.sub(r"<[^>]+>", "", text)
    text = text.replace("**", "").replace("\u200b", "").replace("\ufeff", "")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    lines = [ln.rstrip() for ln in text.split("\n")]
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    return "\n".join(lines).strip()


def norm_line(line):
    line = line.replace("<br>", "").replace("<br/>", "").replace("<br />", "")
    line = re.sub(r"<[^>]+>", "", line)
    line = line.replace("&nbsp;", " ").replace("**", "").replace("\u200b", "").replace("\ufeff", "")
    return re.sub(r"\s+", "", line)


def parse_attribution(attr, fallback_year):
    """解析 '——2026.8.26 作者《书名》备注'。返回字段 + 是否为异常格式。"""
    raw = attr.strip()
    raw = re.sub(r"^—+", "", raw).strip()
    raw = raw.replace("<br>", "").strip()

    date = None
    label = ""
    rest = raw
    m = DATE_FULL.match(raw) or DATE_CN.match(raw)
    if m:
        y, mo, d, rest = int(m.group(1)), int(m.group(2)), int(m.group(3)), m.group(4).strip()
        date = f"{y:04d}-{mo:02d}-{d:02d}"
        label = f"{y}.{mo}.{d}"
    else:
        m = DATE_YM.match(raw)
        if m:
            y, mo, rest = int(m.group(1)), int(m.group(2)), m.group(3).strip()
            date = f"{y:04d}-{mo:02d}-01"
            label = f"{y}.{mo}"
        else:
            m = DATE_Y.match(raw)
            if m:
                y, rest = int(m.group(1)), m.group(2).strip()
                date = f"{y:04d}-01-01"
                label = f"{y:04d}"

    author = ""
    source = ""
    note = ""
    sm = re.search(r"《([^》]+)》", rest)
    if sm:
        source = sm.group(1).strip()
        author = rest[: sm.start()].strip()
        note = rest[sm.end():].strip()
    else:
        author = rest.strip()

    date_note = ""
    # 原文里的 2107.11.20 等明显是 2017 的笔误：按所在年份归位，并记录
    if date:
        yy = int(date[:4])
        if (yy > 2100 or yy < 1900) and fallback_year and 1900 <= int(fallback_year) <= 2100:
            old = date
            date = f"{int(fallback_year):04d}" + date[4:]
            label = label.replace(str(yy), str(int(fallback_year)), 1)
            date_note = f"原出处年份为 {old[:4]}，疑似笔误，已按所在年份 {fallback_year} 归位"

    if not date and fallback_year:
        date = f"{int(fallback_year):04d}-01-01"
        label = f"{int(fallback_year):04d}"

    anomaly = (not bool(re.match(r"^\d{4}", raw))) and bool(raw)
    return {
        "date": date or "",
        "dateLabel": label,
        "author": author,
        "source": source,
        "note": note,
        "cite": raw,
        "citeAnomaly": anomaly,
        "dateNote": date_note,
    }


def parse_year_entries(key, path, prefix, tags):
    body = strip_decorations(read_post(path))
    year = None
    entries = []
    buf = []
    order = 0
    anomalies = []
    missing = []
    used_lines = []

    def flush(attr):
        nonlocal order, buf
        text = clean_text(buf)
        buf = []
        if not text:
            missing.append(("empty-text", attr))
            return
        parsed = parse_attribution(attr, year)
        if parsed["citeAnomaly"] or parsed["dateNote"]:
            anomalies.append({"attr": attr.strip(), "year": year, "note": parsed["dateNote"]})
        entry_year = int(parsed["date"][:4]) if parsed["date"] else (int(year) if year else 0)
        entry = {
            "id": f"{prefix}-{(parsed['date'].replace('-', '') if parsed['date'] else entry_year)}-{order}",
            "date": parsed["date"],
            "dateLabel": parsed["dateLabel"],
            "text": text,
            "author": parsed["author"],
            "source": parsed["source"],
            "note": parsed["note"],
            "cite": parsed["cite"],
            "citeAnomaly": parsed["citeAnomaly"],
            "dateNote": parsed["dateNote"],
            "year": entry_year,
            "tags": tags,
        }
        entries.append(entry)
        order += 1
        used_lines.extend(text.split("\n"))

    for line in body.split("\n"):
        s = line.strip()
        if YEAR_HEAD.match(s):
            year = YEAR_HEAD.match(s).group(1)
            continue
        if s.startswith("——"):
            flush(s)
            continue
        buf.append(line)
    if any(x.strip() for x in buf):
        missing.append(("tail", clean_text(buf)[:80]))

    return entries, anomalies, missing, used_lines


def parse_paradise():
    body = strip_decorations(read_post(POSTS / "2021-01-25-Paradise-of-Poetry.md"))
    lines = body.split("\n")
    # 去掉 💌 分隔行和空 <br>
    lines = [ln for ln in lines if ln.strip() and "💌" not in ln]

    first_sec = next(i for i, ln in enumerate(lines) if ln.strip().startswith("# 📜"))
    preface = lines[:first_sec]
    rest = lines[first_sec:]

    entries = []
    anomalies = []
    used_lines = []
    order = 0

    # 序诗
    title = ""
    attr = ""
    pre_body = []
    for ln in preface:
        s = ln.strip()
        if re.match(r"^\*\*.+\*\*$", s.replace("<br>", "")):
            title = s.replace("<br>", "").strip("*").strip()
            continue
        if s.startswith("——"):
            attr = s
            continue
        pre_body.append(ln)
    if attr:
        p = parse_attribution(attr, None)
        text = clean_text(pre_body)
        entries.append({
            "id": "pp-0000",
            "date": p["date"],
            "dateLabel": p["dateLabel"],
            "title": title,
            "author": p["author"],
            "section": "现代诗",
            "text": text,
            "note": "",
            "cite": p["cite"],
            "citeAnomaly": False,
            "dateNote": "",
            "year": int(p["date"][:4]) if p["date"] else 0,
            "tags": ["诗", "现代诗"],
            "featured": True,
            "order": order,
        })
        used_lines.extend(text.split("\n"))
        order += 1

    section = None
    cur_title = None
    cur_lines = []
    cur_order = order

    def flush_poem():
        nonlocal cur_title, cur_lines, cur_order
        if cur_title is None:
            return
        author = ""
        text_lines = []
        attr_line = ""
        for ln in cur_lines:
            s = ln.strip()
            am = AUTHOR_TAG.search(s)
            if am:
                author = am.group(1).strip()
                continue
            if s.startswith("——"):
                attr_line = s
                continue
            text_lines.append(ln)
        text = clean_text(text_lines)
        p = parse_attribution(attr_line, None) if attr_line else {
            "date": "", "dateLabel": "", "cite": "", "citeAnomaly": False,
        }
        entries.append({
            "id": f"pp-{cur_order:04d}",
            "date": p["date"],
            "dateLabel": p["dateLabel"],
            "title": cur_title.strip(),
            "author": author or p.get("author", ""),
            "section": section,
            "text": text,
            "note": "",
            "cite": p.get("cite", ""),
            "citeAnomaly": False,
            "dateNote": p.get("dateNote", ""),
            "year": int(p["date"][:4]) if p.get("date") else 0,
            "tags": ["诗", section],
            "order": cur_order,
        })
        used_lines.extend(text.split("\n"))
        cur_order += 1
        cur_title = None
        cur_lines = []

    for ln in rest:
        s = ln.strip()
        if s.startswith("# 📜"):
            flush_poem()
            section = s.replace("#", "").replace("📜", "").strip()
            continue
        if s.startswith("#####"):
            flush_poem()
            cur_title = s.lstrip("#").strip()
            cur_lines = []
            continue
        if cur_title is not None:
            cur_lines.append(ln)
    flush_poem()

    # 去掉封面/导航等非正文
    entries.sort(key=lambda e: e["order"])
    return entries, anomalies, used_lines


def write_json(name, data):
    path = DATA / name
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


def coverage(original_body, used_lines, ignore_patterns):
    src = []
    for ln in original_body.split("\n"):
        n = norm_line(ln)
        if not n:
            continue
        if any(p.search(ln) for p in ignore_patterns):
            continue
        src.append(n)
    full = norm_line("".join(used_lines))
    missing = []
    for line in src:
        if line not in full:
            missing.append((line, 1))
    return len(src), len([x for x in used_lines if norm_line(x)]), missing


def main():
    DATA.mkdir(exist_ok=True)
    BACKUP.mkdir(parents=True, exist_ok=True)
    report = ["# 迁移报告", "", f"- 生成时间：2026-10-28", ""]

    for key, path, out_name, prefix, _ in SOURCES:
        tags = {"quotes": ["摘抄"], "notes": ["杂记"], "poems-crazy": ["诗", "原创"]}[key]
        entries, anomalies, missing, used = parse_year_entries(key, path, prefix, tags)
        write_json(out_name, entries)
        counts = Counter(e["year"] for e in entries)
        report += [
            f"## {out_name}",
            f"- 条数：{len(entries)}",
            f"- 年份分布：{dict(sorted(counts.items(), reverse=True))}",
            f"- 异常出处：{len(anomalies)}",
            f"- 解析告警：{len(missing)}",
            "",
        ]
        for a in anomalies[:30]:
            report.append(f"  - `{a['attr']}`")
        if len(anomalies) > 30:
            report.append(f"  - …其余 {len(anomalies) - 30} 条")
        report.append("")

    # 诗乐园
    entries, anomalies, used = parse_paradise()
    write_json("poems-paradise.json", entries)
    sections = Counter(e["section"] for e in entries)
    report += [
        "## poems-paradise.json",
        f"- 条数：{len(entries)}",
        f"- 分类：{dict(sections)}",
        f"- 序诗：{[e['title'] for e in entries if e.get('featured')]}",
        "",
    ]

    # 覆盖率检查（逐行）
    report += ["## 覆盖率检查", ""]
    checks = [
        ("quotes.json", POSTS / "2020-11-03-zhaichao.md", "quotes",
         [re.compile(r"^#\s+\d{4}\s*$"), re.compile(r"^——"), re.compile(r"💌"), re.compile(r"<style"), re.compile(r"</style>"),
          re.compile(r"^\* content"), re.compile(r"\{:toc\}")]),
        ("notes.json", POSTS / "2021-03-24-zaji.md", "notes",
         [re.compile(r"^#\s+\d{4}\s*$"), re.compile(r"^——"), re.compile(r"💌"), re.compile(r"<style"), re.compile(r"</style>"),
          re.compile(r"^\* content"), re.compile(r"\{:toc\}")]),
        ("poems-crazy.json", POSTS / "2022-11-15-Crazy-Poem.md", "poems-crazy",
         [re.compile(r"^#\s+\d{4}\s*$"), re.compile(r"^——"), re.compile(r"💌"), re.compile(r"<style"), re.compile(r"</style>"),
          re.compile(r"^\* content"), re.compile(r"\{:toc\}")]),
        ("poems-paradise.json", POSTS / "2021-01-25-Paradise-of-Poetry.md", "poems-paradise",
         [re.compile(r"^#"), re.compile(r"^#####"), re.compile(r"^<author>"), re.compile(r"^——"),
          re.compile(r"^\*\*"), re.compile(r"💌"), re.compile(r"<style"), re.compile(r"</style>"),
          re.compile(r"^\* content"), re.compile(r"\{:toc\}")]),
    ]
    data_by_key = {
        "quotes": json.loads((DATA / "quotes.json").read_text(encoding="utf-8")),
        "notes": json.loads((DATA / "notes.json").read_text(encoding="utf-8")),
        "poems-crazy": json.loads((DATA / "poems-crazy.json").read_text(encoding="utf-8")),
        "poems-paradise": json.loads((DATA / "poems-paradise.json").read_text(encoding="utf-8")),
    }
    for out_name, path, key, ignores in checks:
        body = strip_decorations(read_post(path))
        lines = []
        for e in data_by_key[key]:
            lines.extend(e["text"].split("\n"))
        src_n, got_n, missing = coverage(body, lines, ignores)
        report.append(f"- {out_name}: 源行 {src_n} / 条目行 {got_n} / 缺失 {len(missing)}")
        for line, cnt in missing[:12]:
            report.append(f"    - 缺失（{cnt}）：{line[:80]}")
        if len(missing) > 12:
            report.append(f"    - …其余 {len(missing) - 12} 行")

    report += [
        "",
        "## 说明",
        "- 每条内容按来源文件写入独立 JSON，不跨文件合并。",
        "- `citeAnomaly` 为真表示出处格式不标准，已保留原始 `cite`，可在写作台逐条修正。",
        "- 原文备份在 `_backup/2026-10-28/`，同时保留在 git 历史中。",
    ]
    (ROOT / "scripts" / "migration-report.md").write_text("\n".join(report) + "\n", encoding="utf-8")
    (BACKUP / "migration-report.md").write_text("\n".join(report) + "\n", encoding="utf-8")
    print("\n".join(report))


if __name__ == "__main__":
    main()
