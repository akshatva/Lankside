import { AuthCard } from "@/components/auth/auth-card";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <AuthCard
      title="Create your Lankside workspace"
      subtitle="Start by setting up your MSME profile and readiness workflow."
      footer="Your demo session stays in this browser only."
    >
      <SignupForm />
    </AuthCard>
  );
}
