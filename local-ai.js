import { Wllama } from "@wllama/wllama";
const modelURL =
  "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf";
let ready;
async function engine(status) {
  const ai = new Wllama(
    { "single-thread/wllama.wasm": new URL("local.wasm", location.href).href },
    { suppressNativeLog: true },
  );
  await ai.loadModelFromUrl(modelURL, {
    n_threads: 1,
    n_ctx: 1536,
    n_batch: 64,
    progressCallback: ({ loaded, total }) =>
      status(
        total
          ? "Modelo local · " + Math.round((loaded / total) * 100) + " %"
          : "Descargando IA local…",
      ),
  });
  return ai;
}
window.veraGenerate = async function (question, context, status) {
  if (!ready)
    ready = engine(status).catch((e) => {
      ready = null;
      throw e;
    });
  const ai = await ready;
  status("Vera está redactando…");
  const messages = [
    {
      role: "system",
      content:
        "Responde en español como asistente de entrenamiento. Sé breve y concreto. Solo orientación general. No diagnostiques ni prescribas. No inventes resultados del usuario. Si falta información, pregunta. Datos declarados: " +
        context.slice(0, 1600),
    },
    { role: "user", content: question.slice(0, 1700) },
  ];
  return ai.createChatCompletion(messages, {
    nPredict: 180,
    sampling: { temp: 0.35 },
    stream: false,
  });
};
