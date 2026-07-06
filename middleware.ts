import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    // Lindungi semua route kecuali root (/), login, api auth, api cron, static files
    "/((?!$|login|api/auth|api/cron|_next/static|_next/image|favicon.ico).*)",
  ],
};
