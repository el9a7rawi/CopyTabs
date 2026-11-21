#!/usr/bin/env python3
"""Locale validator — key parity, plural categories, placeholders, registry consistency.

Usage:
    python tools/check_locales.py

Exit code is non-zero on any problem (CI-friendly). tools/build.py runs the same
checks before packaging, so a broken dictionary can never reach a store ZIP.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LOCALES_DIR = ROOT / "locales"
CATEGORY_SET = {"zero", "one", "two", "few", "many", "other"}

# Categories Intl.PluralRules yields for the counts this UI shows (integers >= 1).
PLURAL_CATEGORIES = {
    "ar": ["zero", "one", "two", "few", "many", "other"],
    "ru": ["one", "few", "many", "other"],
    "zh-CN": ["other"],
}
DEFAULT_CATEGORIES = ["one", "other"]


def flatten(source, prefix=""):
    out = {}
    for key, value in source.items():
        name = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            out.update(flatten(value, name))
        else:
            out[name] = value
    return out


def placeholders(text):
    return set(re.findall(r"\{(\w+)\}", text))


def is_plural_key(key):
    return key.rsplit(".", 1)[-1] in CATEGORY_SET


def base_keys(keys):
    return {key.rsplit(".", 1)[0] if is_plural_key(key) else key for key in keys}


def registry_codes():
    text = (ROOT / "i18n.js").read_text(encoding="utf-8")
    block = text.split("export const LOCALES = [", 1)[1].split("];", 1)[0]
    return re.findall(r"code:\s*'([^']+)'", block)


def load_locale(path, errors):
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        errors.append(f"{path.name}: not valid JSON ({e})")
        return None
    if not isinstance(data, dict):
        errors.append(f"{path.name}: must contain a JSON object")
        return None
    return flatten(data)


def validate(root=ROOT):
    """Return a list of human-readable problems; empty means the bundle is shippable."""
    errors = []
    locales_dir = root / "locales"
    en_path = locales_dir / "en.json"
    if not en_path.is_file():
        return ["locales/en.json is missing: it is the fallback dictionary"]

    en = load_locale(en_path, errors)
    if en is None:
        return errors

    files = sorted(p.stem for p in locales_dir.glob("*.json"))
    registry = registry_codes()
    if sorted(registry) != files:
        errors.append(
            f"i18n.js registry {sorted(registry)} does not match locales/ {files}"
        )

    plural_bases = sorted(
        {key.rsplit(".", 1)[0] for key in en if is_plural_key(key)}
    )
    en_placeholders = {key: placeholders(value) for key, value in en.items()}

    for code in files:
        if code == "en":
            continue
        data = load_locale(locales_dir / f"{code}.json", errors)
        if data is None:
            continue

        missing = sorted(base_keys(en) - base_keys(data))
        extra = sorted(base_keys(data) - base_keys(en))
        if missing:
            errors.append(f"{code}.json: missing keys {missing}")
        if extra:
            errors.append(f"{code}.json: unknown keys {extra}")

        for key, value in data.items():
            if not isinstance(value, str) or not value.strip():
                errors.append(f"{code}.json: empty or non-string value for {key}")
                continue
            base = key.rsplit(".", 1)[0] if is_plural_key(key) else key
            if base not in base_keys(en):
                continue
            if is_plural_key(key):
                allowed = set().union(
                    *(en_placeholders[f"{base}.{c}"] for c in CATEGORY_SET if f"{base}.{c}" in en)
                )
                if placeholders(value) - allowed:
                    errors.append(
                        f"{code}.json: unexpected placeholders in {key}: "
                        f"{sorted(placeholders(value) - allowed)}"
                    )
            elif placeholders(value) != en_placeholders[key]:
                errors.append(
                    f"{code}.json: placeholders for {key} are {sorted(placeholders(value))}, "
                    f"expected {sorted(en_placeholders[key])}"
                )

        required = PLURAL_CATEGORIES.get(code, DEFAULT_CATEGORIES)
        for base in plural_bases:
            for category in required:
                if f"{base}.{category}" not in data:
                    errors.append(f"{code}.json: missing plural form {base}.{category}")
            if "n" in en_placeholders.get(f"{base}.other", set()) and "{" not in data.get(f"{base}.other", ""):
                errors.append(f"{code}.json: plural form {base}.other must keep the {{n}} placeholder")

    return errors


def main():
    errors = validate(ROOT)
    if errors:
        print("LOCALES FAILED:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        sys.exit(1)
    count = len(list(LOCALES_DIR.glob("*.json")))
    print(f"locales OK ({count} locales)")


if __name__ == "__main__":
    main()
