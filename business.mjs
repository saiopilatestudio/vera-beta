import { rows } from "./storage.mjs";
import { randomUUID, createHash, timingSafeEqual } from "node:crypto";
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
export async function business(path, d, role="propietario") {
  const catalog = "Fichas técnicas de maquinaria con licencia independiente";
  if (path === "/admin/summary")
    return {
      operations:{build:"1.0.3-beta",database:"consulta completada",openAIConfigured:Boolean(process.env.OPENAI_API_KEY),placesConfigured:Boolean(process.env.GOOGLE_PLACES_KEY)},
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
  if (path === "/admin/catalog") {
    const source = new URL(d.source);
    if (
      !["https:", "http:"].includes(source.protocol) ||
      !d.brand?.trim() ||
      !d.model?.trim() ||
      !["Material propio", "Licencia comercial documentada"].includes(d.rights)
    )
      throw Error("Completa la ficha y sus derechos de uso.");
    await rows(
      "INSERT INTO catalog_items VALUES(?,?,?,?,?,?)",
      randomUUID(),
      d.brand.slice(0, 120),
      d.model.slice(0, 150),
      source.href.slice(0, 600),
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
      !String(d.company || "").trim() ||
      !Number.isFinite(d.price) ||
      d.price < 0
    )
      throw Error("Revisa los datos de la operación.");
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
    if (!process.env.OPENAI_API_KEY)
      throw Error(
        "Activa el proveedor de búsqueda para localizar organizaciones.",
      );
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.OPENAI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.VERA_SEARCH_MODEL || "gpt-4.1-mini",
        tools: [{ type: "web_search_preview" }],
        tool_choice: "required",
        input:
          "Busca 4 organizaciones europeas de equipamiento de gimnasio o software de inventario que puedan licenciar o adquirir catálogos técnicos de máquinas. Da nombre, web oficial y razón de encaje. Diferencia claramente una hipótesis de un interés confirmado. Solo información corporativa pública, sin nombres de personas ni datos de usuarios. Cita la fuente de cada empresa.",
      }),
      signal: AbortSignal.timeout(60000),
    });
    if (!r.ok) throw Error("Búsqueda no disponible.");
    const body = await r.json();
    return {
      text: (body.output || [])
        .flatMap((x) => x.content || [])
        .map((x) => x.text || "")
        .join("\n"),
    };
  }
  throw Error("Acción desconocida.");
}
