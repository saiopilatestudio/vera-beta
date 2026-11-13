package app.vera.coach.beta;
import android.health.connect.*;
import android.health.connect.datatypes.*;
import android.os.OutcomeReceiver;
import java.time.*;
import java.util.*;
import java.util.function.Consumer;
import org.json.*;
class HealthReader{
 static boolean allowed(Main a,String p){return a.checkSelfPermission("android.permission.health.READ_"+p)==0;}
 static void read(Main a){
 HealthConnectManager m=a.getSystemService(HealthConnectManager.class);
 if(m==null){a.status("Health Connect no está disponible.");return;}
 Instant end=Instant.now(),start=LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();
 TimeInstantRangeFilter today=new TimeInstantRangeFilter.Builder().setStartTime(start).setEndTime(end).build();
 if(allowed(a,"STEPS"))m.aggregate(new AggregateRecordsRequest.Builder<Long>(today).addAggregationType(StepsRecord.STEPS_COUNT_TOTAL).build(),a.getMainExecutor(),new OutcomeReceiver<AggregateRecordsResponse<Long>,HealthConnectException>(){public void onResult(AggregateRecordsResponse<Long> r){Long n=r.get(StepsRecord.STEPS_COUNT_TOTAL);if(n!=null)emit(a,"steps","["+n+"]");}public void onError(HealthConnectException e){a.status("No se pudieron importar los pasos.");}});
 if(allowed(a,"EXERCISE"))records(a,m,ExerciseSessionRecord.class,today,rs->{JSONArray arr=new JSONArray();for(ExerciseSessionRecord r:rs)arr.put(r.getStartTime().toString());emit(a,"workouts",arr.toString());});
 if(allowed(a,"SLEEP")){TimeInstantRangeFilter window=new TimeInstantRangeFilter.Builder().setStartTime(start.minus(Duration.ofDays(2))).setEndTime(end).build();records(a,m,SleepSessionRecord.class,window,rs->{JSONArray arr=new JSONArray();for(SleepSessionRecord r:rs){if(r.getEndTime().isBefore(start))continue;JSONArray awake=new JSONArray();for(SleepSessionRecord.Stage stage:r.getStages()){int type=stage.getType();if(type==1||type==3||type==7)awake.put(new JSONArray().put(stage.getStartTime().toEpochMilli()).put(stage.getEndTime().toEpochMilli()));}arr.put(new JSONArray().put(r.getStartTime().toEpochMilli()).put(r.getEndTime().toEpochMilli()).put(awake));}emit(a,"sleep",arr.toString());});}
 if(!allowed(a,"STEPS")&&!allowed(a,"EXERCISE")&&!allowed(a,"SLEEP"))a.status("Sin permisos de lectura.");
 }
 static <T extends android.health.connect.datatypes.Record> void records(Main a,HealthConnectManager m,Class<T> cls,TimeInstantRangeFilter range,Consumer<List<T>> done){m.readRecords(new ReadRecordsRequestUsingFilters.Builder<T>(cls).setTimeRangeFilter(range).setPageSize(500).build(),a.getMainExecutor(),new OutcomeReceiver<ReadRecordsResponse<T>,HealthConnectException>(){public void onResult(ReadRecordsResponse<T> r){done.accept(r.getRecords());}public void onError(HealthConnectException e){a.status("No se pudo leer "+cls.getSimpleName());}});}
 static void emit(Main a,String type,String data){a.web.evaluateJavascript("healthImport('"+type+"',"+data+")",null);}
}
