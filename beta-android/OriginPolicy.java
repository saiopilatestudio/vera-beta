package app.vera.coach.visionbeta;

import java.net.URI;
import java.net.URISyntaxException;

/** Exact origin match: never use prefix matching for privileged WebView APIs. */
final class OriginPolicy {
 static boolean trusted(String origin) {
  if (origin == null) return false;
  try {
   URI uri = new URI(origin);
   return "https".equals(uri.getScheme())
     && "localhost".equals(uri.getHost())
     && uri.getRawUserInfo() == null
     && (uri.getPort() == -1 || uri.getPort() == 443)
     && (uri.getRawPath() == null || uri.getRawPath().isEmpty() || "/".equals(uri.getRawPath()))
     && uri.getRawQuery() == null && uri.getRawFragment() == null;
  } catch (URISyntaxException e) { return false; }
 }
}
