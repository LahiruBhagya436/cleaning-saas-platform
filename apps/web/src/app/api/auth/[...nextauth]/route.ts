import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1'

// De-dupe concurrent refresh attempts for the same refresh token.
// The API rotates (deletes) the refresh token on use, so if two requests
// race to refresh with the same stale token, only the first succeeds and
// the second gets rejected — permanently breaking the session. Caching the
// in-flight (and briefly the resolved) promise per refresh-token value lets
// late-arriving callers reuse the same result instead of re-hitting the API.
const refreshCache = new Map<string, Promise<any>>()

function refreshAccessToken(oldRefreshToken: string) {
  let promise = refreshCache.get(oldRefreshToken)
  if (promise) return promise

  promise = axios.post(`${API_URL}/auth/refresh`, { refreshToken: oldRefreshToken })
    .then(({ data }) => data)
  refreshCache.set(oldRefreshToken, promise)

  // Keep the resolved/rejected result cached briefly so requests that were
  // already in-flight against the old token reuse it, then clean up.
  promise.finally(() => {
    setTimeout(() => refreshCache.delete(oldRefreshToken), 10_000)
  })

  return promise
}

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // The API host (Render free tier) spins down when idle, so the first
        // request after a while can take 8-15s to "cold start" and may fail
        // with a network error or 502/503 — NOT because the credentials are
        // wrong. Retry transient failures once before giving up, and throw a
        // distinguishable error (instead of returning null) so the login page
        // can tell "server waking up" apart from "wrong email or password".
        const attemptLogin = () =>
          axios.post(`${API_URL}/auth/login`, {
            email:    credentials.email,
            password: credentials.password,
          })

        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const { data } = await attemptLogin()
            if (data.success) {
              return {
                id:           data.data.user.id,
                email:        data.data.user.email,
                name:         data.data.user.fullName,
                role:         data.data.user.role,
                accessToken:  data.data.accessToken,
                refreshToken: data.data.refreshToken,
              }
            }
            // Backend responded but said no — that's a real "invalid credentials"
            return null
          } catch (err: any) {
            const status = err?.response?.status
            const isAuthRejection = status === 401 || status === 400 || status === 403
            if (isAuthRejection) {
              // Backend is up and explicitly rejected the credentials — don't retry
              return null
            }
            // Network error / timeout / 5xx — likely a cold start. Retry once
            // after a short delay before giving up.
            if (attempt === 0) {
              await new Promise((resolve) => setTimeout(resolve, 4000))
              continue
            }
          }
        }

        // Exhausted retries on a transient (non-auth) failure — surface a
        // distinguishable error so the UI shows "server waking up" instead of
        // "wrong email or password".
        throw new Error('ServerUnavailable')
      },
    }),
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign-in via Google: the Google provider only gives us the
      // user's id/email/name from their Google profile — it never talks to
      // our backend, so role/accessToken/refreshToken are missing. Exchange
      // the verified Google identity for real backend tokens here (the
      // backend finds-or-creates the user and returns the same shape /login
      // does), so a Google sign-in ends up with a working role + API tokens
      // just like a credentials sign-in.
      if (user && account?.provider === 'google') {
        try {
          const { data } = await axios.post(
            `${API_URL}/auth/oauth-google`,
            { email: user.email, fullName: user.name, googleId: account.providerAccountId },
            { headers: { 'x-internal-secret': process.env.INTERNAL_AUTH_SECRET } }
          )
          if (data.success) {
            token.id                 = data.data.user.id
            token.role               = data.data.user.role
            token.accessToken        = data.data.accessToken
            token.refreshToken       = data.data.refreshToken
            token.accessTokenExpires = Date.now() + (data.data.expiresIn ?? 900) * 1000
            return token
          }
        } catch {
          // Backend link failed — fall through with no role/tokens. The
          // role-gated layouts below now redirect rather than spin forever
          // when role is missing, and API calls will correctly 401 instead
          // of sending the literal string "undefined" as a bearer token.
        }
        token.error = 'OAuthBackendLinkError'
        return token
      }

      // Initial sign-in via credentials: store tokens + compute expiry
      if (user) {
        token.id              = user.id
        token.role             = (user as any).role
        token.accessToken      = (user as any).accessToken
        token.refreshToken     = (user as any).refreshToken
        token.accessTokenExpires = Date.now() + 900 * 1000 // matches API's expiresIn (15m)
        return token
      }

      // Subsequent requests: refresh the access token before it expires
      if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number) - 60_000) {
        return token
      }

      try {
        const data = await refreshAccessToken(token.refreshToken as string)
        if (data.success) {
          token.accessToken        = data.data.accessToken
          token.refreshToken       = data.data.refreshToken
          token.accessTokenExpires = Date.now() + (data.data.expiresIn ?? 900) * 1000
        }
      } catch {
        // Refresh failed (token revoked/expired) — clear so session() can signal re-login
        token.accessToken = undefined
        token.error = 'RefreshAccessTokenError'
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id           = token.id
        ;(session.user as any).role        = token.role
        ;(session as any).accessToken      = token.accessToken
        ;(session as any).refreshToken     = token.refreshToken
        ;(session as any).error            = token.error
      }
      return session
    },
  },

  pages: {
    signIn:  '/login',
    signOut: '/',
    error:   '/login',
  },

  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },

  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
