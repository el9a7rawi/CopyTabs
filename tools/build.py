#!/usr/bin/env python3
"""CopyTabs release builder — validates the manifest and produces per-browser ZIPs.

Usage:
    python tools/build.py [--out dist]

Output (in <out>/):
    copytabs-chrome-vX.Y.Z.zip    <- Chrome (Chromium build)
    copytabs-edge-vX.Y.Z.zip      <- Edge (identical Chromium build, own file name)
    copytabs-brave-vX.Y.Z.zip     <- Brave (identical Chromium build, own file name)
    copytabs-opera-vX.Y.Z.zip     <- Opera (identical Chromium build, own file name)
    copytabs-firefox-vX.Y.Z.zip   <- Firefox (same files; manifest carries gecko settings)
    SHA256SUMS.txt                <- checksums for every artifact

Same file set ships to every browser: one codebase, one manifest.json.
Chrome-family browsers share identical content under per-browser file names,
so every browser has its own clearly labeled download in the Release page.
Chrome ignores `browser_specific_settings`; Firefox uses `background.scripts`.
Exit code is non-zero on any validation failure (CI-friendly).
"""
import hashlib
import json
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Files shipped inside every store ZIP (lean + Apache-2.0 compliant).
PACKAGE_FILES = [
    "manifest.json",
    "popup.html",
    "popup.css",
    "popup.js",
    "background.js",
    "options.html",
    "options.js",
    "LICENSE",
    "icons/icon16.png",
    "icons/icon32.png",
    "icons/icon48.png",
    "icons/icon128.png",
]

REQUIRED_MANIFEST_KEYS = [
    "manifest_version", "name", "version", "action", "background",
    "icons", "permissions",
]

# One clearly labeled file per supported browser. Chromium-family browsers
# share byte-identical content; Firefox shares the same file set (its
# manifest section carries the Gecko settings).
BROWSERS = ["chrome", "edge", "brave", "opera", "firefox"]


def fail(msg):
    print(f"BUILD FAILED: {msg}", file=sys.stderr)
    sys.exit(1)


def validate_manifest():
    try:
        manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        fail(f"manifest.json is not valid JSON: {e}")
    for key in REQUIRED_MANIFEST_KEYS:
        if key not in manifest:
            fail(f"manifest.json is missing required key: {key}")
    if manifest.get("manifest_version") != 3:
        fail("manifest_version must be 3")
    version = manifest.get("version", "")
    if not version or len(version.split(".")) != 3:
        fail(f"version must be semver X.Y.Z, got: {version!r}")
    bg = manifest.get("background", {})
    if "service_worker" not in bg or "scripts" not in bg:
        fail("background must define BOTH service_worker (Chrome) and scripts (Firefox)")
    gecko = manifest.get("browser_specific_settings", {}).get("gecko", {})
    if not gecko.get("id"):
        fail("browser_specific_settings.gecko.id is required for Firefox signing")
    for rel in PACKAGE_FILES:
        if not (ROOT / rel).is_file():
            fail(f"packaged file is missing: {rel}")
    print(f"manifest OK (v{version})")
    return version


def build_zip(out_dir, browser, version):
    name = f"copytabs-{browser}-v{version}.zip"
    path = out_dir / name
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for rel in PACKAGE_FILES:
            zf.write(ROOT / rel, rel)
    print(f"built {name} ({path.stat().st_size // 1024} KB)")
    return path


def write_checksums(out_dir, artifacts):
    lines = []
    for path in artifacts:
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        lines.append(f"{digest}  {path.name}")
    (out_dir / "SHA256SUMS.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("wrote SHA256SUMS.txt")


def main():
    out_dir = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else ROOT / "dist"
    out_dir.mkdir(parents=True, exist_ok=True)
    version = validate_manifest()
    artifacts = [build_zip(out_dir, browser, version) for browser in BROWSERS]
    write_checksums(out_dir, artifacts)
    print("BUILD OK")


if __name__ == "__main__":
    main()
