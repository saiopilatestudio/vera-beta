package app.vera.coach.visionbeta;
final class AssetMime {
 static String of(String path){String n=path.toLowerCase(java.util.Locale.ROOT);if(n.endsWith(".svg"))return "image/svg+xml";if(n.endsWith(".png"))return "image/png";if(n.endsWith(".jpg")||n.endsWith(".jpeg"))return "image/jpeg";if(n.endsWith(".webp"))return "image/webp";if(n.endsWith(".woff2"))return "font/woff2";if(n.endsWith(".js"))return "application/javascript";if(n.endsWith(".css"))return "text/css";if(n.endsWith(".html"))return "text/html";if(n.endsWith(".json"))return "application/json";return "application/octet-stream";}
}
