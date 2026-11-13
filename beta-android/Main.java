package app.vera.coach.beta;
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
 public void onCreate(Bundle state){super.onCreate(state);
 android.widget.FrameLayout frame=new android.widget.FrameLayout(this);
 if(Build.VERSION.SDK_INT>=30)getWindow().setDecorFitsSystemWindows(false);
 web=new WebView(this);frame.addView(web);setContentView(frame);getWindow().setStatusBarColor(0xfff7f4eb);getWindow().setNavigationBarColor(0xfff7f4eb);getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
 frame.setOnApplyWindowInsetsListener((v,insets)->{if(Build.VERSION.SDK_INT>=30){android.graphics.Insets b=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout()|WindowInsets.Type.ime());v.setPadding(b.left,b.top,b.right,b.bottom);}else v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());return insets.consumeSystemWindowInsets();});
 web.getSettings().setJavaScriptEnabled(true);web.getSettings().setDomStorageEnabled(true);web.getSettings().setAllowFileAccess(false);
 web.setWebViewClient(new WebViewClient(){
 public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){return true;}
 public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){if(HOME.equals(r.getUrl().toString()))try{return new WebResourceResponse("text/html","UTF-8",getAssets().open("index.html"));}catch(Exception e){throw new RuntimeException(e);}return null;}});
 web.setWebChromeClient(new WebChromeClient(){
 public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> cb,FileChooserParams params){if(picker!=null)picker.onReceiveValue(null);picker=cb;if(params.isCaptureEnabled()){Uri target=Uri.parse("content://app.vera.coach.beta.capture/machine.jpg");Intent c=new Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE);c.putExtra(android.provider.MediaStore.EXTRA_OUTPUT,target);c.setClipData(ClipData.newRawUri("Foto",target));c.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|Intent.FLAG_GRANT_WRITE_URI_PERMISSION);try{new java.io.File(getCacheDir(),"vera-camera.jpg").delete();startActivityForResult(c,5);return true;}catch(ActivityNotFoundException ex){status("No hay cámara disponible. Puedes elegir una imagen.");}} Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.setType("image/*");i.addCategory(Intent.CATEGORY_OPENABLE);startActivityForResult(i,2);return true;}
 public void onPermissionRequest(PermissionRequest r){if(!r.getOrigin().toString().startsWith("https://localhost")||!Arrays.asList(r.getResources()).contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)){r.deny();return;}if(checkSelfPermission("android.permission.RECORD_AUDIO")==0)r.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});else{microphone=r;requestPermissions(new String[]{"android.permission.RECORD_AUDIO"},3);}}});
 voice=new TextToSpeech(this,status->{if(status==TextToSpeech.SUCCESS&&voice!=null)voice.setLanguage(new Locale("es","ES"));});
 web.addJavascriptInterface(new Bridge(),"VeraNative");web.loadUrl(HOME);
 if("android.intent.action.VIEW_PERMISSION_USAGE".equals(getIntent().getAction()))new AlertDialog.Builder(this).setMessage("Vera importa pasos, sesiones y sueño a tu diario cuando lo solicitas. Al consultar a la IA se envían los registros al servicio configurado. Puedes revocar los permisos en Health Connect.").setPositiveButton("Entendido",null).show();
 }
 public class Bridge{
 @JavascriptInterface public void say(String text){if(voice!=null)voice.speak(text,TextToSpeech.QUEUE_FLUSH,null,"pose");}
 @JavascriptInterface public void health(){runOnUiThread(()->{if(Build.VERSION.SDK_INT<34){status("Esta beta requiere Android 14 o posterior para Health Connect. Puedes usar el diario manual.");return;}requestPermissions(new String[]{"android.permission.health.READ_STEPS","android.permission.health.READ_EXERCISE","android.permission.health.READ_SLEEP"},4);});}
 }
 void status(String s){web.evaluateJavascript("msg("+org.json.JSONObject.quote(s)+")",null);}
 public void onRequestPermissionsResult(int id,String[] p,int[] g){super.onRequestPermissionsResult(id,p,g);if(id==3&&microphone!=null){if(g.length>0&&g[0]==0)microphone.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});else microphone.deny();microphone=null;}if(id==4&&Build.VERSION.SDK_INT>=34)HealthReader.read(this);}
 protected void onActivityResult(int req,int result,Intent d){super.onActivityResult(req,result,d);if(req==5&&picker!=null){Uri u=Uri.parse("content://app.vera.coach.beta.capture/machine.jpg");revokeUriPermission(u,Intent.FLAG_GRANT_WRITE_URI_PERMISSION|Intent.FLAG_GRANT_READ_URI_PERMISSION);picker.onReceiveValue(result==RESULT_OK&&new java.io.File(getCacheDir(),"vera-camera.jpg").length()>0?new Uri[]{u}:null);picker=null;}if(req==2&&picker!=null){picker.onReceiveValue(result==RESULT_OK&&d!=null&&d.getData()!=null?new Uri[]{d.getData()}:null);picker=null;}}
 protected void onDestroy(){if(voice!=null)voice.shutdown();super.onDestroy();}
}
