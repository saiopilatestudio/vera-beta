package app.vera.coach.visionbeta;
import android.health.connect.*;
import android.health.connect.datatypes.*;
import android.health.connect.datatypes.units.Mass;
import android.os.OutcomeReceiver;
import java.time.*;
import java.util.*;
import java.util.function.Consumer;
import org.json.*;
class HealthReader{
 static final String[] TYPES={"STEPS","EXERCISE","SLEEP","WEIGHT","NUTRITION","HYDRATION"};
 static boolean allowed(Main a,String p){return a.checkSelfPermission("android.permission.health.READ_"+p)==0;}
 static boolean anyAllowed(Main a){for(String p:TYPES)if(allowed(a,p))return true;return false;}
 static String date(Instant t,ZoneOffset z){return t.atZone(z==null?ZoneId.systemDefault():z).toLocalDate().toString();}
 static JSONObject put(JSONObject o,String key,Object value){try{o.put(key,value==null?JSONObject.NULL:value);}catch(JSONException e){}return o;}
 static void mass(JSONObject o,String key,Mass value,double multiplier){if(value!=null)put(o,key,value.getInGrams()*multiplier);}
 static JSONObject base(android.health.connect.datatypes.Record r,Instant time,ZoneOffset offset){JSONObject o=new JSONObject();put(o,"id",r.getMetadata().getId());put(o,"date",date(time,offset));put(o,"origin",r.getMetadata().getDataOrigin().getPackageName());return o;}
 static void read(Main a,String ticket){
 if(ticket==null||!ticket.matches("[A-Za-z0-9_-]{1,100}"))return;
 HealthConnectManager m=a.getSystemService(HealthConnectManager.class);
 if(m==null){error(a,ticket,"all","Health Connect no está disponible.");return;}
 JSONArray granted=new JSONArray();String[] names={"steps","workouts","sleep","weight","nutrition","hydration"};for(int i=0;i<TYPES.length;i++)if(allowed(a,TYPES[i]))granted.put(names[i]);emit(a,ticket,"permissions",granted);
 Instant end=Instant.now(),start=LocalDate.now().minusDays(27).atStartOfDay(ZoneId.systemDefault()).toInstant();
 TimeInstantRangeFilter window=new TimeInstantRangeFilter.Builder().setStartTime(start).setEndTime(end).build();
 TimeRangeFilter stepWindow=new LocalTimeRangeFilter.Builder().setStartTime(LocalDate.now().minusDays(27).atStartOfDay()).setEndTime(LocalDateTime.now()).build();
 if(allowed(a,"STEPS"))try{m.aggregateGroupByPeriod(new AggregateRecordsRequest.Builder<Long>(stepWindow).addAggregationType(StepsRecord.STEPS_COUNT_TOTAL).build(),Period.ofDays(1),a.getMainExecutor(),new OutcomeReceiver<List<AggregateRecordsGroupedByPeriodResponse<Long>>,HealthConnectException>(){public void onResult(List<AggregateRecordsGroupedByPeriodResponse<Long>> results){JSONArray list=new JSONArray();for(AggregateRecordsGroupedByPeriodResponse<Long> r:results){Long n=r.get(StepsRecord.STEPS_COUNT_TOTAL);if(n!=null){JSONObject o=new JSONObject();put(o,"date",r.getStartTime().toLocalDate().toString());put(o,"value",n);list.put(o);}}emit(a,ticket,"steps",list);}public void onError(HealthConnectException e){error(a,ticket,"steps","No se pudieron importar los pasos.");}});}catch(Exception e){error(a,ticket,"steps","Revisa los permisos de pasos.");}
 if(allowed(a,"EXERCISE"))records(a,ticket,m,ExerciseSessionRecord.class,window,rs->HealthCardio24.read(a,ticket,m,window,rs));
 if(allowed(a,"SLEEP"))records(a,ticket,m,SleepSessionRecord.class,window,rs->{JSONArray arr=new JSONArray();for(SleepSessionRecord r:rs){if(r.getEndTime().isBefore(start))continue;JSONObject o=base(r,r.getEndTime(),r.getEndZoneOffset());put(o,"start",r.getStartTime().toEpochMilli());put(o,"end",r.getEndTime().toEpochMilli());JSONArray awake=new JSONArray();for(SleepSessionRecord.Stage stage:r.getStages()){int type=stage.getType();if(type==1||type==3||type==7)awake.put(new JSONArray().put(stage.getStartTime().toEpochMilli()).put(stage.getEndTime().toEpochMilli()));}put(o,"awake",awake);arr.put(o);}emit(a,ticket,"sleep",arr);});
 if(allowed(a,"WEIGHT"))records(a,ticket,m,WeightRecord.class,window,rs->{JSONArray arr=new JSONArray();for(WeightRecord r:rs){JSONObject o=base(r,r.getTime(),r.getZoneOffset());put(o,"value",r.getWeight().getInGrams()/1000.0);arr.put(o);}emit(a,ticket,"weight",arr);});
 if(allowed(a,"NUTRITION"))records(a,ticket,m,NutritionRecord.class,window,rs->{JSONArray arr=new JSONArray();for(NutritionRecord r:rs){JSONObject o=base(r,r.getStartTime(),r.getStartZoneOffset());put(o,"note",r.getMealName()==null?"Nutrición importada":r.getMealName());if(r.getEnergy()!=null)put(o,"value",r.getEnergy().getInCalories()/1000.0);mass(o,"protein",r.getProtein(),1);mass(o,"carbs",r.getTotalCarbohydrate(),1);mass(o,"fat",r.getTotalFat(),1);JSONObject n=new JSONObject();mass(n,"fiber_g",r.getDietaryFiber(),1);mass(n,"sugar_g",r.getSugar(),1);mass(n,"sodium_mg",r.getSodium(),1000);mass(n,"potassium_mg",r.getPotassium(),1000);mass(n,"calcium_mg",r.getCalcium(),1000);mass(n,"iron_mg",r.getIron(),1000);mass(n,"magnesium_mg",r.getMagnesium(),1000);mass(n,"vitaminC_mg",r.getVitaminC(),1000);mass(n,"vitaminD_ug",r.getVitaminD(),1000000);mass(n,"vitaminB12_ug",r.getVitaminB12(),1000000);mass(n,"vitaminA_ug",r.getVitaminA(),1000000);mass(n,"vitaminE_mg",r.getVitaminE(),1000);mass(n,"vitaminB1_mg",r.getThiamin(),1000);mass(n,"vitaminB2_mg",r.getRiboflavin(),1000);mass(n,"vitaminB3_mg",r.getNiacin(),1000);mass(n,"vitaminB5_mg",r.getPantothenicAcid(),1000);mass(n,"vitaminB6_mg",r.getVitaminB6(),1000);mass(n,"biotin_ug",r.getBiotin(),1000000);mass(n,"folate_ug",r.getFolate(),1000000);mass(n,"zinc_mg",r.getZinc(),1000);mass(n,"manganese_mg",r.getManganese(),1000);mass(n,"copper_mg",r.getCopper(),1000);mass(n,"iodine_ug",r.getIodine(),1000000);mass(n,"chromium_ug",r.getChromium(),1000000);mass(n,"selenium_ug",r.getSelenium(),1000000);put(o,"nutrients",n);arr.put(o);}emit(a,ticket,"nutrition",arr);});
 if(allowed(a,"HYDRATION"))records(a,ticket,m,HydrationRecord.class,window,rs->{JSONArray arr=new JSONArray();for(HydrationRecord r:rs){JSONObject o=base(r,r.getStartTime(),r.getStartZoneOffset());put(o,"value",r.getVolume().getInLiters()*1000);arr.put(o);}emit(a,ticket,"hydration",arr);});
 if(!anyAllowed(a))a.status("Sin permisos de salud. Puedes autorizarlos desde Perfil → Datos de salud.");
 }
 static <T extends android.health.connect.datatypes.Record> void records(Main a,String ticket,HealthConnectManager m,Class<T> cls,TimeInstantRangeFilter range,Consumer<List<T>> done){readPage(a,ticket,m,cls,range,done,new ArrayList<T>(),-1L,0);}
 static <T extends android.health.connect.datatypes.Record> void readPage(Main a,String ticket,HealthConnectManager m,Class<T> cls,TimeInstantRangeFilter range,Consumer<List<T>> done,List<T> all,long token,int pages){
 if(a.isFinishing()||a.isDestroyed())return;
 if(pages>=20){error(a,ticket,recordType(cls),"Hay demasiados registros de salud. No se ha importado un resultado parcial.");return;}
 ReadRecordsRequestUsingFilters.Builder<T> builder=new ReadRecordsRequestUsingFilters.Builder<T>(cls).setTimeRangeFilter(range).setPageSize(500);
 if(token!=-1L)builder.setPageToken(token);
 try{m.readRecords(builder.build(),a.getMainExecutor(),new OutcomeReceiver<ReadRecordsResponse<T>,HealthConnectException>(){
 public void onResult(ReadRecordsResponse<T> r){if(a.isFinishing()||a.isDestroyed())return;for(T item:r.getRecords()){String client=item.getMetadata().getClientRecordId();if(client==null||!client.startsWith("vera23_"))all.add(item);}long next=r.getNextPageToken();if(next==-1L)done.accept(all);else if(next==token)error(a,ticket,recordType(cls),"No se pudo completar la lectura de salud.");else readPage(a,ticket,m,cls,range,done,all,next,pages+1);}
 public void onError(HealthConnectException e){error(a,ticket,recordType(cls),"No se pudo leer salud. No se han importado datos parciales.");}});
 }catch(Exception e){error(a,ticket,recordType(cls),"El permiso de salud ha cambiado. Revisa los permisos antes de reintentar.");}
 }
 static String recordType(Class<?> cls){if(cls==StepsRecord.class)return "steps";if(cls==ExerciseSessionRecord.class)return "workouts";if(cls==SleepSessionRecord.class)return "sleep";if(cls==WeightRecord.class)return "weight";if(cls==NutritionRecord.class)return "nutrition";if(cls==HydrationRecord.class)return "hydration";return "all";}
 static void error(Main a,String ticket,String type,String message){JSONObject row=new JSONObject();put(row,"type",type);put(row,"message",message);emit(a,ticket,"error",new JSONArray().put(row));a.status(message);}
 static void emit(Main a,String ticket,String type,JSONArray data){if(a.web==null||a.isFinishing()||a.isDestroyed())return;a.web.evaluateJavascript("healthImport21("+JSONObject.quote(ticket)+","+JSONObject.quote(type)+","+data.toString()+")",null);}
}
