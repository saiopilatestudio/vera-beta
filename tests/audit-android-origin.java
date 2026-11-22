package app.vera.coach.visionbeta;

class AndroidOriginAudit {
 public static void main(String[] args) {
  String[] allowed={"https://localhost", "https://localhost/", "https://localhost:443"};
  String[] denied={null,"", "http://localhost", "https://localhost.evil.example", "https://localhost@evil.example", "https://evil@localhost", "https://localhost:8443", "https://localhost./", "https://localhost%2eevil.example", "file:///localhost", "https://localhost#evil", "https://localhost?evil", "https://localhost/index.html", "https://localhost\\@evil.example"};
  for(String origin:allowed)if(!OriginPolicy.trusted(origin))throw new AssertionError("Rejected app origin: "+origin);
  for(String origin:denied)if(OriginPolicy.trusted(origin))throw new AssertionError("Accepted untrusted origin: "+origin);
  System.out.println("PASS: 17 origin authorization cases (3 valid, 14 invalid).");
 }
}
