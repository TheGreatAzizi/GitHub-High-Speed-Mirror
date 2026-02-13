# 🚀 GitHub High-Speed Mirror

[![Cloudflare Workers](https://img.shields.io/badge/Platform-Cloudflare_Workers-F38020?logo=cloudflare)](https://workers.cloudflare.com)
![Repository Views](https://komarev.com/ghpvc/?username=TheGreatAzizi&repo=GitHub-High-Speed-Mirror&color=red)

**GitHub High-Speed Mirror** (v2) is an advanced, high-performance gateway built on Cloudflare Workers, designed to mirror GitHub assets at blazing fast speeds. Whether it's a heavy release binary or a raw source code, Mirror.PRO Max ensures low latency and high availability globally.

---

## ✨ Key Features

-   **⚡ Extreme Speed:** Leverages Cloudflare's global edge network to cache and stream GitHub assets.
-   **🔍 Live Metadata Inspector:** Real-time analysis of target URLs (Filename, Payload weight, Edge Latency, and File class).
-   **🎨 Premium UI:** Modern **Bento-style dashboard** with Glassmorphism, tailored with **Tailwind CSS**.
-   **💻 Automation Suite:** Automatically generates CLI commands for:
    -   **Bash (Linux/macOS):** `wget` with content-disposition support.
    -   **PowerShell (Windows):** Native `Invoke-WebRequest` snippets.
-   **🔗 Smart Link Normalizer:** Auto-converts GitHub blob URLs (Browser View) into Direct/Raw download links.
-   **📡 Live Process Log:** A simulated terminal interface for real-time status updates (Handshake, Meta Fetching, etc.).
-   **📦 High Caching Layer:** Enterprise-grade caching (1 year TTL) to ensure 0-latency repeated downloads.

---

## 🛠️ How to Deploy

Mirror.PRO Max is designed to run exclusively on **Cloudflare Workers**. Follow these simple steps:

1.  **Log in** to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2.  Go to **Workers & Pages** -> **Create Application**.
3.  Click **Create Worker** and give it a name (e.g., `github-mirror`).
4.  Copy the code from the `worker.js` file in this repository.
5.  Click **Edit Code**, paste the code, and hit **Save and Deploy**.
6.  *Optional:* Set up a custom domain in the **Settings -> Triggers** tab.

---

## 🎮 How to Use

1.  Paste any GitHub link (Release URL, Raw URL, or Repo Blob) into the search bar.
2.  Watch the **Metadata Inspector** and **Process Log** analyze the target.
3.  Click **Execute Download** to start streaming via our edge tunnel.
4.  Copy the generated **CLI Kits** to use them directly in your servers/terminals.

---

## 🧬 API Documentation

You can also use the Metadata API programmatically:

`GET /api/inspect?url=<YOUR_GITHUB_LINK>`

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "filename": "AZU-DL.zip",
    "size": "2.45 MB",
    "type": "Archive 📦",
    "latency": "142ms",
    "status": "Ready",
    "source": "https://raw.githubusercontent.com/..."
  }
}
```

---
## 👨‍💻 Developer & Support
This project is meticulously crafted by TheGreatAzizi. 
Stay updated and follow the progress through the links below:

Follow on X (Twitter): https://x.com/the_azzi

Version: 2
