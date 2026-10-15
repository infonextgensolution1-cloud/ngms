/**
 * Authenticator assurance level ("aal1" = password only, "aal2" = password + code) from a
 * Supabase access token. Only call this on a token that was already verified with
 * supabase.auth.getUser(token): the payload is read, not signature-checked, here.
 */
export function jwtAal(token: string): string {
  try {
    const payload = token.split('.')[1]
    if (!payload) return ''
    const json = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'))
    return typeof json.aal === 'string' ? json.aal : ''
  } catch {
    return ''
  }
}

export const MFA_REQUIRED_MESSAGE = 'Enter your two-step login code on /admin first.'
