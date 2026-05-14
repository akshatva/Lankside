"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { setDemoSession } from "@/lib/auth";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setError("Complete all fields to create your demo workspace.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password must match.");
      return;
    }

    setDemoSession({
      name: trimmedName,
      email: trimmedEmail,
    });

    router.push("/onboarding");
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <label className="block">
        <span className="text-sm font-medium text-white/78">Name</span>
        <input
          autoComplete="name"
          className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/15"
          onChange={(event) => setName(event.target.value)}
          placeholder="Founder name"
          type="text"
          value={name}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-white/78">Email</span>
        <input
          autoComplete="email"
          className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/15"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="founder@business.in"
          type="email"
          value={email}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-white/78">Password</span>
        <input
          autoComplete="new-password"
          className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/15"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Create demo password"
          type="password"
          value={password}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-white/78">Confirm password</span>
        <input
          autoComplete="new-password"
          className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/15"
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Repeat demo password"
          type="password"
          value={confirmPassword}
        />
      </label>

      {error ? (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <button
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-black shadow-lg transition hover:bg-white/90"
        type="submit"
      >
        Create account
        <ArrowRight className="size-4" aria-hidden="true" />
      </button>

      <p className="text-center text-sm text-white/58">
        Already have an account?{" "}
        <Link className="font-medium text-cyan-200 hover:text-white" href="/login">
          Login
        </Link>
      </p>
    </form>
  );
}
