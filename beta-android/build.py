"""Portable VERA Android builder. Defaults to unsigned; never creates signing keys.

Requires API 35 android.jar, Build Tools 35, Java 17 and ECJ 3.38.0.
Signing password is supplied only via BETA_PASS environment variable.
"""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
from uuid import uuid4
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent.parent


def run(*args):
    subprocess.run([str(arg) for arg in args], check=True)


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--java", default=os.environ.get("JAVA", "java"))
    parser.add_argument("--ecj", required=True, type=Path)
    parser.add_argument("--android-jar", required=True, type=Path)
    parser.add_argument("--build-tools", required=True, type=Path)
    parser.add_argument("--work-dir", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--mode", choices=["unsigned", "signed"], default="unsigned")
    parser.add_argument("--keystore", type=Path)
    parser.add_argument("--key-alias")
    parser.add_argument("--expected-cert-sha256", default=os.environ.get("VERA_EXPECTED_CERT_SHA256"))
    args = parser.parse_args()
    if args.mode == "signed" and (not args.keystore or not os.environ.get("BETA_PASS") or not args.expected_cert_sha256):
        parser.error("signed requires --keystore, BETA_PASS and --expected-cert-sha256; no key will be generated")
    tool_dir = args.build_tools.resolve()
    extension = ".exe" if os.name == "nt" else ""
    aapt = tool_dir / ("aapt2" + extension)
    align = tool_dir / ("zipalign" + extension)
    args.ecj = args.ecj.resolve()
    args.android_jar = args.android_jar.resolve()
    source_manifest = ROOT / "beta-android/AndroidManifest.xml"
    manifest_digest = digest(source_manifest)
    www = ROOT / "www"
    spec = importlib.util.spec_from_file_location("vera_verify_apk", ROOT / "tests/verify_apk.py")
    verifier = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(verifier)
    verifier.require_cloud_assets(p.relative_to(www).as_posix() for p in www.rglob("*") if p.is_file())
    source_digests = {str(p.relative_to(ROOT)): digest(p) for folder in (www, ROOT / "beta-android")
                      for p in sorted(folder.rglob("*")) if p.is_file() and not any(part.startswith(".") or part == "__pycache__" for part in p.relative_to(ROOT).parts)}
    workspace = args.work_dir.resolve()
    workspace.mkdir(parents=True, exist_ok=True)
    staging = workspace / ("build-" + uuid4().hex)
    staging.mkdir()
    try:
        classes, dex, tests = staging / "classes", staging / "dex", staging / "tests"
        for directory in (classes, dex, tests):
            directory.mkdir()
        ecj = [args.java, "-jar", args.ecj, "-nowarn", "-encoding", "UTF-8", "-source", "1.8", "-target", "1.8"]
        run(*ecj, "-classpath", args.android_jar, "-d", classes, *sorted((ROOT / "beta-android").glob("*.java")))
        run(*ecj, "-d", tests, ROOT / "beta-android/OriginPolicy.java", ROOT / "tests/audit-android-origin.java")
        run(args.java, "-cp", tests, "app.vera.coach.visionbeta.AndroidOriginAudit")
        jar = staging / "classes.jar"
        with ZipFile(jar, "w", ZIP_DEFLATED) as z:
            for p in sorted(classes.rglob("*.class")):
                z.write(p, p.relative_to(classes).as_posix())
        run(args.java, "-cp", tool_dir / "lib/d8.jar", "com.android.tools.r8.D8", "--lib", args.android_jar,
            "--min-api", "26", "--output", dex, jar)
        resources, base, aligned = staging / "res.zip", staging / "base.apk", staging / "aligned.apk"
        run(aapt, "compile", "--dir", ROOT / "beta-android/res", "-o", resources)
        run(aapt, "link", resources, "-o", base, "--manifest", source_manifest,
            "-I", args.android_jar, "-A", www)
        with ZipFile(base, "a", ZIP_DEFLATED) as z:
            for p in sorted(dex.glob("*.dex")):
                z.write(p, p.name)
        run(align, "-f", "-P", "16", "4", base, aligned)
        artifact = aligned
        if args.mode == "signed":
            artifact = staging / "signed.apk"
            cmd = [args.java, "-jar", tool_dir / "lib/apksigner.jar", "sign", "--ks", args.keystore.resolve(),
                   "--ks-pass", "env:BETA_PASS", "--out", artifact]
            if args.key_alias:
                cmd += ["--ks-key-alias", args.key_alias]
            run(*cmd, aligned)
        report = verifier.verify(artifact, www, tool_dir, args.java, args.mode, args.expected_cert_sha256)
        # Refuse a release if source changed while packaging it.
        for relative, expected in source_digests.items():
            if digest(ROOT / relative) != expected:
                raise RuntimeError("Source changed during the build: " + relative)
        if digest(source_manifest) != manifest_digest:
            raise RuntimeError("Manifest changed during the build")
        output = args.output.resolve()
        output.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(artifact, output)
        report["sourceSHA256"] = source_digests
        report["nativeRuntimeTesting"] = "not performed"
        report["serverSupportedProviders"] = ["groq", "gemini", "cloudflare"]
        report["toolVersions"] = {"androidAPI": 35, "buildTools": "35.0.0", "ECJ": "3.38.0"}
        output.with_suffix(output.suffix + ".build.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
        print("BUILT", output, flush=True)
    except BaseException:
        print("Build failed; diagnostic intermediates retained at", staging, flush=True)
        raise
    else:
        if staging.resolve().parent != workspace:
            raise RuntimeError("Refusing cleanup outside the build workspace")
        shutil.rmtree(staging)


if __name__ == "__main__":
    main()
