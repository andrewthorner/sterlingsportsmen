export async function onRequest(context) {
  let response;
  let nextError = null;

  try {
    response = await context.next();
  } catch (err) {
    nextError = err;
  }

  if (nextError || response.status === 404) {
    try {
      const shellUrl = new URL(context.request.url);
      shellUrl.pathname = "/index.html";
      return await context.env.ASSETS.fetch(new Request(shellUrl, context.request));
    } catch (fallbackError) {
      const detail =
        "next() error: " +
        (nextError ? (nextError.stack || String(nextError)) : "none, status was " + response.status) +
        "\n\nASSETS.fetch error: " +
        (fallbackError.stack || String(fallbackError));

      return new Response(detail, {
        status: 500,
        headers: { "content-type": "text/plain" },
      });
    }
  }

  return response;
}
