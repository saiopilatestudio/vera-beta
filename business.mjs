import { rows } from "./storage.mjs";
import { randomUUID, createHash, timingSafeEqual } from "node:crypto";
import { allowed } from "./owner.mjs";
const hash = (x) => createHash("sha256").update(x).digest();
export function adminAllowed(header) {
  return (
    !!process.env.VERA_ADMIN_SECRET &&
    timingSafeEqual(
      hash(header || ""),
      hash("Bearer " + process.env.VERA_ADMIN_SECRET),
    )
  );
}
export async function business(path, d, role=null) {
  if (!allowed(role, path)) throw Object.assign(Error("Acceso restringido."), {status:403});
  if (!d || typeof d !== "object" || Array.isArray(d)) throw Object.assign(Error("Solicitud no válida."), {status:422});
  const catalog = "Fichas técnicas de maquinaria con licencia independiente";
  if (path === "/admin/summary") {
    const { aiConfiguration } = await import('./ai-provider.mjs');
    const ai = aiConfiguration();
    return {
      operations:{build:"2.0.0-beta.1",database:"consulta completada",aiProviders:ai.providers,aiRoutes:ai.routes,aiExecution:ai.execution,localInference:false,placesConfigured:Boolean(process.env.GOOGLE_PLACES_KEY)},
      nickCount:(await rows("SELECT count(*) AS n FROM nicknames WHERE nick != 'vera_' || substr(uid,1,19)"))[0].n,
      rooms:await rows("SELECT state,count(*) AS n FROM partner_rooms GROUP BY state"),
      week:await rows("SELECT day,sum(n) AS n FROM quota WHERE day>=date('now','-6 days') GROUP BY day ORDER BY day"),
      accounts: (await rows("SELECT count(*) AS n FROM users"))[0].n,
      consultations: (
        await rows("SELECT coalesce(sum(n),0) AS n FROM quota")
      )[0].n,
      catalogItems: role==="analista"?[]:await rows(
        "SELECT brand,model,source,rights,created FROM catalog_items ORDER BY created DESC",
      ),
      deals: role==="propietario"?await rows("SELECT * FROM deals ORDER BY created DESC LIMIT 100"):[],
    };
  }
  if (path === "/admin/catalog") {
    let source;
    try { source = new URL(d.source); }
    catch { throw Object.assign(Error("Introduce una URL válida para la fuente."), {status:422}); }
    if (
      !["https:", "http:"].includes(source.protocol) ||
      source.username || source.password || source.href.length > 600 ||
      typeof d.brand !== "string" || !d.brand.trim() || d.brand.length > 120 ||
      typeof d.model !== "string" || !d.model.trim() || d.model.length > 150 ||
      !["Material propio", "Licencia comercial documentada"].includes(d.rights)
    )
      throw Object.assign(Error("Completa la ficha y sus derechos de uso."), {status:422});
    await rows(
      "INSERT INTO catalog_items VALUES(?,?,?,?,?,?)",
      randomUUID(),
      d.brand.trim(),
      d.model.trim(),
      source.href,
      d.rights,
      new Date().toISOString(),
    );
    return { ok: true };
  }
  if (path === "/admin/deal") {
    if (
      !["Compra", "Venta"].includes(d.direction) ||
      !["Prospecto", "En evaluación", "Acordado externamente"].includes(
        d.stage,
      ) ||
      typeof d.company !== "string" || !d.company.trim() || d.company.length > 120 ||
      !Number.isFinite(d.price) ||
      d.price < 0 || d.price > 1e12
    )
      throw Object.assign(Error("Revisa los datos de la operación."), {status:422});
    await rows(
      "INSERT INTO deals VALUES(?,?,?,?,?,?,?)",
      randomUUID(),
      d.direction,
      String(d.company).trim().slice(0, 120),
      catalog,
      d.stage,
      d.price,
      new Date().toISOString(),
    );
    return { ok: true };
  }
  if (path === "/admin/prospects") {
    throw Object.assign(Error("La búsqueda de organizaciones no está habilitada en VERA 2.0. No se han consultado ni generado prospectos."), {status:501,code:"PROSPECTS_UNAVAILABLE"});
  }
  throw Error("Acción desconocida.");
}
