package app.vera.coach.visionbeta;
import java.util.*;
class HealthNavigationAudit244 {
 static void same(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
 public static void main(String[] args){List<String> seen=new ArrayList<>();same("fit_launcher",HealthNavigation244.open("fit",route->{seen.add(route);return true;}));same(Arrays.asList("fit_launcher"),seen);same(null,HealthNavigation244.open("fit",route->false));seen.clear();same("health_home",HealthNavigation244.open("permissions",route->{seen.add(route);if(route.equals("health_permissions"))throw new SecurityException();return true;}));same(Arrays.asList("health_permissions","health_home"),seen);same("app_settings",HealthNavigation244.open("permissions",route->route.equals("app_settings")));same(null,HealthNavigation244.open("permissions",route->{throw new IllegalStateException();}));same(null,HealthNavigation244.open("https://evil.test",route->{throw new AssertionError("Unknown destination launched");}));System.out.println("PASS Health navigation: Fit launcher, missing app, health permission fallback/home/appsettings, exception handling and fixed destination allowlist.");}
}
