"""Run real offline inference using only resources in the compiled APK."""
import argparse
import base64
import json
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread
from zipfile import ZipFile
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument("apk", type=Path)
parser.add_argument("chromium")
parser.add_argument("--food", type=Path, help="Optional reference photo (JPEG)")
args = parser.parse_args()
with TemporaryDirectory() as folder, ZipFile(args.apk) as apk, sync_playwright() as playwright:
    for member in apk.namelist():
        if member.startswith("assets/"):
            apk.extract(member, folder)
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(SimpleHTTPRequestHandler, directory=Path(folder)/"assets"))
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    origin = f"http://127.0.0.1:{server.server_port}"
    browser = playwright.chromium.launch(executable_path=args.chromium, args=["--no-sandbox","--disable-dev-shm-usage","--disable-gpu","--single-process","--no-zygote"])
    try:
        page = browser.new_page()
        page.route("**/*",lambda route: route.continue_() if route.request.url.startswith((origin,"data:","blob:")) else route.abort())
        page.goto(origin+"/index.html")
        if args.food:
            image="data:image/jpeg;base64,"+base64.b64encode(args.food.read_bytes()).decode()
            result=page.evaluate("async src=>(await visualCandidates(src,'food')).slice(0,3)",image)
            print("CLIP",json.dumps(result,ensure_ascii=False),flush=True)
        output = page.evaluate("async ()=>await veraTestAI(()=>{})")
        assert output["answer"].strip(), output
        print("Qwen",json.dumps(output,ensure_ascii=False),flush=True)
    finally:
        browser.close()
        server.shutdown()
