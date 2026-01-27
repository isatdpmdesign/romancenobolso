Deno.serve(async (req) => {
  try {
    // Cloudflare/Deno Deploy fornecem o país via header
    const country = req.headers.get('CF-IPCountry') || 
                    req.headers.get('X-Vercel-IP-Country') ||
                    req.headers.get('CloudFront-Viewer-Country') ||
                    'UNKNOWN';
    
    console.log('[Country Check]', { country, ip: req.headers.get('CF-Connecting-IP') });
    
    return Response.json({
      country,
      allowed: country === 'BR' || country === 'UNKNOWN' // Permite desconhecidos por segurança
    });
  } catch (error) {
    console.error('[Country Check Error]', error);
    return Response.json({ 
      country: 'UNKNOWN', 
      allowed: true // Em caso de erro, permite acesso
    }, { status: 500 });
  }
});