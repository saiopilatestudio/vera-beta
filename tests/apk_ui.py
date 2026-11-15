"""Exercise the shipped Android WebView resources in mobile Chromium."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread
from zipfile import ZipFile
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument("apk", type=Path)
parser.add_argument("chromium", type=Path)
args = parser.parse_args()

with TemporaryDirectory() as folder, ZipFile(args.apk) as archive, sync_playwright() as playwright:
    for entry in archive.namelist():
        if entry.startswith("assets/"):
            archive.extract(entry, folder)
    root = Path(folder) / "assets"
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(SimpleHTTPRequestHandler, directory=str(root)))
    Thread(target=server.serve_forever, daemon=True).start()
    origin = f"http://127.0.0.1:{server.server_port}"
    browser = playwright.chromium.launch(executable_path=str(args.chromium), args=["--no-sandbox","--single-process","--no-zygote","--disable-gpu"])
    page = browser.new_page(viewport={"width":390,"height":844})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.route("**/*", lambda r: r.continue_() if r.request.url.startswith((origin,"data:","blob:")) else r.abort())
    page.goto(origin+"/index.html")
    import re
    local = page.get_by_role("button", name=re.compile("sin cuenta|este dispositivo|modo local|sin conexión|acceso local|sin registro|usar local",re.I))
    assert local.count(), page.locator("body").inner_text()
    local.first.click()
    for area in ["Chat","Alimentación","Suplementación","Entrenamiento","Cardio","Sueño","Equipo","Progreso","Perfil","Plato"]:
        page.evaluate("area=>go(area)",area)
        assert page.locator("#view").inner_text().strip(), area
        assert page.evaluate("tab") == area
    page.evaluate("go('Chat')")
    page.evaluate("ask('Ayer hice press banca 3x10 con 40 kg y anteayer corrí 30 min')")
    assert page.evaluate("s.turns.at(-1).entries.length") == 2
    page.evaluate("acceptEntry(s.turns.length-1,0);acceptEntry(s.turns.length-1,1)")
    page.reload()
    page.evaluate("go('Chat');ask('¿Qué hice ayer?')")
    assert "40 kg" in page.evaluate("s.turns.at(-1).answer")
    assert not errors, errors
    print("PASS: acceso local, diez pantallas, diario multifecha, persistencia y consulta histórica.")
    browser.close()
    server.shutdown()
