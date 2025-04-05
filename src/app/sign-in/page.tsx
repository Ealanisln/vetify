"use client";
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";

export default function SignIn() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome to Vetify</h1>
        <LoginLink className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
          Sign in
        </LoginLink>
      </div>
    </div>
  );
} 