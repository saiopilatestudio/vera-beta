import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
import {ownerLogin,ownerSession,ownerLogout,allowed,ownerCookie} from "../owner.mjs";
for(const [i,pair] of [["OWNER","propietario"],["EDITOR","editor"],["ANALYST","analista"]].entries()){
 const [prefix,role]=pair,email=prefix+"@example.invalid",password=randomBytes(20).toString("hex");
 process.env["VERA_"+prefix+"_EMAIL"]=email;process.env["VERA_"+prefix+"_PASSWORD"]=password;
 const out=await ownerLogin({email,password},"qa"+i);
 const req={headers:{host:"localhost",cookie:"vera_admin="+out.token}};
 assert.equal(ownerSession(req),null);req.headers["x-vera-csrf"]=out.csrf;
 const s=ownerSession(req);assert.equal(s.role,role);assert(allowed(role,"/admin/summary"));assert.equal(allowed(role,"/admin/deal"),i===0);assert.equal(allowed(role,"/admin/catalog"),i<2);
 assert.match(ownerCookie(req,out.token),/HttpOnly/);ownerLogout(s);assert.equal(ownerSession(req),null);
}
console.log("OK: tres roles, cierre de sesión y CSRF.");
