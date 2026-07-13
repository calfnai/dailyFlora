async function fetchStaticAsset(request, env) {
  const response = await env.ASSETS.fetch(request);
  if (response.status !== 404 || (request.method !== 'GET' && request.method !== 'HEAD')) {
    return response;
  }

  const url = new URL(request.url);
  const lastSegment = url.pathname.split('/').pop() || '';
  if (lastSegment.includes('.')) return response;

  url.pathname = `${url.pathname.replace(/\/$/, '')}/index.html`;
  return env.ASSETS.fetch(new Request(url, request));
}

export default {
  fetch(request, env) {
    return fetchStaticAsset(request, env);
  }
};
