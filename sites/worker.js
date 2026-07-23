const gestureAssetOrigin = 'https://daily-flora-git-codex-dailyflora-integration-calfnais-projects.vercel.app';

async function fetchStaticAsset(request, env) {
  const response = await env.ASSETS.fetch(request);
  if (response.status !== 404 || (request.method !== 'GET' && request.method !== 'HEAD')) {
    return response;
  }

  const url = new URL(request.url);
  if (url.pathname.startsWith('/mediapipe/') || url.pathname.startsWith('/models/')) {
    const fallbackUrl = new URL(url.pathname, gestureAssetOrigin);
    const fallbackResponse = await fetch(new Request(fallbackUrl, request));
    if (fallbackResponse.ok) return fallbackResponse;
  }

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
