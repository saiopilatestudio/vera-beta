package app.vera.coach.visionbeta;
import java.util.*;
class HealthCardioAudit24 {
 static HealthCardio24.Metric m(String origin,String id,long s,long e,double v){return new HealthCardio24.Metric(origin,id,s,e,v);}
 static void same(Object expected,Object actual){if(!Objects.equals(expected,actual))throw new AssertionError("expected "+expected+" got "+actual);}
 public static void main(String[] args){
 same(300.0,HealthCardio24.sum(Arrays.asList(m("fit","a",1000,5000,100),m("fit","b",5000,9000,200)),"fit",1000,9000));
 same(300.0,HealthCardio24.sum(Arrays.asList(m("fit","a",1000,9000,300),m("fit","a",1000,9000,300),m("watch","other",1000,9000,500)),"fit",1000,9000));
 same(null,HealthCardio24.sum(Arrays.asList(m("fit","a",1000,6000,100),m("fit","b",5000,9000,200)),"fit",1000,9000));
 same(null,HealthCardio24.sum(Arrays.asList(m("fit","a",0,10000,100)),"fit",1000,9000));
 same(null,HealthCardio24.sum(Arrays.asList(m("fit","a",1000,5000,100)),"fit",1000,9000));
 same(null,HealthCardio24.sum(Arrays.asList(m("watch","a",1000,9000,100)),"fit",1000,9000));
 same(null,HealthCardio24.sum(Arrays.asList(m("fit","a",1000,9000,Double.NaN)),"fit",1000,9000));
 same(0.0,HealthCardio24.sum(Arrays.asList(m("fit","a",1000,9000,0)),"fit",1000,9000));
 int[] gaps=HealthCardio24.candidateCounts(Arrays.asList(m("fit","g1",1000,3000,10),m("fit","g2",5000,9000,20)),"fit",1000,9000);same(2,gaps[1]);same(true,HealthCardio24.aggregationEligible(gaps,false));
 int[] boundary=HealthCardio24.candidateCounts(Arrays.asList(m("fit","edge",0,10000,30)),"fit",1000,9000);same(true,HealthCardio24.aggregationEligible(boundary,false));
 int[] daily=HealthCardio24.candidateCounts(Arrays.asList(m("fit","day",0,86400000,10000)),"fit",3600000,4200000);same(1,daily[2]);same(false,HealthCardio24.aggregationEligible(daily,true));
 int[] absent=HealthCardio24.candidateCounts(Collections.emptyList(),"fit",1000,9000);same(true,HealthCardio24.aggregationEligible(absent,true));same(false,HealthCardio24.aggregationEligible(absent,false));
 same(true,HealthCardio24.ambiguous(1000,9000,8000,10000));same(false,HealthCardio24.ambiguous(1000,9000,9000,10000));same(false,HealthCardio24.ambiguous(1000,9000,1000,9000));
 System.out.println("PASS Health cardio metrics: same-origin, exact coverage, duplicate IDs, overlaps, daily totals, missing, nonfinite and real zero.");
 }
}
