package app.vera.coach.visionbeta;
import android.app.*;
import android.os.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.webkit.*;
import android.speech.tts.TextToSpeech;
import java.util.*;
import android.view.*;

public class Main extends Activity {
 WebView web; ValueCallback<Uri[]> picker; PermissionRequest microphone; TextToSpeech voice;
 static final String HOME="https://localhost/index.html";
 public void onCreate(Bundle state){super.onCreate(state);LoginVault.migrate(getPreferences(0));
 android.widget.FrameLayout frame=new android.widget.FrameLayout(this);
 if(Build.VERSION.SDK_INT>=30)getWindow().setDecorFitsSystemWindows(false);
 web=new WebView(this);frame.addView(web);setContentView(frame);getWindow().setStatusBarColor(0xff091913);getWindow().setNavigationBarColor(0xff091913);getWindow().getDecorView().setSystemUiVisibility(0);
 frame.setOnApplyWindowInsetsListener((v,insets)->{if(Build.VERSION.SDK_INT>=30){android.graphics.Insets b=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout()|WindowInsets.Type.ime());v.setPadding(b.left,b.top,b.right,b.bottom);}else v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());return insets.consumeSystemWindowInsets();});
 web.getSettings().setJavaScriptEnabled(true);web.getSettings().setDomStorageEnabled(true);web.getSettings().setAllowFileAccess(false);
 web.setWebViewClient(new WebViewClient(){
 public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){
 Uri u=r.getUrl();if(r.isForMainFrame()&&"https".equals(u.getScheme())&&"www.google.com".equals(u.getHost())&&("/search".equals(u.getPath())||u.getPath().startsWith("/maps/")))try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(ActivityNotFoundException ignored){}return true;}
 public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){
 Uri u=r.getUrl();if(!"https".equals(u.getScheme())||!"localhost".equals(u.getAuthority()))return null;
 String name=u.getPath().substring(1);if(!name.matches("[A-Za-z0-9_./-]+")||name.contains(".."))return null;
 String mime=name.endsWith(".js")?"application/javascript":name.endsWith(".css")?"text/css":name.endsWith(".html")?"text/html":name.endsWith(".wasm")?"application/wasm":name.endsWith(".json")?"application/json":"application/octet-stream";
 try{return new WebResourceResponse(mime,null,getAssets().open(name));}catch(java.io.IOException e){return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",null,new java.io.ByteArrayInputStream(new byte[0]));}}});
 web.setWebChromeClient(new WebChromeClient(){
 public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> cb,FileChooserParams params){if(picker!=null)picker.onReceiveValue(null);picker=cb;if(params.isCaptureEnabled()){Uri target=Uri.parse("content://app.vera.coach.visionbeta.capture/machine.jpg");Intent c=new Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE);c.putExtra(android.provider.MediaStore.EXTRA_OUTPUT,target);c.setClipData(ClipData.newRawUri("Foto",target));c.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION);try{new java.io.File(getCacheDir(),"vera-camera.jpg").delete();startActivityForResult(c,5);return true;}catch(ActivityNotFoundException ex){status("No hay cámara disponible. Puedes elegir una imagen.");}} Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);String[] accept=params.getAcceptTypes();i.setType(accept!=null&&accept.length>0&&Arrays.toString(accept).contains("json")?"application/json":"image/*");i.addCategory(Intent.CATEGORY_OPENABLE);startActivityForResult(i,2);return true;}
 public void onPermissionRequest(PermissionRequest r){if(!r.getOrigin().toString().startsWith("https://localhost")||!Arrays.asList(r.getResources()).contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)){r.deny();return;}if(checkSelfPermission("android.permission.RECORD_AUDIO")==0)r.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});else{microphone=r;requestPermissions(new String[]{"android.permission.RECORD_AUDIO"},3);}}});
 voice=new TextToSpeech(this,status->{if(status==TextToSpeech.SUCCESS&&voice!=null){voice.setLanguage(new Locale("es","ES"));voice.setSpeechRate(.93f);if(voice.getVoices()!=null)for(android.speech.tts.Voice v:voice.getVoices())if(v.getName().equals(getPreferences(0).getString("voice","")))voice.setVoice(v);}});
 web.addJavascriptInterface(new Bridge(),"VeraNative");web.loadUrl(HOME);
 if("android.intent.action.VIEW_PERMISSION_USAGE".equals(getIntent().getAction()))new AlertDialog.Builder(this).setMessage("Vera importa pasos, sesiones y sueño a tu diario cuando lo solicitas. Al consultar a la IA se envían los registros al servicio configurado. Puedes revocar los permisos en Health Connect.").setPositiveButton("Entendido",null).show();
 }
 private String backupPayload;
 private boolean requestingBio;
 protected void onStop(){super.onStop();if(web!=null&&picker==null&&backupPayload==null){web.setVisibility(View.INVISIBLE);web.evaluateJavascript("window.lockDiary?.()",null);}}
 protected void onResume(){super.onResume();if(web!=null)web.setVisibility(View.VISIBLE);}
 public class Bridge{
 @JavascriptInterface public String savedEmail(){return getPreferences(0).getString("loginMail","");}
 @JavascriptInterface public boolean hasSavedSession(){return getPreferences(0).contains("sessionCipher");}
 @JavascriptInterface public void forgetLogin(){getPreferences(0).edit().remove("loginMail").remove("loginSecret").remove("loginIV").remove("sessionCipher").apply();}
 @JavascriptInterface public void rememberLogin(String email,String token){try{LoginVault.save(getPreferences(0),email,token);}catch(Exception e){forgetLogin();runOnUiThread(()->status("No se pudo recordar la cuenta."));}}
 @JavascriptInterface public void loginBiometric(boolean saved,boolean reveal){promptLogin(saved,reveal,false);}
 @JavascriptInterface public void unlock(){promptLogin(false,false,true);}
 private void promptLogin(boolean saved,boolean reveal,boolean diary){runOnUiThread(()->{
 if(requestingBio)return;
 if(Build.VERSION.SDK_INT<28){if(!diary&&!saved&&!reveal)web.evaluateJavascript("authenticated12(null,false)",null);else status("La biometría requiere Android 9 o posterior.");return;}
 requestingBio=true;
 android.hardware.biometrics.BiometricPrompt prompt=new android.hardware.biometrics.BiometricPrompt.Builder(Main.this).setTitle("Desbloquear Vera").setNegativeButton("Cancelar",getMainExecutor(),(d,w)->requestingBio=false).build();
 android.hardware.biometrics.BiometricPrompt.AuthenticationCallback callback=new android.hardware.biometrics.BiometricPrompt.AuthenticationCallback(){
 public void onAuthenticationSucceeded(android.hardware.biometrics.BiometricPrompt.AuthenticationResult result){requestingBio=false;if(!isFinishing()&&!isDestroyed()){if(diary){web.evaluateJavascript("window.openDiary?.()",null);return;}try{String value=saved?org.json.JSONObject.quote(LoginVault.read(getPreferences(0),result.getCryptoObject().getCipher())):"null";web.evaluateJavascript("authenticated12("+value+","+reveal+")",null);}catch(Exception e){forgetLogin();status("Escribe de nuevo tus credenciales.");}}}
 public void onAuthenticationError(int code,CharSequence message){requestingBio=false;status(message.toString());}
 };
 try{if(saved)prompt.authenticate(new android.hardware.biometrics.BiometricPrompt.CryptoObject(LoginVault.decryption()),new CancellationSignal(),getMainExecutor(),callback);
 else prompt.authenticate(new CancellationSignal(),getMainExecutor(),callback);
 }catch(Exception e){requestingBio=false;forgetLogin();status("Escribe la contraseña para volver a vincular este dispositivo.");web.evaluateJavascript("render()",null);}
 });}

 @JavascriptInterface public void exportBackup(String json){runOnUiThread(()->{if(backupPayload!=null)return;Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType("application/json");intent.putExtra(Intent.EXTRA_TITLE,"vera-diario.json");backupPayload=json;try{startActivityForResult(intent,7);}catch(ActivityNotFoundException e){backupPayload=null;status("El dispositivo no ofrece selector de archivos.");}});}

 @JavascriptInterface public void chooseVoice(){runOnUiThread(()->{if(voice==null||voice.getVoices()==null)return;ArrayList<android.speech.tts.Voice> list=new ArrayList<>();for(android.speech.tts.Voice v:voice.getVoices())if("es".equals(v.getLocale().getLanguage()))list.add(v);list.sort((a,b)->Integer.compare(b.getQuality(),a.getQuality()));String[] labels=new String[list.size()];for(int i=0;i<labels.length;i++)labels[i]=list.get(i).getName()+(list.get(i).isNetworkConnectionRequired()?" · en línea":"");new AlertDialog.Builder(Main.this).setTitle("Elegir voz en español").setSingleChoiceItems(labels,-1,(dialog,i)->{voice.setVoice(list.get(i));getPreferences(0).edit().putString("voice",list.get(i).getName()).apply();say("Hola, soy Vera. Cuéntame cómo te encuentras hoy.");}).setPositiveButton("Listo",null).show();});}
 @JavascriptInterface public void dictate(){runOnUiThread(()->{Intent i=new Intent(android.speech.RecognizerIntent.ACTION_RECOGNIZE_SPEECH);i.putExtra(android.speech.RecognizerIntent.EXTRA_LANGUAGE_MODEL,"free_form");i.putExtra(android.speech.RecognizerIntent.EXTRA_LANGUAGE,"es-ES");try{startActivityForResult(i,6);}catch(ActivityNotFoundException ex){status("Puedes dictar con el micrófono de tu teclado.");}});}

 @JavascriptInterface public void say(String text){if(voice!=null)voice.speak(text,TextToSpeech.QUEUE_FLUSH,null,"pose");}
 @JavascriptInterface public void refreshHealth(){runOnUiThread(()->{if(Build.VERSION.SDK_INT>=34&&HealthReader.allowed(Main.this,"STEPS"))HealthReader.read(Main.this);});}
 @JavascriptInterface public void health(){runOnUiThread(()->{if(Build.VERSION.SDK_INT<34){status("Esta beta requiere Android 14 o posterior para Health Connect. Puedes usar el diario manual.");return;}requestPermissions(new String[]{"android.permission.health.READ_STEPS","android.permission.health.READ_EXERCISE","android.permission.health.READ_SLEEP"},4);});}
 }
 void status(String s){web.evaluateJavascript("msg("+org.json.JSONObject.quote(s)+")",null);}
 public void onRequestPermissionsResult(int id,String[] p,int[] g){super.onRequestPermissionsResult(id,p,g);if(id==3&&microphone!=null){if(g.length>0&&g[0]==0)microphone.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});else microphone.deny();microphone=null;}if(id==4&&Build.VERSION.SDK_INT>=34)HealthReader.read(this);}
 protected void onActivityResult(int req,int result,Intent d){super.onActivityResult(req,result,d);if(req==7){String payload=backupPayload;backupPayload=null;if(result==RESULT_OK&&payload!=null&&d!=null&&d.getData()!=null){final Uri uri=d.getData();new Thread(()->{try(java.io.OutputStream out=getContentResolver().openOutputStream(uri,"wt")){out.write(payload.getBytes(java.nio.charset.StandardCharsets.UTF_8));runOnUiThread(()->status("Respaldo guardado."));}catch(Exception e){runOnUiThread(()->status("No se pudo escribir el respaldo."));}}).start();}}if(req==6&&result==RESULT_OK&&d!=null){ArrayList<String> words=d.getStringArrayListExtra(android.speech.RecognizerIntent.EXTRA_RESULTS);if(words!=null&&!words.isEmpty())web.evaluateJavascript("if(document.getElementById('question'))document.getElementById('question').value="+org.json.JSONObject.quote(words.get(0)),null);}if(req==5&&picker!=null){Uri u=Uri.parse("content://app.vera.coach.visionbeta.capture/machine.jpg");revokeUriPermission(u,Intent.FLAG_GRANT_WRITE_URI_PERMISSION|Intent.FLAG_GRANT_READ_URI_PERMISSION);picker.onReceiveValue(result==RESULT_OK&&new java.io.File(getCacheDir(),"vera-camera.jpg").length()>0?new Uri[]{u}:null);picker=null;}if(req==2&&picker!=null){picker.onReceiveValue(result==RESULT_OK&&d!=null&&d.getData()!=null?new Uri[]{d.getData()}:null);picker=null;}}
 protected void onDestroy(){if(voice!=null)voice.shutdown();super.onDestroy();}
}
