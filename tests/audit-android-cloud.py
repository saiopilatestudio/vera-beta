"""Regression checks for the V2 cloud-only APK packaging policy."""
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("vera_verify_apk", ROOT / "tests/verify_apk.py")
verifier = importlib.util.module_from_spec(spec)
spec.loader.exec_module(verifier)


class CloudOnlyAndroid(unittest.TestCase):
    def test_local_models_runtimes_and_signing_files_are_rejected(self):
        for name in ("assets/coach.gguf", "assets/FOOD.ONNX", "assets/nested/model.tflite", "assets/model.safetensors",
                     "assets/ort-wasm-simd.wasm", "assets/eng.traineddata.gz", "assets/ocr.js", "assets/local.js",
                     "assets/ocr-worker.js", "assets/vision-labels.json", "assets/secret.p12", "assets/model.pt"):
            with self.subTest(name=name), self.assertRaises(RuntimeError):
                verifier.require_cloud_assets([name])

    def test_ordinary_web_resources_are_allowed(self):
        verifier.require_cloud_assets(["assets/index.html", "assets/brand.png", "assets/exercises.json", "assets/qr.js", "classes.dex"])

    def test_native_has_no_speech_inference_bridge(self):
        java = (ROOT / "beta-android/Main.java").read_text(encoding="utf-8")
        manifest = (ROOT / "beta-android/AndroidManifest.xml").read_text(encoding="utf-8")
        for forbidden in ("android.speech", "TextToSpeech", "RecognizerIntent", "public void dictate", "public void say", "public void chooseVoice"):
            self.assertNotIn(forbidden, java)
        self.assertNotIn("TTS_SERVICE", manifest)
        self.assertIn("RESOURCE_AUDIO_CAPTURE", java)

    def test_actual_assets_have_no_local_model_runtime(self):
        verifier.require_cloud_assets(p.relative_to(ROOT / "www").as_posix() for p in (ROOT / "www").rglob("*") if p.is_file())


if __name__ == "__main__":
    unittest.main()
