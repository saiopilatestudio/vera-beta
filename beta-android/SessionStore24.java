package app.vera.coach.visionbeta;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import java.security.KeyStore;
import java.nio.charset.StandardCharsets;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import org.json.JSONObject;
final class SessionStore24 {
 private static final String ALIAS="vera.session.persist.v24";
 static KeyStore keys()throws Exception{KeyStore k=KeyStore.getInstance("AndroidKeyStore");k.load(null);return k;}
 static void clear(SharedPreferences p){p.edit().remove("activeSession24").remove("activeSessionIV24").apply();}
 static void save(SharedPreferences p,String owner,String token)throws Exception{
  if(!owner.matches("https://vera\\-beta\\.onrender\\.com/[a-f0-9]{32}")||!token.matches("[a-fA-F0-9]{64}"))throw new IllegalArgumentException();
  KeyStore k=keys();if(!k.containsAlias(ALIAS)){KeyGenerator g=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");g.init(new KeyGenParameterSpec.Builder(ALIAS,KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).setUserAuthenticationRequired(false).build());g.generateKey();}
  JSONObject value=new JSONObject();value.put("owner",owner);value.put("token",token);Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.ENCRYPT_MODE,(SecretKey)k.getKey(ALIAS,null));
  p.edit().putString("activeSession24",Base64.encodeToString(c.doFinal(value.toString().getBytes(StandardCharsets.UTF_8)),Base64.NO_WRAP)).putString("activeSessionIV24",Base64.encodeToString(c.getIV(),Base64.NO_WRAP)).apply();
 }
 static String read(SharedPreferences p)throws Exception{if(!p.contains("activeSession24"))return "";Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.DECRYPT_MODE,(SecretKey)keys().getKey(ALIAS,null),new GCMParameterSpec(128,Base64.decode(p.getString("activeSessionIV24",""),Base64.DEFAULT)));return new String(c.doFinal(Base64.decode(p.getString("activeSession24",""),Base64.DEFAULT)),StandardCharsets.UTF_8);}
}
