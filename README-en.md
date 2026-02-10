# 🚀 GitHub High-Speed Mirror (Cloudflare Worker)

**GitHub High-Speed Mirror** is a Cloudflare Worker that generates direct and high-speed links to GitHub files.  
This service is ideal for developers and users who need to download files quickly, with resume support and long-term caching.

- [GitHub High-Speed Mirror](https://gitdl.theazizi.ir)

---

## 🌟 Features

- **Responsive & Modern**: Dark theme design with legible Persian fonts (Pelak & Morabba)  
- **Supports All File Types**: Releases, Raw files, archives (.zip, .tar.gz, .rar, .7z)  
- **High Speed & Long-Term Caching**: One-year caching on Cloudflare to boost download speed  
- **Resume Support**: Download large files without restarting  
- **Global Access**: CORS enabled, usable directly in browsers or external apps  
- **User-Friendly Interface**: Preview file details (name, size, type) before downloading  

---

## 🛠 Technologies

- **Cloudflare Workers** – for server-side execution  
- **HTML5 / CSS3 / Vanilla JS** – for a fast and responsive UI  
- **Pelak & Morabba Persian Fonts** – for readability and professional appearance  
- **CORS & Cache-Control** – for access management and high-speed delivery  

---

## ⚡ Usage

Create a Worker in your Cloudflare dashboard and paste the contents of `index.js`, then deploy it.  

Access your Worker via:

https://your-worker-domain.com/

> If you are in Iran, due to domain restrictions, you should use a subdomain of your own domain previously configured on Cloudflare instead of the default Worker domain.

Enter your GitHub link (Release or Raw):  

https://github.com/username/repo/releases/download/v1.0/app.zip

Use the buttons to **download directly** or **copy the fast link**.  

> The link generated through the Worker can be downloaded **with long-term caching and high speed**.

---

## 🔧 Customization

- **Change Colors & Theme**: Use CSS variables in `<style>`  
- **Change Persian Fonts**: Pelak & Morabba can be replaced with any preferred font  
- **Cache Duration**: Modify the `CACHE_TTL` value in `worker.js`  
- **Resume Support**: The `Range` header is handled for continuing large file downloads  

---

## 👤 Author

Made with ❤️ by **TheAzizi**  
https://x.com/the_azzi

---

## 🔗 Useful Links

- [Cloudflare](https://cloudflare.com/)
