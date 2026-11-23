"""Verify VERA 2.4 APK identity, signature, alignment and packaged source assets."""
import argparse
import hashlib
import os
from pathlib import Path
import re
import subprocess
from zipfile import ZipFile

PACKAGE = "app.vera.coach.visionbeta"
VERSION_NAME = "2.4.5 beta"
VERSION_CODE = 245
FORBIDDEN_ASSET_SUFFIXES = (".gguf", ".onnx", ".tflite", ".safetensors", ".wasm", ".traineddata", ".traineddata.gz", ".pt", ".pth", ".p12", ".jks", ".keystore")
FORBIDDEN_ASSET_NAMES = {"local.js", "local-ai.js", "ort.js", "ocr.js", "ocr-worker.js", "ocr-core.js", "vision-labels.json", "eng.traineddata.gz"}


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def native(tools, name):
    return tools / (name + (".exe" if os.name == "nt" else ""))


def require_cloud_assets(names):
    for name in names:
        normalized = str(name).replace("\\", "/").lower()
        basename = normalized.rsplit("/", 1)[-1]
        require(not normalized.endswith(FORBIDDEN_ASSET_SUFFIXES) and basename not in FORBIDDEN_ASSET_NAMES,
                "VERA V2 is cloud-only: forbidden local AI asset or private signing material: " + str(name))


def verify(apk, www, tools, java="java", mode="signed", expected_cert=None):
    subprocess.run([str(native(tools, "zipalign")), "-c", "-P", "16", "4", str(apk)], check=True)
    manifest = subprocess.check_output([str(native(tools, "aapt2")), "dump", "badging", str(apk)], text=True, encoding="utf-8")
    identity = manifest.splitlines()[0]
    print(identity, flush=True)
    require(f"versionName='{VERSION_NAME}'" in identity, "Unexpected APK versionName")
    require(f"name='{PACKAGE}'" in identity and f"versionCode='{VERSION_CODE}'" in identity, "Unexpected APK package/versionCode")
    require("application-label:'Vera 2.4.5 beta'" in manifest, "The Android launcher/install label is stale")
    signer = [str(java), "-jar", str(tools / "lib/apksigner.jar"), "verify", "--verbose", "--print-certs", str(apk)]
    result = subprocess.run(signer, text=True, capture_output=True, encoding="utf-8")
    cert = None
    if mode == "signed":
        require(result.returncode == 0, "APK signature did not verify: " + result.stderr)
        require(re.fullmatch(r"[a-fA-F0-9]{64}", expected_cert or "") is not None, "A certificate SHA-256 must be supplied")
        matches = re.findall(r"Signer #\d+ certificate SHA-256 digest: ([a-fA-F0-9]{64})", result.stdout)
        require(len(matches) == 1 and matches[0].lower() == expected_cert.lower(), "APK certificate differs from the explicitly selected release certificate")
        cert = matches[0].lower()
        print(result.stdout, flush=True)
    else:
        require(result.returncode != 0 and "DOES NOT VERIFY" in result.stderr, "Expected an unsigned APK, got an unexpected verification result")
    with ZipFile(apk) as package:
        require_cloud_assets(package.namelist())
        require(package.testzip() is None, "ZIP CRC validation failed")
        dex = package.read("classes.dex")
        require(dex.startswith(b"dex\n"), "Missing/invalid executable DEX")
        require(b"android/speech/" not in dex and b"android.speech." not in dex,
                "Native speech inference must not be packaged in the cloud-only APK")
        source_files = [p for p in sorted(www.rglob("*")) if p.is_file() and not any(part.startswith(".") for part in p.relative_to(www).parts)]
        expected_assets = set()
        for path in source_files:
            member = "assets/" + path.relative_to(www).as_posix()
            expected_assets.add(member)
            with package.open(member) as actual:
                require(digest(path) == hashlib.file_digest(actual, "sha256").hexdigest(), "Packaged resource differs from source: " + member)
        actual_assets = {p.filename for p in package.infolist() if p.filename.startswith("assets/") and not p.is_dir()}
        require(actual_assets == expected_assets, "APK contains stale or missing web assets")
    report = {"package": PACKAGE, "versionName": VERSION_NAME, "versionCode": VERSION_CODE,
              "signature": mode, "certificateSHA256": cert, "apkBytes": apk.stat().st_size,
              "apkSHA256": digest(apk), "verifiedAssets": len(source_files), "cloudOnlyAssetsVerified": True}
    print("SHA-256", report["apkSHA256"], flush=True)
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("apk", type=Path)
    parser.add_argument("www", type=Path)
    parser.add_argument("tools", type=Path)
    parser.add_argument("--mode", choices=["signed", "unsigned"], default="signed")
    parser.add_argument("--java", default=os.environ.get("JAVA", "java"))
    parser.add_argument("--expected-cert-sha256", default=os.environ.get("VERA_EXPECTED_CERT_SHA256"))
    args = parser.parse_args()
    verify(args.apk.resolve(), args.www.resolve(), args.tools.resolve(), args.java, args.mode, args.expected_cert_sha256)
