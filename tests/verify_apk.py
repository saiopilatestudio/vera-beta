"""Validate signed Android release assets before UI testing."""
import argparse
import hashlib
from pathlib import Path
from subprocess import check_call, check_output, run
from zipfile import ZipFile

parser = argparse.ArgumentParser()
parser.add_argument("apk", type=Path)
parser.add_argument("www", type=Path)
parser.add_argument("tools", type=Path)
parser.add_argument("--mode", choices=["signed","unsigned"], default="signed")
args = parser.parse_args()
check_call([args.tools / "zipalign", "-c", "4", args.apk])
manifest = check_output([args.tools / "aapt2", "dump", "badging", args.apk], text=True)
print(manifest.splitlines()[0])
assert "versionName='1.0.3" in manifest
assert "name='app.vera.coach.visionbeta'" in manifest and "versionCode='13'" in manifest
if args.mode == "signed":
    cert = check_output([args.tools / "apksigner", "verify", "--print-certs", args.apk], text=True)
    assert "e816105533d0800d388a44f802a6b90a74573242eec531ee69eaa73a4a826d71" in cert
else:
    verification = run([args.tools / "apksigner", "verify", args.apk], capture_output=True)
    assert verification.returncode != 0 and b"DOES NOT VERIFY" in verification.stderr, verification.stderr
with ZipFile(args.apk) as package:
    assert package.testzip() is None
    assert package.read("classes.dex").startswith(b"dex\n")
    assert package.getinfo("assets/vision.onnx").file_size == 89117001
    for path in sorted(args.www.rglob("*")):
        if path.is_file() and not path.name.startswith("."):
            member = "assets/" + path.relative_to(args.www).as_posix()
            with path.open("rb") as local, package.open(member) as actual:
                digest = hashlib.file_digest(local, "sha256").hexdigest()
                assert digest == hashlib.file_digest(actual, "sha256").hexdigest(), member
            if path.suffix in {".gguf", ".onnx"}:
                print(member, path.stat().st_size, digest)
    assert package.getinfo("assets/coach.gguf").file_size == 491400032
    assert package.getinfo("assets/food.onnx").file_size == 93297500
with args.apk.open("rb") as apk:
    print("SHA-256", hashlib.file_digest(apk, "sha256").hexdigest())
