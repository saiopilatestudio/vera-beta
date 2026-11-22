package app.vera.coach.visionbeta;
class AndroidMimeAudit {
 public static void main(String[] args){String[][] cases={{"brand22.svg","image/svg+xml"},{"logo.PNG","image/png"},{"portrait.jpeg","image/jpeg"},{"photo.webp","image/webp"},{"app.js","application/javascript"},{"style.css","text/css"},{"index.html","text/html"},{"unknown","application/octet-stream"}};for(String[] row:cases)if(!AssetMime.of(row[0]).equals(row[1]))throw new AssertionError(row[0]);System.out.println("PASS: 8 asset MIME cases, SVG logo compatible with nosniff.");}
}
