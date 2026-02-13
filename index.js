const CONFIG = {
  CDN_MAX_AGE: 31536000,
  SAFE_UA: "Mozilla/5.0 (MirrorPRO; Enterprise Gateway)",
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/inspect") {
      const target = url.searchParams.get("url");
      return handleInspection(target);
    }

    if (url.pathname === "/" || url.pathname === "") {
      return new Response(renderUI(url.origin), {
        headers: { "content-type": "text/html; charset=UTF-8" }
      });
    }

    const path = url.pathname.slice(1);
    if (path.includes("github")) {
      return handleProxy(request, decodeURIComponent(path), ctx);
    }

    return new Response("Unauthorized Entry", { status: 403 });
  }
};

async function handleInspection(rawUrl) {
  if (!rawUrl) return json({ success: false });
  try {
    const normalized = normalizeUrl(rawUrl);
    const start = Date.now();
    const res = await fetch(normalized, { 
      method: "HEAD", 
      headers: { "User-Agent": CONFIG.SAFE_UA },
      redirect: "follow" 
    });
    const sizeInBytes = res.headers.get("content-length");
    return json({
      success: true,
      data: {
        filename: getFilename(normalized, res),
        size: sizeInBytes ? formatBytes(sizeInBytes) : "Cloud Stream",
        type: identifyType(normalized, res.headers.get("content-type") || ""),
        latency: (Date.now() - start) + "ms",
        status: res.status === 200 ? "Ready" : "Linked",
        source: normalized
      }
    });
  } catch (e) { return json({ success: false, error: e.message }); }
}

async function handleProxy(request, targetUrl, ctx) {
  const normalized = normalizeUrl(targetUrl);
  const cache = caches.default;
  const cacheKey = new Request(normalized, request);
  let response = await cache.match(cacheKey);
  if (response) return response;

  const upRes = await fetch(normalized, { headers: { "User-Agent": CONFIG.SAFE_UA }, redirect: "follow" });
  const h = new Headers(upRes.headers);
  h.set("Access-Control-Allow-Origin", "*");
  h.set("Cache-Control", `public, max-age=${CONFIG.CDN_MAX_AGE}`);
  response = new Response(upRes.body, { status: upRes.status, headers: h });
  if (upRes.status === 200) ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

function normalizeUrl(u) {
  let l = u.trim().startsWith("http") ? u : "https://" + u;
  const o = new URL(l);
  if (o.hostname === "github.com" && o.pathname.includes("/blob/")) {
    o.hostname = "raw.githubusercontent.com";
    o.pathname = o.pathname.replace("/blob/", "/");
  }
  return o.href;
}

function getFilename(u, res) {
  const cd = res.headers.get("content-disposition");
  if (cd?.includes("filename=")) return cd.split("filename=")[1].replace(/"/g, "");
  return u.split("/").pop().split("?")[0] || "download";
}

function identifyType(url, mime) {
  if (/\.(zip|gz|rar|7z)$/.test(url)) return "Archive 📦";
  if (/\.(exe|msi|dmg)$/.test(url)) return "Executable 💿";
  return "Binary File 📁";
}

function formatBytes(b) {
  if (b == 0) return '0 B';
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return parseFloat((b / Math.pow(1024, i)).toFixed(2)) + ' ' + ['B', 'KB', 'MB', 'GB'][i];
}

const json = (d) => new Response(JSON.stringify(d), { headers: { "content-type": "application/json" } });

/* ================= UI TEMPLATE ================= */

function renderUI(origin) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GitHub High-Speed Mirror</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono&family=Outfit:wght@300;600;800&display=swap" rel="stylesheet">
    <style>
        :root { --p: #6366f1; --bg: #030407; }
        body { background: var(--bg); color: #fff; font-family: 'Outfit', sans-serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .bento { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 24px; transition: 0.3s; }
        .bento:hover { border-color: var(--p); background: rgba(255,255,255,0.05); }
        .cli-box { white-space: nowrap; overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; }
        .cli-box::-webkit-scrollbar { height: 2px; }
        .cli-box::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .pulse { animation: pulse 2s infinite; }
    </style>
</head>
<body class="p-4 md:p-12 flex flex-col items-center min-h-screen">

    <div class="max-w-4xl w-full space-y-6">
        <!-- TOP BRANDING -->
        <header class="flex justify-between items-center mb-10">
            <div>
                <h1 class="text-3xl font-extrabold tracking-tighter">GHS Mirror<span class="text-indigo-500">V2</span></h1>
                <p class="text-slate-500 font-bold text-[10px] tracking-widest uppercase mt-1">GitHub High-Speed Mirror</p>
            </div>
            <div class="hidden md:block bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full text-indigo-400 text-xs font-bold uppercase tracking-widest">
                <span class="status-dot bg-green-500 pulse"></span> System Online
            </div>
        </header>

        <!-- MAIN PANEL -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div class="md:col-span-12 bento p-8 space-y-6 shadow-xl shadow-indigo-500/5">
                <div class="relative group">
                    <label class="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-2 mb-2 block">GitHub Destination URL</label>
                    <input type="text" id="urlInput" placeholder="https://github.com/..." 
                           class="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 outline-none focus:border-indigo-500/50 transition-all text-sm mono">
                </div>
                <div class="flex flex-wrap gap-4">
                    <button onclick="handleAction('dl')" class="flex-1 bg-white text-black font-black py-4 rounded-xl hover:bg-slate-200 transition text-xs uppercase tracking-widest">Execute Download</button>
                    <button onclick="handleAction('cp')" class="px-8 glass bg-white/5 font-bold py-4 rounded-xl hover:bg-white/10 transition text-xs uppercase">Get Mirror Link</button>
                </div>
            </div>

            <div id="fileInfo" class="hidden md:col-span-8 bento p-6 grid grid-cols-2 gap-6 animate-in fade-in duration-500">
                <div class="space-y-1"><h4 class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Name</h4><p id="fName" class="text-xs font-bold truncate text-slate-200">--</p></div>
                <div class="space-y-1"><h4 class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Edge Latency</h4><p id="fLat" class="text-xs font-bold text-green-400 mono">--</p></div>
                <div class="space-y-1"><h4 class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Weight</h4><p id="fSize" class="text-xs font-bold text-indigo-400">--</p></div>
                <div class="space-y-1"><h4 class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Class</h4><p id="fType" class="text-xs font-bold text-slate-200">--</p></div>
            </div>

            <div id="logBox" class="md:col-span-4 bento p-6 flex flex-col justify-center min-h-[140px]">
                <div class="flex justify-between items-center mb-4">
                   <span class="text-[9px] font-bold text-slate-600 uppercase">Process Log</span>
                   <span class="text-[9px] text-green-500 font-bold uppercase italic underline">READY</span>
                </div>
                <div id="logs" class="text-[9px] mono text-slate-500 space-y-2 leading-relaxed h-[60px] overflow-hidden">
                    <p>> Standby...</p>
                </div>
            </div>
        </div>
        
        <!-- AUTOMATION CLIPS (FIXED VERSION) -->
        <div id="automation" class="hidden animate-in slide-in-from-top-4 duration-500 bento p-8 space-y-6 overflow-hidden">
            <h3 class="text-xs font-bold flex items-center gap-2 tracking-widest text-slate-400"><span class="w-1 h-3 bg-indigo-500 rounded-full"></span> AUTOMATION SUITE</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
               <!-- Curl/Wget -->
               <div class="bg-black/50 border border-white/5 p-4 rounded-2xl relative group overflow-hidden">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-[9px] text-slate-500 font-bold uppercase">Bash Terminal</span>
                    <button onclick="copyTo('bashCode')" class="text-[9px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition uppercase">Copy</button>
                  </div>
                  <div class="cli-box">
                    <code id="bashCode" class="text-[10px] mono text-indigo-300">...</code>
                  </div>
               </div>
               <!-- PS -->
               <div class="bg-black/50 border border-white/5 p-4 rounded-2xl relative group overflow-hidden">
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-[9px] text-slate-500 font-bold uppercase">PowerShell</span>
                    <button onclick="copyTo('psCode')" class="text-[9px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition uppercase">Copy</button>
                  </div>
                  <div class="cli-box">
                    <code id="psCode" class="text-[10px] mono text-cyan-400">...</code>
                  </div>
               </div>
            </div>
        </div>

        <!-- NEW FOOTER -->
        <footer class="mt-20 py-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60 hover:opacity-100 transition duration-500">
            <p class="text-[10px] font-bold tracking-[0.2em] text-slate-600 uppercase italic underline decoration-slate-800 underline-offset-8">Enterprise Data Tunnel v3.2</p>
            <div class="flex items-center gap-6">
                <a href="https://github.com/TheGreatAzizi/GitHub-High-Speed-Mirror" target="_blank" class="text-[10px] font-bold flex items-center gap-1.5 hover:text-indigo-400 transition uppercase tracking-widest">
                    <span>GitHub Repo</span>
                </a>
                <a href="https://x.com/the_azzi_" target="_blank" class="text-[10px] font-bold flex items-center gap-1.5 hover:text-indigo-400 transition uppercase tracking-widest">
                    <span>Follow Developer</span>
                </a>
            </div>
        </footer>

    </div>

    <script>
        const API = window.location.origin;
        const input = document.getElementById('urlInput');
        
        function logMsg(m) {
            const l = document.getElementById('logs');
            l.innerHTML = \`<p class="animate-in slide-in-from-left">>> \${m}</p>\` + l.innerHTML;
        }

        input.addEventListener('input', async (e) => {
            const url = e.target.value.trim();
            if(!url.includes('github')) return;

            logMsg("Target validation in progress...");
            const res = await fetch(\`\${API}/api/inspect?url=\${encodeURIComponent(url)}\`);
            const json = await res.json();

            if(json.success) {
                const d = json.data;
                document.getElementById('fileInfo').classList.remove('hidden');
                document.getElementById('automation').classList.remove('hidden');
                document.getElementById('fName').innerText = d.filename;
                document.getElementById('fLat').innerText = d.latency;
                document.getElementById('fSize').innerText = d.size;
                document.getElementById('fType').innerText = d.type;

                logMsg("Handshake successful. Link active.");
                
                const finalUrl = \`\${API}/\${encodeURIComponent(d.source)}\`;
                document.getElementById('bashCode').innerText = \`wget --content-disposition "\${finalUrl}"\`;
                document.getElementById('psCode').innerText = \`Invoke-WebRequest -Uri "\${finalUrl}" -OutFile "\${d.filename}"\`;
            } else {
                logMsg("CRITICAL: Failed to inspect headers.");
            }
        });

        function handleAction(mode) {
            const url = input.value.trim();
            if(!url) return;
            const final = \`\${API}/\${encodeURIComponent(url)}\`;
            if(mode === 'dl') {
                logMsg("Initiating payload stream...");
                window.location.href = final;
            } else {
                navigator.clipboard.writeText(final);
                alert("Copied to clipboard!");
            }
        }

        function copyTo(id) {
            const t = document.getElementById(id).innerText;
            navigator.clipboard.writeText(t);
            alert("CLI Command Copied!");
        }
    </script>
</body>
</html>`;
}
