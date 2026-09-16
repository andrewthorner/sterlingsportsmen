export async function onRequest(context) {
  const response = await context.next();

  if (response.status === 404) {
    const shellUrl = new URL(context.request.url);
    shellUrl.pathname = "/index.html";
    return context.next(new Request(shellUrl, context.request));
  }

  return response;
}
