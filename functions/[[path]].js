export async function onRequest(context) {
  const response = await context.next();

  if (response.status === 404) {
    const shellUrl = new URL(context.request.url);
    shellUrl.pathname = "/index.html";
    return context.env.ASSETS.fetch(new Request(shellUrl, context.request));
  }

  return response;
}
