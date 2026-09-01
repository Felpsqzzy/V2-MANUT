type GraphConfig = { tenantId: string; clientId: string; clientSecret: string; senderEmail: string };

function config(): GraphConfig | null {
  const tenantId = process.env.MS_TENANT_ID || process.env.MICROSOFT_TENANT_ID || '';
  const clientId = process.env.MS_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID || '';
  const clientSecret = process.env.MS_CLIENT_SECRET || process.env.MICROSOFT_CLIENT_SECRET || '';
  const senderEmail = process.env.GRAPH_SENDER_EMAIL || process.env.MICROSOFT_GRAPH_SENDER_EMAIL || '';
  return tenantId && clientId && clientSecret && senderEmail ? { tenantId, clientId, clientSecret, senderEmail } : null;
}

let tokenCache: { accessToken: string; expiresAt: number } | null = null;

async function getToken(cfg: GraphConfig): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.accessToken;
  const body = new URLSearchParams({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });
  const response = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(cfg.tenantId)}/oauth2/v2.0/token`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body
  });
  if (!response.ok) throw new Error(`Microsoft token error ${response.status}: ${await response.text()}`);
  const data = await response.json() as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error('Microsoft não retornou access_token.');
  tokenCache = { accessToken: data.access_token, expiresAt: Date.now() + (Number(data.expires_in || 3600) * 1000) };
  return data.access_token;
}

export function graphEmailConfigured(): boolean { return Boolean(config()); }

export async function sendGraphMail(input: { to: string; subject: string; bodyText: string }): Promise<void> {
  const cfg = config();
  if (!cfg) throw new Error('Microsoft Graph não configurado no ambiente.');
  const accessToken = await getToken(cfg);
  const response = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(cfg.senderEmail)}/sendMail`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        subject: input.subject,
        body: { contentType: 'Text', content: input.bodyText },
        toRecipients: [{ emailAddress: { address: input.to } }]
      },
      saveToSentItems: true
    })
  });
  if (!response.ok) throw new Error(`Microsoft Graph sendMail error ${response.status}: ${await response.text()}`);
}
