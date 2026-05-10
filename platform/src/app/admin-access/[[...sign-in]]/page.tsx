import { SignIn } from "@clerk/nextjs";

export default function AdminSignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500">
            <span className="text-xl font-bold text-white">E</span>
          </div>
          <h1 className="text-lg font-semibold text-white">Platform Admin</h1>
          <p className="mt-1 text-sm text-gray-400">
            Restricted access area
          </p>
        </div>
        <SignIn fallbackRedirectUrl="/admin" />
      </div>
    </div>
  );
}
