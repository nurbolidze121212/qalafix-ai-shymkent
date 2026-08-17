type Env = {
  ASSETS: {
    fetch(request: Request): Promise<Response>
  }
}

export default {
  async fetch(request: Request, env: Env) {
    let response = await env.ASSETS.fetch(request)
    const acceptsHtml = request.headers.get('accept')?.includes('text/html')
    if (response.status === 404 && request.method === 'GET' && acceptsHtml) {
      const indexUrl = new URL('/index.html', request.url)
      response = await env.ASSETS.fetch(new Request(indexUrl, { headers: request.headers }))
    }
    if (!response.headers.get('content-type')?.includes('text/html')) return response

    const headers = new Headers(response.headers)
    headers.delete('content-length')
    const origin = new URL(request.url).origin
    const html = (await response.text()).replaceAll('__SITE_ORIGIN__', origin)
    return new Response(html, { status: response.status, statusText: response.statusText, headers })
  },
}
