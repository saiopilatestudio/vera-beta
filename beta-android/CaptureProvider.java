package app.vera.coach.beta;
import android.content.*;import android.net.Uri;import android.database.Cursor;import android.database.MatrixCursor;import android.os.ParcelFileDescriptor;import android.provider.OpenableColumns;import java.io.*;
public class CaptureProvider extends ContentProvider{
 public boolean onCreate(){return true;}
 private File file(Uri uri){if(!"/machine.jpg".equals(uri.getPath()))throw new IllegalArgumentException();return new File(getContext().getCacheDir(),"vera-camera.jpg");}
 public ParcelFileDescriptor openFile(Uri uri,String mode)throws FileNotFoundException{return ParcelFileDescriptor.open(file(uri),ParcelFileDescriptor.parseMode(mode));}
 public String getType(Uri uri){return "image/jpeg";}
 public Cursor query(Uri uri,String[] cols,String sel,String[] args,String sort){if(cols==null)cols=new String[]{OpenableColumns.DISPLAY_NAME,OpenableColumns.SIZE};MatrixCursor c=new MatrixCursor(cols);Object[] v=new Object[cols.length];for(int i=0;i<cols.length;i++){if(OpenableColumns.DISPLAY_NAME.equals(cols[i]))v[i]="maquina.jpg";if(OpenableColumns.SIZE.equals(cols[i]))v[i]=file(uri).length();}c.addRow(v);return c;}
 public Uri insert(Uri u,ContentValues v){throw new UnsupportedOperationException();}public int delete(Uri u,String s,String[] a){throw new UnsupportedOperationException();}public int update(Uri u,ContentValues v,String s,String[] a){throw new UnsupportedOperationException();}
}
