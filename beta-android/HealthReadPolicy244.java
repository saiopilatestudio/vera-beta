package app.vera.coach.visionbeta;
import java.util.*;
/** Platform-independent ownership of asynchronous Health Connect reads. */
final class HealthReadPolicy244 {
 private static final WeakHashMap<Object,String> tickets=new WeakHashMap<>();
 static synchronized boolean begin(Object owner,String ticket){if(owner==null||ticket==null||!ticket.matches("[A-Za-z0-9_-]{1,100}"))return false;tickets.put(owner,ticket);return true;}
 static synchronized boolean current(Object owner,String ticket){return ticket!=null&&ticket.equals(tickets.get(owner));}
 static synchronized void cancel(Object owner){tickets.remove(owner);}
 static boolean ownRecord(String origin,String client){return "app.vera.coach.visionbeta".equals(origin)&&client!=null&&client.startsWith("vera23_");}
}
