#!/usr/bin/env python3
"""CopyTabs release builder — validates the manifest and produces per-browser ZIPs.

Usage:
    python tools/build.py [--out dist]

Output (in <out>/):
    copytabs-chrome-vX.Y.Z.zip    <- Chromium build (no `background.scripts`: zero Chrome warnings)
    copytabs-edge-vX.Y.Z.zip      <- Edge (same Chromium manifest, own file name)
    copytabs-brave-vX.Y.Z.zip     <- Brave (same Chromium manifest, own file name)
    copytabs-opera-vX.Y.Z.zip     <- Opera (same Chromium manifest, own file name)
    copytabs-firefox-vX.Y.Z.zip   <- Firefox (adds `background.scripts`: required, no service_worker support)
    SHA256SUMS.txt                <- checksums for every artifact

One codebase, one source manifest.json, Chrome-clean out of the box — the
`background.scripts` key never appears in the source (Chrome 121+ records it as
a manifest error on every reload of the source folder). The Firefox ZIP adds
the key back, since Firefox does not support `service_worker`.
Chrome ignores `browser_specific_settings`; Firefox uses `background.scripts`.
Exit code is non-zero on any validation failure (CI-friendly).
"""
import copy
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
# ship the source manifest as-is (no `scripts` key); the Firefox ZIP gets
# `background.scripts` added (its manifest section carries the Gecko settings).
BROWSERS = ["chrome", "edge", "brave", "opera", "firefox"]
CHROMIUM_BROWSERS = ["chrome", "edge", "brave", "opera"]


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
    if "service_worker" not in bg:
        fail("background must define service_worker")
    if "scripts" in bg:
        fail("source manifest must NOT contain background.scripts: Chrome records it as a manifest error on reload")
    gecko = manifest.get("browser_specific_settings", {}).get("gecko", {})
    if not gecko.get("id"):
        fail("browser_specific_settings.gecko.id is required for Firefox signing")
    for rel in PACKAGE_FILES:
        if not (ROOT / rel).is_file():
            fail(f"packaged file is missing: {rel}")
    # Guard: every emitted manifest variant must stay valid for its browser.
    for browser in BROWSERS:
        bg = manifest_for(browser, manifest)["background"]
        if browser in CHROMIUM_BROWSERS:
            if "scripts" in bg or "service_worker" not in bg:
                fail(f"chromium manifest variant is wrong for {browser}")
        elif "scripts" not in bg or "service_worker" not in bg:
            fail("firefox manifest variant must have background.scripts + service_worker")
    print(f"manifest OK (v{version})")
    return manifest, version


def manifest_for(browser, base):
    """Per-browser manifest derived from the single source manifest."""
    manifest = copy.deepcopy(base)
    if browser not in CHROMIUM_BROWSERS:
        background = manifest["background"]
        manifest["background"] = {"scripts": [background["service_worker"]], **background}
    return manifest


def build_zip(out_dir, browser, base_manifest, version):
    name = f"copytabs-{browser}-v{version}.zip"
    path = out_dir / name
    manifest_bytes = json.dumps(
        manifest_for(browser, base_manifest), indent=2, ensure_ascii=False
    ).encode("utf-8")
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for rel in PACKAGE_FILES:
            if rel == "manifest.json":
                zf.writestr(rel, manifest_bytes)
            else:
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
    base_manifest, version = validate_manifest()
    artifacts = [build_zip(out_dir, browser, base_manifest, version) for browser in BROWSERS]
    write_checksums(out_dir, artifacts)
    print("BUILD OK")


if __name__ == "__main__":
    main()
