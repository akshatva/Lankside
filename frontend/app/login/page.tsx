import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back to Lankside"
      subtitle="Continue your MSME readiness workflow."
      footer="Use demo credentials to continue. This build does not verify real passwords."
    >
      <LoginForm />
    </AuthCard>
  );
}
