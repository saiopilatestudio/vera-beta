"""Compile the actual native sources against API 35 and test the origin gate on JVM.

This checks Java/API compatibility and authorization logic. It does not replace
device tests for biometrics, camera, WebView permissions or Health Connect.
"""
import argparse
from pathlib import Path
import subprocess
import shutil
from tempfile import gettempdir
from uuid import uuid4

parser = argparse.ArgumentParser()
parser.add_argument("--java", required=True, type=Path)
parser.add_argument("--ecj", required=True, type=Path)
parser.add_argument("--android-jar", required=True, type=Path)
parser.add_argument("--work-dir", type=Path, help="Writable temporary directory (for sandboxed runs)")
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent

workspace = Path(args.work_dir or gettempdir()).resolve()
tmp = workspace / ("vera-android-audit-" + uuid4().hex)
tmp.mkdir()
try:
    native = tmp / "native"
    unit = tmp / "unit"
    native.mkdir()
    unit.mkdir()
    common = [str(args.java), "-jar", str(args.ecj), "-nowarn", "-encoding", "UTF-8", "-source", "1.8", "-target", "1.8"]
    subprocess.run(common + ["-classpath", str(args.android_jar), "-d", str(native)] +
                   [str(p) for p in sorted((root / "beta-android").glob("*.java"))], check=True)
    subprocess.run(common + ["-d", str(unit), str(root / "beta-android/OriginPolicy.java"),
                            str(root / "tests/audit-android-origin.java")], check=True)
    subprocess.run([str(args.java), "-cp", str(unit), "app.vera.coach.visionbeta.AndroidOriginAudit"], check=True)
    subprocess.run(common + ["-d", str(unit), str(root / "beta-android/AssetMime.java"), str(root / "tests/audit-android-mime.java")], check=True)
    subprocess.run([str(args.java), "-cp", str(unit), "app.vera.coach.visionbeta.AndroidMimeAudit"], check=True)
    print("PASS: all beta-android Java sources compile against the supplied Android SDK.")
finally:
    if tmp.resolve().parent != workspace:
        raise RuntimeError("Refusing cleanup outside the requested temporary workspace")
    shutil.rmtree(tmp)
