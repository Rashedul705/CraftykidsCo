export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 1. Strict security & environment validation on server start
    try {
      const { validateServerSecurityEnv } = await import('@/lib/config');
      validateServerSecurityEnv();
    } catch (err: any) {
      console.error(err?.message || err);
      // Abort server startup immediately on fatal configuration error
      throw err;
    }

    // 2. Verify SMTP connection on server start
    try {
      const { verifySmtpConnection } = await import('@/lib/mailer');
      await verifySmtpConnection();
    } catch (err: any) {
      console.warn('[Server Start] Mailer verification notice:', err?.message || err);
    }
  }
}
