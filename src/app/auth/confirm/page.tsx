/**
 * @file This page is displayed to the user after they have successfully
 * signed up for an account. It instructs them to check their email for a
 * confirmation link to complete the registration process.
 */
export default function ConfirmPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center space-y-6 rounded-lg bg-card p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Check your email</h1>
          <p className="text-muted-foreground">
            We&apos;ve sent a confirmation link to your email address. Please
            click the link to complete your registration.
          </p>
        </div>
      </div>
    </div>
  );
} 