"use client";
import { RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components";

export default function SignUp() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Create an Account</h1>
        <RegisterLink className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
          Sign up
        </RegisterLink>
      </div>
    </div>
  );
} 