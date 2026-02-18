export const M3u8ProxyV1 = async (request: Request) => {
  const reqUrl = new URL(request.url);

  const targetUrl = decodeURIComponent(reqUrl.searchParams.get("url") || "");
  const referer = decodeURIComponent(reqUrl.searchParams.get("referer") || "https://warpdooball.net/");
  const origin = decodeURIComponent(reqUrl.searchParams.get("origin") || "");
  const proxyAll = reqUrl.searchParams.get("all") === "yes";

  if (!targetUrl) {
    return new Response("Invalid URL", { status: 400 });
  }

  const upstream = await fetch(targetUrl, {
    headers: {
      ...(referer && { Referer: referer }),
      ...(origin && { Origin: origin }),
      "User-Agent": request.headers.get("user-agent") || "",
      ...(request.headers.get("range") && {
        Range: request.headers.get("range")!,
      }),
    },
  });

  const contentType =
    upstream.headers.get("content-type") || "";

  // ---------- M3U8 ----------
  if (contentType.includes("application/vnd.apple.mpegurl") || targetUrl.endsWith(".m3u8")) {
    const text = await upstream.text();
    const baseUrl = new URL(targetUrl);

    const rewritten = text
      .split("\n")
      .map((line) => {
        if (!line || line.startsWith("#")) return line;

        let absoluteUrl: string;

        if (line.startsWith("http")) {
          absoluteUrl = line;
        } else {
          absoluteUrl = new URL(line, baseUrl).toString();
        }

        const params = new URLSearchParams({
          url: absoluteUrl,
        });

        if (referer) params.set("referer", referer);
        if (origin) params.set("origin", origin);
        if (proxyAll) params.set("all", "yes");

        return `${reqUrl.origin}${reqUrl.pathname}?${params.toString()}`;
      })
      .join("\n");

    return new Response(rewritten, {
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  
// 2. Endpoint สำหรับ Proxy ไฟล์ Segment (.ts)
app.get('/proxy-segment', async (req, res) => {
    const { url } = req.query;
    try {
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Referer': 'https://olympic-embed.ais-vidnt.com' // ใส่ Header ตามที่ต้นทางต้องการ
            },
        });
const response = await axios.get(originalUrl);
        const baseUrl = originalUrl.substring(0, originalUrl.lastIndexOf("/") + 1);
        
        // Rewrite ทุกบรรทัดที่ไม่ใช่ # (Comment)
        const rewritten = response.data.replace(/^(?!#)(.*)$/gm, (line) => {
            if (!line.trim()) return line;
            const absoluteUrl = line.startsWith('http') ? line : baseUrl + line;
            // ส่งกลับมาที่ endpoint /proxy-segment ของเราเอง
            return `m3u8proxy.playidlive.workers.dev/proxy-segment?url=${encodeURIComponent(absoluteUrl)}`;
        });

        res.set('Content-Type', 'application/vnd.apple.mpegurl');
        res.send(rewritten);
    } catch (error) {
        res.status(500).send("Error generating playlist");
    },
});
        
        

// 2. Endpoint สำหรับ Proxy ไฟล์ Segment (.ts)
app.get('/proxy-segment', async (req, res) => {
    const { url } = req.query;
    try {
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Referer': 'https://olympic-embed.ais-vidnt.com' // ใส่ Header ตามที่ต้นทางต้องการ
            }
        });

        res.set('Content-Type', response.headers['content-type']);
        response.data.pipe(res); // ส่งข้อมูลแบบ Stream ประหยัด RAM
    } catch (error) {
        res.status(500).send("Error fetching segment");
    }
});

app.listen(5000, () => console.log('Backend Proxy running on port 5000'));
