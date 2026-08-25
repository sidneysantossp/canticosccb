"""Apply stanza/chorus boundaries to existing Hinário lyrics.

The reference pages are used only to obtain structural metadata (verse line
counts and chorus position). The lyric text written back to Supabase always
comes from the project's existing ``hinario.conteudo`` rows.

Dry run:
    python scripts/apply_hinario_stanza_structure.py

This script is intentionally read-only. It reports structural matches without
changing the source text stored in Supabase.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from difflib import SequenceMatcher
import html
import re
import time
import unicodedata
import urllib.parse
import urllib.request
from dataclasses import dataclass
from html.parser import HTMLParser

from import_hinario_violao import api_request, load_env


CATALOG_URL = "https://www.ccbcifras.com/albuns/ccb"
BASE_URL = "https://www.ccbcifras.com"
USER_AGENT = "CanticosCCB-structure-validator/1.0"


@dataclass(frozen=True)
class Section:
    kind: str
    number: int | None
    line_count: int
    lines: tuple[str, ...]


class CifraPreParser(HTMLParser):
    """Extract visible lyric layout while discarding chord spans."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.in_pre = False
        self.pre_depth = 0
        self.skip_chord_depth = 0
        self.in_chorus = False
        self.parts: list[str] = []

    @staticmethod
    def _classes(attrs: list[tuple[str, str | None]]) -> set[str]:
        value = next((value or "" for key, value in attrs if key == "class"), "")
        return set(value.split())

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        classes = self._classes(attrs)
        if tag == "pre" and not self.in_pre:
            self.in_pre = True
            self.pre_depth = 1
            return
        if not self.in_pre:
            return
        self.pre_depth += 1
        if "chord-box" in classes:
            self.skip_chord_depth = self.pre_depth
        elif "blank-line" in classes:
            self.parts.append("\n\n")
        elif tag == "strong" and "coro" in classes:
            self.in_chorus = True
            self.parts.append("\nCORO:\n")

    def handle_endtag(self, tag: str) -> None:
        if not self.in_pre:
            return
        if self.skip_chord_depth == self.pre_depth:
            self.skip_chord_depth = 0
        if tag == "strong" and self.in_chorus:
            self.in_chorus = False
            self.parts.append("\n\n")
        self.pre_depth -= 1
        if tag == "pre" and self.pre_depth == 0:
            self.in_pre = False

    def handle_data(self, data: str) -> None:
        if self.in_pre and not self.skip_chord_depth:
            self.parts.append(data)

    def text(self) -> str:
        return html.unescape("".join(self.parts))


def fetch_text(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=45) as response:
        return response.read().decode("utf-8", errors="replace")


def catalog_links() -> list[str]:
    page = fetch_text(CATALOG_URL)
    links = {
        match.group(1).rstrip("/")
        for match in re.finditer(r'href=["\'](/albuns/ccb/[^"\'?#]+)', page)
    }
    return sorted(links)


def clean_reference_line(line: str) -> str:
    line = line.replace("_", " ")
    line = re.sub(r"\s+", " ", line).strip()
    return line


def reference_structure(page: str) -> tuple[int, list[Section]]:
    number_match = re.search(r"<title>\s*Cifra do Hino\s+(\d+)\b", page, re.I)
    if not number_match:
        raise ValueError("Número do hino não encontrado na referência")
    number = int(number_match.group(1))

    parser = CifraPreParser()
    parser.feed(page)
    lines = [clean_reference_line(line) for line in parser.text().splitlines()]

    sections: list[Section] = []
    current_kind = "verse"
    current_number: int | None = None
    current_lines: list[str] = []

    def flush() -> None:
        nonlocal current_lines, current_kind, current_number
        if not current_lines:
            return
        sections.append(Section(current_kind, current_number, len(current_lines), tuple(current_lines)))
        current_lines = []
        current_kind = "verse"
        current_number = None

    for line in lines:
        if not line:
            flush()
            continue
        if re.fullmatch(r"CORO\s*:", line, re.I):
            flush()
            current_kind = "chorus"
            continue
        verse_match = re.match(r"^(\d+)\s*[.)-]\s*(.*)$", line)
        if verse_match:
            flush()
            current_kind = "verse"
            current_number = int(verse_match.group(1))
            if verse_match.group(2).strip():
                current_lines.append(verse_match.group(2).strip())
            continue
        current_lines.append(line)
    flush()
    return number, sections


def expand_parallel_columns(lines: list[str]) -> list[str]:
    expanded: list[str] = []
    index = 0
    while index < len(lines):
        if "\t" not in lines[index]:
            expanded.append(lines[index])
            index += 1
            continue
        group: list[str] = []
        while index < len(lines) and "\t" in lines[index]:
            group.append(lines[index])
            index += 1
        if len(group) == 1:
            left, right = group[0].split("\t", 1)
            if re.fullmatch(r"(?:CORO|REFR[AÃ]O)\s*:", left.strip(), re.I):
                expanded.append(f"{left.strip()} {right.strip()}")
            else:
                expanded.append(f"{left}{right}".strip())
            continue
        left_column: list[str] = []
        right_column: list[str] = []
        for row in group:
            left, right = row.split("\t", 1)
            if left.strip():
                left_column.append(left.strip())
            if right.strip():
                right_column.append(right.strip())
        expanded.extend(left_column)
        expanded.extend(right_column)
    return expanded


def existing_lyric_lines(content: str, hymn_number: int) -> list[str]:
    raw_lines = [line.strip() for line in content.splitlines() if line.strip()]
    lines = expand_parallel_columns(raw_lines)
    cleaned: list[str] = []
    for index, line in enumerate(lines):
        line = re.sub(r"^(?:CORO|REFR[AÃ]O)\s*:\s*", "", line, flags=re.I).strip()
        title_match = re.match(rf"^{hymn_number}\s*[.)-]\s*(.+)$", line)
        if index == 0 and title_match:
            continue
        words = re.findall(r"[A-Za-zÀ-ÿ�]+", line)
        has_lyric_word = any(
            len(word) >= 2 and re.search(r"[a-zà-ÿ�]", word) and not re.fullmatch(
                r"[A-G](?:#|b)?(?:m|maj|min|sus|add|dim|aug|°|º)?\d?(?:/[A-G](?:#|b)?)?",
                word,
                re.I,
            )
            for word in words
        )
        if line and has_lyric_word:
            cleaned.append(line)
    return cleaned


def format_existing_lyrics(lines: list[str], sections: list[Section]) -> str | None:
    expected = sum(section.line_count for section in sections)
    if expected != len(lines):
        return None
    blocks: list[str] = []
    cursor = 0
    for section in sections:
        block_lines = lines[cursor:cursor + section.line_count]
        cursor += section.line_count
        if section.kind == "chorus" and block_lines:
            block_lines[0] = f"CORO: {block_lines[0]}"
        blocks.append("\n".join(block_lines))
    return "\n\n".join(blocks)


def comparable_text(value: str) -> str:
    value = value.replace("�", "")
    value = unicodedata.normalize("NFD", value)
    value = "".join(char for char in value if unicodedata.category(char) != "Mn")
    value = re.sub(r"[^a-z0-9]+", " ", value.lower())
    return re.sub(r"\s+", " ", value).strip()


def format_existing_lyrics_fuzzy(
    lines: list[str], sections: list[Section], minimum_score: float = 0.42
) -> tuple[str | None, float]:
    """Partition local lines into reference sections without copying reference text."""
    line_count = len(lines)
    section_count = len(sections)
    if not lines or not sections or line_count < section_count:
        return None, 0.0

    references = [comparable_text(" ".join(section.lines)) for section in sections]
    scores: dict[tuple[int, int, int], float] = {}

    def segment_score(section_index: int, start: int, end: int) -> float:
        key = (section_index, start, end)
        if key not in scores:
            local = comparable_text(" ".join(lines[start:end]))
            scores[key] = SequenceMatcher(None, local, references[section_index]).ratio()
        return scores[key]

    negative = -10_000.0
    best = [[negative] * (line_count + 1) for _ in range(section_count + 1)]
    previous = [[-1] * (line_count + 1) for _ in range(section_count + 1)]
    best[0][0] = 0.0
    for section_index in range(1, section_count + 1):
        min_end = section_index
        max_end = line_count - (section_count - section_index)
        for end in range(min_end, max_end + 1):
            for start in range(section_index - 1, end):
                if best[section_index - 1][start] == negative:
                    continue
                candidate = best[section_index - 1][start] + segment_score(section_index - 1, start, end)
                if candidate > best[section_index][end]:
                    best[section_index][end] = candidate
                    previous[section_index][end] = start

    average_score = best[section_count][line_count] / section_count
    if average_score < minimum_score:
        return None, average_score

    boundaries: list[tuple[int, int]] = []
    end = line_count
    for section_index in range(section_count, 0, -1):
        start = previous[section_index][end]
        if start < 0:
            return None, average_score
        boundaries.append((start, end))
        end = start
    boundaries.reverse()

    blocks: list[str] = []
    for section, (start, end) in zip(sections, boundaries):
        block_lines = list(lines[start:end])
        if section.kind == "chorus" and block_lines:
            block_lines[0] = f"CORO: {block_lines[0]}"
        blocks.append("\n".join(block_lines))
    return "\n\n".join(blocks), average_score


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--delay", type=float, default=0.0)
    parser.add_argument("--workers", type=int, default=6)
    args = parser.parse_args()

    env = load_env()
    supabase_url = env["VITE_SUPABASE_URL"]
    anon_key = env["VITE_SUPABASE_ANON_KEY"]
    rows = api_request(
        supabase_url,
        anon_key,
        "GET",
        "hinario",
        query={"select": "id,numero,conteudo", "order": "numero.asc", "limit": "520"},
    )
    by_number = {int(row["numero"]): row for row in rows}

    links = catalog_links()
    if len(links) != 480:
        raise ValueError(f"Catálogo de referência incompleto: {len(links)} links")
    if args.limit:
        links = links[:args.limit]

    matched: dict[int, str] = {}
    fuzzy_matched: dict[int, float] = {}
    mismatched: dict[int, tuple[int, int]] = {}
    errors: dict[str, str] = {}
    def load_reference(link: str) -> tuple[str, int, list[Section]]:
        page = fetch_text(urllib.parse.urljoin(BASE_URL, link))
        number, sections = reference_structure(page)
        if args.delay:
            time.sleep(args.delay)
        return link, number, sections

    loaded: list[tuple[str, int, list[Section]]] = []
    with ThreadPoolExecutor(max_workers=max(1, min(args.workers, 8))) as pool:
        futures = {pool.submit(load_reference, link): link for link in links}
        for future in as_completed(futures):
            link = futures[future]
            try:
                loaded.append(future.result())
            except Exception as exc:
                errors[link] = str(exc)

    for link, number, sections in loaded:
        try:
            row = by_number.get(number)
            if not row:
                errors[link] = "Hino ausente no Supabase"
                continue
            lines = existing_lyric_lines(row.get("conteudo") or "", number)
            formatted = format_existing_lyrics(lines, sections)
            if formatted is None:
                formatted, score = format_existing_lyrics_fuzzy(lines, sections)
                if formatted is None:
                    mismatched[number] = (len(lines), sum(item.line_count for item in sections))
                    continue
                fuzzy_matched[number] = round(score, 3)
            matched[number] = formatted
        except Exception as exc:  # continue auditing the remaining catalog
            errors[link] = str(exc)
    print({
        "reference_links": len(links),
        "validated": len(matched),
        "validated_exact": len(matched) - len(fuzzy_matched),
        "validated_fuzzy": len(fuzzy_matched),
        "line_count_mismatches": len(mismatched),
        "errors": len(errors),
        "mode": "read-only-audit",
    })
    if mismatched:
        print({"mismatch_sample": dict(sorted(mismatched.items())[:20])})
    if fuzzy_matched:
        print({"fuzzy_score_range": [min(fuzzy_matched.values()), max(fuzzy_matched.values())]})
    if errors:
        print({"error_sample": dict(list(errors.items())[:10])})

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
