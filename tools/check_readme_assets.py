#!/usr/bin/env python3
"""README asset guard — every local image a README points at must be in the repo.

Usage:
    python tools/check_readme_assets.py

Exit code is non-zero on any missing file (CI-friendly), so a renamed
screenshot or cover banner breaks the build instead of the GitHub page.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REF_PATTERN = re.compile(r"(?:assets|icons)/[A-Za-z0-9_./-]+\.(?:png|webp|svg)")


def refs(readme):
    return sorted(set(REF_PATTERN.findall(readme.read_text(encoding="utf-8"))))


def main():
    found = {readme.name: refs(readme) for readme in sorted(ROOT.glob("README*.md"))}
    missing = [
        f"{name}: {ref}"
        for name, items in found.items()
        for ref in items
        if not (ROOT / ref).is_file()
    ]
    if missing:
        print("README ASSETS FAILED:", file=sys.stderr)
        for item in missing:
            print(f"  - {item}", file=sys.stderr)
        sys.exit(1)
    total = sum(len(items) for items in found.values())
    print(f"README assets OK ({total} refs across {len(found)} READMEs)")


if __name__ == "__main__":
    main()
