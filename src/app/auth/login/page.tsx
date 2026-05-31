// auth/login/page.tsx
"use client";
import {supabase} from "../../../lib/supabase"

export default function LoginPage() {
  const handleGoogleLogin = async () => {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Once authorized, Google will drop the user off at this loading pipeline route
          redirectTo: 'http://localhost:3000/auth/callback-loading', 
        },
      });
    };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-950">
      <div className="card w-full max-w-sm shadow-2xl">
        {/* Logo area */}
        <div className="text-center pb-6">
          <h1 className="font-serif text-5xl leading-tight text-blue-950 -tracking-widest">cookie<br />krave</h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">Order Management System</p>
        </div>

        <hr className="border-none border-t-2 border-amber-50 mb-6" />

        <div className="flex flex-col gap-4 items-center">
          <p className="text-sm text-blue-950 font-medium">Sign in to manage orders</p>

          <button
            onClick={handleGoogleLogin}
            className="flex items-center gap-2.5 px-5 py-2.5 border-2 border-amber-50 rounded-lg bg-white text-sm font-medium hover:bg-slate-50 transition-colors w-full justify-center font-sans text-blue-950"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="text-xs text-slate-500 text-center leading-relaxed">
            Only authorized accounts can access the admin dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}

// ! POTA HHAHAHAHHAHA
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
    </svg>
  );
}
