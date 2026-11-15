"""Smoke test with three synthetic users against a temporary Vera HTTP server."""
import json, os, secrets, socket, subprocess, tempfile, time, urllib.request
from urllib.error import HTTPError

with tempfile.TemporaryDirectory() as tmp:
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    url = f'http://127.0.0.1:{port}'
    password = secrets.token_hex(18)
    email = 'owner@example.invalid'
    env = {**os.environ, 'VERA_OWNER_EMAIL':email, 'VERA_OWNER_PASSWORD':password, 'PORT':str(port),
           'HOST':'127.0.0.1', 'VERA_DB':tmp+'/qa.sqlite', 'TURSO_DATABASE_URL':'', 'RENDER':''}
    server = subprocess.Popen(['node','server.mjs'], env=env)
    def post(path, body, headers=None, status=200):
        req = urllib.request.Request(url+path, data=json.dumps(body).encode(),
                                     headers={'Content-Type':'application/json', **(headers or {})})
        try:
            res = urllib.request.urlopen(req)
        except HTTPError as exc:
            res = exc
        data = json.load(res)
        assert res.status == status,(path, res.status, data)
        return data,res.headers
    try:
        for attempt in range(60):
            try:
                urllib.request.urlopen(url+'/health').read()
                break
            except OSError:
                time.sleep(.1)
        assert b'<html' in urllib.request.urlopen(url+'/admin').read()
        post('/admin/summary',{},status=403)
        admin,h = post('/owner-login',{'email':email,'password':password,'mode':'browser'})
        cookie = h['Set-Cookie']
        assert 'HttpOnly' in cookie and 'token' not in admin
        csrf={'Cookie':cookie.split(';')[0],'x-vera-csrf':admin['csrf']}
        post('/admin/summary',{},csrf)
        post('/admin/end',{},csrf)
        post('/admin/summary',{},csrf,status=403)
        accounts=[]
        for name in ['Lima','Bosque','Azul']:
            account,_ = post('/register',{'email':name+'@example.invalid','password':password,'adult':True,'notice':'beta-3'})
            auth={'Authorization':'Bearer '+account['token']}
            post('/nickname',{'nick':name},auth)
            accounts.append(auth)
        a,b,c=accounts
        invite,_=post('/partners/invite',{'nick':'@bosque','title':'Torso','plan':['Remo'],'target':1,'mode':'challenge'},a)
        room={'id':invite['room']['id']}
        post('/partners/room',room,c,404)
        post('/partners/respond',{**room,'accept':True},b)
        event={**room,'event':'entreno-test','exercise':0}
        post('/partners/set',event,a)
        post('/partners/set',event,a)
        view,_=post('/partners/room',room,b)
        assert view['room']['counts'][0]['n']==1
        post('/partners/finish',room,a)
        done,_=post('/partners/finish',room,b)
        assert done['room']['state']=='finished'
        print('PASS HTTP: panel y cierre, tres cuentas, retos privados, repetición y finalización.')
    finally:
        server.terminate()
        server.wait()
