package app.vera.coach.visionbeta;
/** Filters raw GPS; only distance is retained. No route is recorded. */
public final class SportMath24 {
 public double meters=0; private double lat,lon,accuracy; private long elapsed=-1;
 public void resetAnchor(){elapsed=-1;}
 public boolean add(double latitude,double longitude,double acc,long time,long now,String sport){
  if(!Double.isFinite(latitude)||!Double.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180||!Double.isFinite(acc)||acc<=0||acc>35||time<=0||now-time>15000||time>now+1000)return false;
  if(elapsed>=0&&time<=elapsed)return false;
  if(elapsed<0||time-elapsed>30000){lat=latitude;lon=longitude;accuracy=acc;elapsed=time;return true;}
  double a=Math.toRadians(latitude-lat),b=Math.toRadians(longitude-lon),h=Math.sin(a/2)*Math.sin(a/2)+Math.cos(Math.toRadians(lat))*Math.cos(Math.toRadians(latitude))*Math.sin(b/2)*Math.sin(b/2),distance=6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h))),speed=distance/((time-elapsed)/1000.0),limit="cycling".equals(sport)?27.8:"running".equals(sport)?12:5;
  if(speed>limit)return false;
  if(distance<Math.max(3,(accuracy+acc)*.35))return false;
  meters+=distance;lat=latitude;lon=longitude;accuracy=acc;elapsed=time;return true;
 }
}
