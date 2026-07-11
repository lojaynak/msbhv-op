import { LoginForm } from "./login-form";
import { SITE } from "@/config/site";

export default function LoginPage() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary-subtle text-sm font-semibold text-primary-strong">
          M
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">{SITE.name}</h1>
          <p className="text-sm text-muted-foreground">Sign in with your MSBHV account.</p>
        </div>
      </div>
      <LoginForm />
      <p className="text-center text-xs text-muted-foreground">
        No public sign-up — accounts are created by an admin. Contact your team lead for access.
      </p>
    </div>
  );
}
