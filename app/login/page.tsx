// app/login/page.tsx
import { Suspense } from "react";
import LoginForm from "./login-form";

// Loading component para o Suspense
function LoginLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">Grão.</h1>
        </div>
        <div className="rounded-3xl p-6 shadow-2xl backdrop-blur-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-700 rounded-full"></div>
            <div className="h-12 bg-gray-700 rounded-xl"></div>
            <div className="h-12 bg-gray-700 rounded-xl"></div>
            <div className="h-12 bg-[#00D9A3]/20 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
