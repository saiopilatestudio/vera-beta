package app.vera.coach.visionbeta;

import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import java.security.KeyFactory;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.nio.charset.StandardCharsets;
import javax.crypto.Cipher;
import javax.crypto.spec.OAEPParameterSpec;
import javax.crypto.spec.PSource;
import java.security.spec.MGF1ParameterSpec;

final class LoginVault {
 private static final String ALIAS="vera.remember.session.v13";
 private static KeyStore keys() throws Exception {
  KeyStore store=KeyStore.getInstance("AndroidKeyStore");store.load(null);return store;
 }
 static void migrate(SharedPreferences prefs){
  if(!prefs.contains("loginSecret"))return;
  prefs.edit().remove("loginSecret").remove("loginIV").apply();
  try{keys().deleteEntry("vera.remember.password");}catch(Exception ignored){}
 }
 private static OAEPParameterSpec padding(){return new OAEPParameterSpec("SHA-256","MGF1",MGF1ParameterSpec.SHA1,PSource.PSpecified.DEFAULT);}
 static void save(SharedPreferences p,String email,String token) throws Exception {
  if(!token.matches("[a-fA-F0-9]{64}"))throw new IllegalArgumentException();
  KeyStore store=keys();
  if(!store.containsAlias(ALIAS)){
   KeyPairGenerator gen=KeyPairGenerator.getInstance("RSA","AndroidKeyStore");
   gen.initialize(new KeyGenParameterSpec.Builder(ALIAS,KeyProperties.PURPOSE_DECRYPT)
    .setKeySize(2048).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_RSA_OAEP)
    .setDigests(KeyProperties.DIGEST_SHA256,KeyProperties.DIGEST_SHA1).setUserAuthenticationRequired(true).build());
   gen.generateKeyPair();
  }
  PublicKey pub=KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(store.getCertificate(ALIAS).getPublicKey().getEncoded()));
  Cipher c=Cipher.getInstance("RSA/ECB/OAEPPadding");c.init(Cipher.ENCRYPT_MODE,pub,padding());
  p.edit().putString("loginMail",email).putString("sessionCipher",Base64.encodeToString(c.doFinal(token.getBytes(StandardCharsets.UTF_8)),Base64.NO_WRAP)).apply();
 }
 static Cipher decryption()throws Exception{
  Cipher c=Cipher.getInstance("RSA/ECB/OAEPPadding");c.init(Cipher.DECRYPT_MODE,keys().getKey(ALIAS,null),padding());return c;
 }
 static String read(SharedPreferences p,Cipher c)throws Exception{return new String(c.doFinal(Base64.decode(p.getString("sessionCipher",""),Base64.DEFAULT)),StandardCharsets.UTF_8);}
}
