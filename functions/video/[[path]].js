// Отдаёт видео из /video/ кусками (HTTP Range, ответ 206).
// Cloudflare Pages сам отдаёт файлы только целиком — тогда iPhone (Safari) не запускает
// видео, а на других телефонах его нельзя перемотать, пока файл не скачается полностью.

export async function onRequest({ request, env }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  }

  const asset = await env.ASSETS.fetch(new Request(request.url, { headers: { 'Accept-Encoding': 'identity' } }));
  const size = Number(asset.headers.get('Content-Length'));
  const headers = new Headers(asset.headers);
  headers.set('Accept-Ranges', 'bytes');

  const range = parseRange(request.headers.get('Range'), size);
  if (!asset.ok || !asset.body || !Number.isFinite(size) || range === null) {
    return new Response(request.method === 'HEAD' ? null : asset.body, { status: asset.status, headers });
  }
  if (range === 'invalid') {
    asset.body.cancel();
    headers.set('Content-Range', `bytes */${size}`);
    headers.delete('Content-Length');
    return new Response(null, { status: 416, headers });
  }

  const { start, end } = range;
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  headers.set('Content-Length', String(end - start + 1));
  if (request.method === 'HEAD') {
    asset.body.cancel();
    return new Response(null, { status: 206, headers });
  }
  return new Response(slice(asset.body, start, end), { status: 206, headers });
}

// "bytes=100-199", "bytes=100-", "bytes=-500" → { start, end }; нет заголовка → null
function parseRange(value, size) {
  if (!value) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!m || (m[1] === '' && m[2] === '')) return 'invalid';
  let start, end;
  if (m[1] === '') {
    start = Math.max(0, size - Number(m[2]));
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (start > end || start >= size) return 'invalid';
  return { start, end };
}

// Пропускает байты до start, отдаёт до end включительно и прекращает чтение файла
function slice(body, start, end) {
  const reader = body.getReader();
  let pos = 0;
  return new ReadableStream({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) return controller.close();
        const from = pos;
        pos += value.byteLength;
        if (pos <= start) continue;
        controller.enqueue(value.subarray(Math.max(0, start - from), Math.min(value.byteLength, end + 1 - from)));
        if (pos > end) {
          reader.cancel();
          controller.close();
        }
        return;
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}
