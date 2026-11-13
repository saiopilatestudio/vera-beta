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
export async function business(path, d) {
  const catalog = "Fichas técnicas de maquinaria con licencia independiente";
  if (path === "/admin/summary")
    return {
      accounts: (await rows("SELECT count(*) AS n FROM users"))[0].n,
      consultations: (
        await rows("SELECT coalesce(sum(n),0) AS n FROM quota")
      )[0].n,
      deals: await rows("SELECT * FROM deals ORDER BY created DESC LIMIT 100"),
    };
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
