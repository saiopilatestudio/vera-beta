package app.vera.coach.visionbeta;
import android.app.*;
import android.os.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.webkit.*;
import java.util.*;
import android.view.*;

public class Main extends Activity {
 WebView web; ValueCallback<Uri[]> picker; PermissionRequest microphone;
 static final String HOME="https://localhost/index.html";
 static boolean trustedOrigin(Uri uri){return uri!=null&&OriginPolicy.trusted(uri.toString());}
 public void onCreate(Bundle state){super.onCreate(state);LoginVault.migrate(getPreferences(0));
 android.widget.FrameLayout frame=new android.widget.FrameLayout(this);
 if(Build.VERSION.SDK_INT>=30)getWindow().setDecorFitsSystemWindows(false);
 web=new WebView(this);frame.addView(web);setContentView(frame);web.setBackgroundColor(0xfff8fbf2);getWindow().setStatusBarColor(0xfff8fbf2);getWindow().setNavigationBarColor(0xfff8fbf2);getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
 frame.setOnApplyWindowInsetsListener((v,insets)->{if(Build.VERSION.SDK_INT>=30){android.graphics.Insets b=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout()|WindowInsets.Type.ime());v.setPadding(b.left,b.top,b.right,b.bottom);}else v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());return insets.consumeSystemWindowInsets();});
 web.getSettings().setJavaScriptEnabled(true);web.getSettings().setMediaPlaybackRequiresUserGesture(false);web.getSettings().setDomStorageEnabled(true);web.getSettings().setAllowFileAccess(false);web.getSettings().setAllowFileAccessFromFileURLs(false);web.getSettings().setAllowUniversalAccessFromFileURLs(false);web.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
 web.setWebViewClient(new WebViewClient(){
 public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){
 Uri u=r.getUrl();if(r.isForMainFrame()&&"https".equals(u.getScheme())&&"www.google.com".equals(u.getHost())&&("/search".equals(u.getPath())||u.getPath().startsWith("/maps/")))try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(ActivityNotFoundException ignored){}return true;}
 public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){
 Uri u=r.getUrl();if(!"https".equals(u.getScheme())||!"localhost".equals(u.getAuthority()))return null;
 String name=u.getPath().substring(1);if(!name.matches("[A-Za-z0-9_./-]+")||name.contains(".."))return null;
 String mime=AssetMime.of(name);
 try{Map<String,String> headers=new HashMap<>();headers.put("X-Content-Type-Options","nosniff");if(name.endsWith(".html"))headers.put("Content-Security-Policy","frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'");return new WebResourceResponse(mime,null,200,"OK",headers,getAssets().open(name));}catch(java.io.IOException e){return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",null,new java.io.ByteArrayInputStream(new byte[0]));}}});
 web.setWebChromeClient(new WebChromeClient(){
 public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> cb,FileChooserParams params){if(picker!=null)picker.onReceiveValue(null);picker=cb;if(params.isCaptureEnabled()){Uri target=Uri.parse("content://app.vera.coach.visionbeta.capture/machine.jpg");Intent c=new Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE);c.putExtra(android.provider.MediaStore.EXTRA_OUTPUT,target);c.setClipData(ClipData.newRawUri("Foto",target));c.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION);try{new java.io.File(getCacheDir(),"vera-camera.jpg").delete();startActivityForResult(c,5);return true;}catch(ActivityNotFoundException|SecurityException ex){status("No hay cámara disponible. Puedes elegir una imagen.");}} Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);String[] accept=params.getAcceptTypes();i.setType(accept!=null&&accept.length>0&&Arrays.toString(accept).contains("json")?"application/json":"image/*");i.addCategory(Intent.CATEGORY_OPENABLE);try{startActivityForResult(i,2);}catch(ActivityNotFoundException|SecurityException ex){picker.onReceiveValue(null);picker=null;status("No se pudo abrir el selector de archivos.");}return true;}
 public void onPermissionRequest(PermissionRequest r){if(!trustedOrigin(r.getOrigin())||!Arrays.asList(r.getResources()).contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)){r.deny();return;}if(checkSelfPermission("android.permission.RECORD_AUDIO")==0)r.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});else{if(microphone!=null){r.deny();return;}microphone=r;requestPermissions(new String[]{"android.permission.RECORD_AUDIO"},3);}}
 public void onPermissionRequestCanceled(PermissionRequest r){if(microphone==r)microphone=null;}});
 web.addJavascriptInterface(new Bridge(),"VeraNative");web.loadUrl(HOME);
 if("android.intent.action.VIEW_PERMISSION_USAGE".equals(getIntent().getAction()))new AlertDialog.Builder(this).setMessage("Vera lee y escribe pasos, sesiones, sueño, peso, nutrición e hidratación en Health Connect tras tu autorización. Sólo modifica registros propios. Actualiza el diario al abrir la app y mientras está activa. Se sincronizan con tu cuenta; al pedir análisis remoto se envían a Groq o Gemini según la función. Puedes revocar permisos en Health Connect.").setPositiveButton("Entendido",null).show();
 }
 private String backupPayload;
 private boolean requestingBio; private String healthTicket21; private long externalFlow23;
 protected void onStop(){super.onStop();if(web!=null){web.setVisibility(View.INVISIBLE);web.evaluateJavascript("window.suspendSession24?.()",null);}}
 protected void onResume(){super.onResume();if(web!=null){web.setVisibility(View.VISIBLE);externalFlow23=0;web.evaluateJavascript("window.resumeSession24?.()",null);}}
 public class Bridge{
 @JavascriptInterface public String healthPermissions23(){return HealthWriter23.status(Main.this);}
 @JavascriptInterface public void deleteHealth23(String ticket,String json){runOnUiThread(()->{if(Build.VERSION.SDK_INT>=34)HealthWriter23.delete(Main.this,ticket,json);});}
 @JavascriptInterface public void writeHealth23(String ticket,String json){runOnUiThread(()->{if(Build.VERSION.SDK_INT>=34)HealthWriter23.write(Main.this,ticket,json);});}
 @JavascriptInterface public void openGoogle23(String url){runOnUiThread(()->{try{Uri u=Uri.parse(url);if(!"https".equals(u.getScheme())||!"accounts.google.com".equals(u.getAuthority())||!"/o/oauth2/v2/auth".equals(u.getPath()))return;externalFlow23=SystemClock.elapsedRealtime();startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception e){externalFlow23=0;status("No se pudo abrir Google en el navegador.");}});}
 @JavascriptInterface public void persistSession24(String owner,String token){try{SessionStore24.save(getPreferences(0),owner,token);}catch(Exception e){runOnUiThread(()->status("No se pudo conservar la sesión en este dispositivo."));}}
 @JavascriptInterface public String restoreSession24(){try{return SessionStore24.read(getPreferences(0));}catch(Exception e){SessionStore24.clear(getPreferences(0));return "";}}
 @JavascriptInterface public String savedEmail(){return getPreferences(0).getString("loginMail","");}
 @JavascriptInterface public boolean hasSavedSession(){return getPreferences(0).contains("sessionCipher");}
 @JavascriptInterface public void forgetLogin(){SessionStore24.clear(getPreferences(0));getPreferences(0).edit().remove("loginMail").remove("loginSecret").remove("loginIV").remove("sessionCipher").apply();}
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


 @JavascriptInterface public void refreshHealth21(String ticket){runOnUiThread(()->{if(Build.VERSION.SDK_INT>=34)HealthReader.read(Main.this,ticket);});}
 @JavascriptInterface public void health21(String ticket){runOnUiThread(()->{if(Build.VERSION.SDK_INT<34){status("Health Connect requiere Android 14 o posterior en esta APK.");return;}healthTicket21=ticket;externalFlow23=SystemClock.elapsedRealtime();requestPermissions(HealthWriter23.permissions(),4);});}
 }
 void status(String s){if(web==null||isFinishing()||isDestroyed())return;web.evaluateJavascript("msg("+org.json.JSONObject.quote(s)+")",null);}
 public void onRequestPermissionsResult(int id,String[] p,int[] g){super.onRequestPermissionsResult(id,p,g);if(id==3&&microphone!=null){if(g.length>0&&g[0]==0)microphone.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});else microphone.deny();microphone=null;}if(id==4&&Build.VERSION.SDK_INT>=34){String ticket=healthTicket21;healthTicket21=null;externalFlow23=0;HealthReader.read(this,ticket);if(web!=null)web.evaluateJavascript("window.render?.()",null);}}
 protected void onActivityResult(int req,int result,Intent d){super.onActivityResult(req,result,d);if(req==7){String payload=backupPayload;backupPayload=null;if(result==RESULT_OK&&payload!=null&&d!=null&&d.getData()!=null){final Uri uri=d.getData();new Thread(()->{try(java.io.OutputStream out=getContentResolver().openOutputStream(uri,"wt")){out.write(payload.getBytes(java.nio.charset.StandardCharsets.UTF_8));runOnUiThread(()->status("Respaldo guardado."));}catch(Exception e){runOnUiThread(()->status("No se pudo escribir el respaldo."));}}).start();}}if(req==5&&picker!=null){Uri u=Uri.parse("content://app.vera.coach.visionbeta.capture/machine.jpg");revokeUriPermission(u,Intent.FLAG_GRANT_WRITE_URI_PERMISSION|Intent.FLAG_GRANT_READ_URI_PERMISSION);picker.onReceiveValue(result==RESULT_OK&&new java.io.File(getCacheDir(),"vera-camera.jpg").length()>0?new Uri[]{u}:null);picker=null;}if(req==2&&picker!=null){picker.onReceiveValue(result==RESULT_OK&&d!=null&&d.getData()!=null?new Uri[]{d.getData()}:null);picker=null;}}
 protected void onDestroy(){if(microphone!=null){microphone.deny();microphone=null;}if(picker!=null){picker.onReceiveValue(null);picker=null;}backupPayload=null;if(web!=null){web.removeJavascriptInterface("VeraNative");web.stopLoading();if(web.getParent() instanceof ViewGroup)((ViewGroup)web.getParent()).removeView(web);web.destroy();web=null;}super.onDestroy();}
}
