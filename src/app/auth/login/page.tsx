"use client";

import { authApi } from "@/lib/api";

export default function LoginPage() {
  const handleGoogleLogin = () => {
    window.location.href = authApi.googleLoginUrl;
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo area */}
        <div style={styles.logoArea}>
          <h1 style={styles.brand}>cookie<br />krave</h1>
          <p style={styles.tagline}>Order Management System</p>
        </div>

        <hr style={styles.divider} />

        <div style={styles.formArea}>
          <p style={styles.prompt}>Sign in to manage orders</p>

          <button
            onClick={handleGoogleLogin}
            style={styles.googleBtn}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p style={styles.note}>
            Only authorized accounts can access the admin dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}

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

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0d1240",
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 380,
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  logoArea: {
    textAlign: "center",
    paddingBottom: 24,
  },
  brand: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 42,
    lineHeight: 1.1,
    color: "#0d1240",
    letterSpacing: "-1px",
  },
  tagline: {
    marginTop: 8,
    fontSize: 13,
    color: "#6b6f8a",
    fontWeight: 500,
  },
  divider: {
    border: "none",
    borderTop: "1.5px solid #e2ddd6",
    marginBottom: 24,
  },
  formArea: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    alignItems: "center",
  },
  prompt: {
    fontSize: 15,
    color: "#0d1240",
    fontWeight: 500,
  },
  googleBtn: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "11px 20px",
    border: "1.5px solid #e2ddd6",
    borderRadius: 8,
    background: "#fff",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    width: "100%",
    justifyContent: "center",
    transition: "background 0.15s",
    fontFamily: "'DM Sans', sans-serif",
    color: "#0d1240",
  },
  note: {
    fontSize: 12,
    color: "#6b6f8a",
    textAlign: "center",
    lineHeight: 1.5,
  },
};
