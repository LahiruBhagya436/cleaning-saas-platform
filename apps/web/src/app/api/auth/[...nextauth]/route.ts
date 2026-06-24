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

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        try {
          const { data } = await axios.post(`${API_URL}/auth/login`, {
            email:    credentials.email,
            password: credentials.password,
          })
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
          return null
        } catch {
          return null
        }
      },
    }),
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // Initial sign-in: store tokens + compute access-token expiry
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
