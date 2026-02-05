export const M3u8ProxyV1 = async (request: Request) => {
  const reqUrl = new URL(request.url);

  const targetUrl = decodeURIComponent(reqUrl.searchParams.get("url") || "");
  const referer = decodeURIComponent(reqUrl.searchParams.get("referer") || "");
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

  // ---------- SEGMENT / KEY ----------
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
      "Accept-Ranges": "bytes",
    },
  });
};
