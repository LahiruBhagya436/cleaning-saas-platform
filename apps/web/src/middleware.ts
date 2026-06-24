export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/book/:path*',
    '/admin/:path*',
    '/platform/:path*',
  ],
}
