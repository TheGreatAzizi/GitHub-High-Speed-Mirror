const CACHE_TTL = 31536000; // 1 Year

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    /* ================= UI ================= */
    if (url.pathname === "/") {
      return new Response(renderUI(url.origin), {
        headers: {
          "content-type": "text/html; charset=UTF-8",
          "x-content-type-options": "nosniff"
        }
      });
    }

    /* ================= META ================= */
    if (url.pathname === "/meta") {
      const raw = url.searchParams.get("url");
      if (!raw) return json({ error: true }, 400);

      try {
        const target = normalize(raw);
        const res = await fetch(target, { method: "HEAD", redirect: "follow" });

        return json({
          name: getFilename(target, res),
          size: Number(res.headers.get("content-length")) || null,
          type: detectType(target)
        });
      } catch {
        return json({ error: true }, 400);
      }
    }

    /* ================= PROXY ================= */
    const rawPath = decodeURIComponent(url.pathname.slice(1));
    if (!rawPath) return new Response("Bad Request", { status: 400 });

    let target;
    try {
      target = normalize(rawPath);
    } catch {
      return new Response("Invalid URL", { status: 400 });
    }

    const cache = caches.default;
    const cacheKey = new Request(url.toString(), request);

    /* ---------- Cache HIT ---------- */
    let cached = await cache.match(cacheKey);
    if (cached) {
      const h = new Headers(cached.headers);
      h.set("X-Worker-Cache", "HIT");
      return new Response(cached.body, {
        status: cached.status,
        headers: h
      });
    }

    /* ---------- Fetch from GitHub ---------- */
    const upstreamReq = new Request(target, {
      method: request.method,
      headers: {
        "User-Agent": "CF-GitHub-Mirror",
        "Range": request.headers.get("Range") || ""
      },
      redirect: "follow"
    });

    const upstreamRes = await fetch(upstreamReq);

    const headers = new Headers(upstreamRes.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("X-Worker-Cache", "MISS");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${getFilename(target, upstreamRes)}"`
    );

    if (upstreamRes.status === 200) {
      headers.set("Cache-Control", `public, max-age=${CACHE_TTL}`);
    }

    const response = new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers
    });

    if (upstreamRes.status === 200) {
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    }

    return response;
  }
};

/* ================= Helpers ================= */

function normalize(raw) {
  raw = decodeURIComponent(raw.trim());
  if (!/^https?:\/\//i.test(raw)) raw = "https://" + raw;

  const u = new URL(raw);
  const allowed = new Set([
    "github.com",
    "raw.githubusercontent.com",
    "objects.githubusercontent.com",
    "releases.githubusercontent.com"
  ]);

  if (!allowed.has(u.hostname))
    throw new Error("Invalid host");

  return u.href;
}

function getFilename(url, res) {
  const cd = res.headers.get("content-disposition");
  if (cd) {
    const m = cd.match(/filename="?([^"]+)"?/i);
    if (m) return m[1];
  }
  return url.split("/").pop() || "download";
}

function detectType(url) {
  if (url.includes("/releases/")) return "Release";
  if (url.includes("raw.githubusercontent.com")) return "Raw";
  if (/\.(zip|tar\.gz|rar|7z)$/i.test(url)) return "Archive";
  return "Other";
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store"
    }
  });
}

/* ================= UI ================= */

function renderUI(origin) {
  return `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GitHub Mirror</title>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://cdn.jsdelivr.net/gh/rastikerdar/pelak-font@v1.0.5/dist/font-face.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/gh/rastikerdar/morabba-font@v1.0.2/dist/font-face.css" rel="stylesheet">

<style>
:root{
  --bg:#0b0f1a;
  --card:#111827;
  --border:#1f2937;
  --text:#e5e7eb;
  --muted:#9ca3af;
  --primary:#8b5cf6;
  --accent:#22d3ee;
}

*{box-sizing:border-box}

body{
  margin:0;
  min-height:100dvh;
  background:
    radial-gradient(900px 400px at 80% -10%,rgba(139,92,246,.18),transparent),
    radial-gradient(700px 300px at 10% 110%,rgba(34,211,238,.14),transparent),
    var(--bg);
  display:flex;
  align-items:center;
  justify-content:center;
  padding:16px;
  font-family:Pelak,sans-serif;
  color:var(--text)
}

.card{
  width:100%;
  max-width:440px;
  background:linear-gradient(180deg,#111827,#0b1220);
  border:1px solid var(--border);
  border-radius:24px;
  padding:28px;
  box-shadow:0 40px 90px rgba(0,0,0,.65)
}

h1{
  font-family:Morabba,sans-serif;
  font-size:22px;
  text-align:center;
  margin:0 0 22px;
  background:linear-gradient(135deg,var(--primary),var(--accent));
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
}

input{
  width:100%;
  padding:16px;
  border-radius:16px;
  border:1px solid var(--border);
  background:#020617;
  color:var(--text);
  font-size:14px;
}
input:focus{
  outline:none;
  border-color:var(--primary);
  box-shadow:0 0 0 3px rgba(139,92,246,.18)
}

.meta{
  margin-top:14px;
  font-size:12px;
  color:var(--muted);
  min-height:18px
}

.actions{
  display:flex;
  gap:12px;
  margin-top:24px
}

button{
  flex:1;
  padding:14px;
  border-radius:16px;
  border:none;
  font-family:Pelak;
  font-size:13px;
  cursor:pointer;
}

.btn-copy{
  background:#020617;
  border:1px solid var(--border);
  color:var(--text)
}
.btn-copy:hover{border-color:var(--accent);color:var(--accent)}

.btn-download{
  background:linear-gradient(135deg,var(--primary),var(--accent));
  color:#020617;
  font-weight:600
}

footer{
  margin-top:20px;
  text-align:center;
  font-size:11px;
  color:#6b7280
}

@media (max-width:480px){
  .actions{flex-direction:column}
  h1{font-size:20px}
}
</style>
</head>

<body>
<div class="card">
  <h1>GitHub High-Speed Mirror</h1>

  <input id="link" placeholder="لینک GitHub را وارد کن">

  <div class="meta" id="meta"></div>

  <div class="actions">
    <button class="btn-copy" onclick="copyLink()">کپی لینک</button>
    <button class="btn-download" onclick="download()">دانلود</button>
  </div>

  <footer>github.com/TheGreatAzizi</footer>
</div>

<script>
const origin="${origin}";
const input=document.getElementById("link");
const meta=document.getElementById("meta");

input.addEventListener("change",async()=>{
  meta.textContent="در حال بررسی لینک...";
  try{
    const r=await fetch(origin+"/meta?url="+encodeURIComponent(input.value));
    const j=await r.json();
    meta.textContent="📦 "+j.name+" | "+(j.size?Math.round(j.size/1024/1024)+"MB":"?")+" | "+j.type;
  }catch{
    meta.textContent="لینک نامعتبر";
  }
});

function download(){
  if(!input.value)return;
  window.open(origin+"/"+encodeURIComponent(input.value));
}

function copyLink(){
  navigator.clipboard.writeText(origin+"/"+encodeURIComponent(input.value));
  meta.textContent="لینک کپی شد ✓";
}
</script>
</body>
</html>`;
}
