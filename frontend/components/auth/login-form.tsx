"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { setDemoSession } from "@/lib/auth";

function getNameFromEmail(email: string) {
  const name = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();

  if (!name) {
    return "Lankside User";
  }

  return name.replace(/\b\w/g, (character) => character.toUpperCase());
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError("Enter your email and password to continue.");
      return;
    }

    setDemoSession({
      name: getNameFromEmail(trimmedEmail),
      email: trimmedEmail,
    });

    router.push("/onboarding");
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
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
          autoComplete="current-password"
          className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/15"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter demo password"
          type="password"
          value={password}
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
        Login
        <ArrowRight className="size-4" aria-hidden="true" />
      </button>

      <p className="text-center text-sm text-white/58">
        New to Lankside?{" "}
        <Link className="font-medium text-cyan-200 hover:text-white" href="/signup">
          Create account
        </Link>
      </p>
    </form>
  );
}
