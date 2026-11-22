/* Backgrounding is not logout. Revalidate the bearer without destroying drafts. */
let sessionResumeJob24=null,sessionResumeError24='';
function suspendSession24(){
 window.cancelHealthRead21?.();
 window.VeraSpeech14?.stop?.();
 if(typeof recording!=='undefined'&&recording?.state==='recording')recording.stop();
}
function rememberSession24(owner,token,remember=true){
 sessionStorage.veraKeepSession24=remember?'1':'0';
 if(!remember){window.VeraNative?.forgetLogin?.();return;}
 window.VeraNative?.persistSession24?.(owner,token);
}
async function resumeSession24(){
 if(sessionResumeJob24)return sessionResumeJob24;
 window.cancelHealthRead21?.();
 let owner=sessionStorage.veraUser,token=sessionStorage.veraToken;
 if(!token&&window.VeraNative?.restoreSession24){try{const remembered=JSON.parse(window.VeraNative.restoreSession24()||'null');if(remembered&&remembered.owner.startsWith(ACCOUNT_HOST+'/')&&/^[a-f0-9]{32}$/.test(remembered.owner.slice(ACCOUNT_HOST.length+1))&&/^[a-f0-9]{64}$/i.test(remembered.token)){owner=remembered.owner;token=remembered.token;sessionStorage.veraUser=owner;sessionStorage.veraToken=token;localStorage.veraRememberedUser=owner;s=loadVeraState(storageKey());}}catch{window.VeraNative?.forgetLogin?.();}}
 if(!owner||!token)return false;const state=s,wasValid=validSession;
 const active=()=>sessionStorage.veraUser===owner&&sessionStorage.veraToken===token&&s===state;
 const work=(async()=>{
  try{const response=await fetch(ACCOUNT_HOST+'/session',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:'{}',signal:AbortSignal.timeout(30000)});
   if(!active())return false;
   if(response.status===401){sessionStorage.removeItem('veraToken');window.VeraNative?.forgetLogin?.();validSession=false;sessionResumeError24='Tu sesión ha caducado. Vuelve a entrar.';render();msg(sessionResumeError24);return false;}
   if(!response.ok)throw Error('No se pudo comprobar la conexión. Conservamos tu sesión.');
   const account=await response.json();if(!active())return false;if(ACCOUNT_HOST+'/'+account.id!==owner)throw Error('El servidor no confirmó esta cuenta.');
   sessionResumeError24='';validSession=true;
   if(sessionStorage.veraKeepSession24!=='0')window.VeraNative?.persistSession24?.(owner,token);
   if(!wasValid){if(account.nick)s.profile.nick=account.nick;await VeraJournal.onSession();if(active())render();}
   if(active()){if(typeof refreshGoogle23==='function')await refreshGoogle23();if(typeof requestHealth21==='function')requestHealth21(false,true);}
   return true;
  }catch(error){if(active())sessionResumeError24=error.message;return false;}
 })();sessionResumeJob24=work;
 try{return await work;}finally{if(sessionResumeJob24===work)sessionResumeJob24=null;}
}
window.lockDiary=suspendSession24;window.openDiary=resumeSession24;
document.addEventListener('visibilitychange',()=>{if(document.hidden)suspendSession24();else resumeSession24();});
window.addEventListener('online',()=>resumeSession24());
if(window.VeraNative)queueMicrotask(resumeSession24);
