"use client";

import React, { useState } from "react";
import CustomerNavbar from "../../../components/home-customer/CustomerNavbar";

export default function ProfileSettingsPage() {
  // Mock internal initial values - can connect straight to database context later
  const [fullName, setFullName] = useState("FirstName LastName");
  const [contactNum, setContactNum] = useState("Provide your working contact number");
  const [address, setAddress] = useState("House No., Street Name, Barangay, City, Province OR Searchable Google Maps link");
  const [email] = useState("Your Email"); 

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    // Simulate backend patch/update request safely
    setTimeout(() => {
      setSaving(false);
      setMessage("Profile details updated successfully!");
    }, 1000);
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#fdf8f2", minHeight: "100vh", color: "#0d1240" }}>
      
      <CustomerNavbar />

      <div style={{ maxWidth: "680px", margin: "60px auto", padding: "0 40px" }}>
        
        {/* Header Heading */}
        <div style={{ marginBottom: "36px" }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "42px", color: "#0d1240", margin: "0 0 8px 0" }}>
            My Profile
          </h1>
          <p style={{ color: "#6b6f8a", fontSize: "15px", margin: 0 }}>
            Update your personal details and active delivery address below.
          </p>
        </div>

        {/* Main Content Form Card Layout */}
        <div style={{ background: "#ffffff", border: "1px solid #e2ddd6", borderRadius: "16px", padding: "40px", boxShadow: "0 4px 20px rgba(13,18,64,0.02)" }}>
          <form onSubmit={handleUpdateProfile}>
            
            {/* Input Element: Full Name */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#0d1240", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{ width: "100%", padding: "14px 16px", border: "1px solid #e2ddd6", borderRadius: "10px", fontSize: "14px", color: "#0d1240", fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* Input Element: Contact Number */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#0d1240", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Contact Number
              </label>
              <input
                type="tel"
                value={contactNum}
                onChange={(e) => setContactNum(e.target.value)}
                required
                style={{ width: "100%", padding: "14px 16px", border: "1px solid #e2ddd6", borderRadius: "10px", fontSize: "14px", color: "#0d1240", fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {/* Input Element: Delivery Address */}
            <div style={{ marginBottom: "32px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#0d1240", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Default Delivery Address
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                rows={3}
                style={{ width: "100%", padding: "14px 16px", border: "1px solid #e2ddd6", borderRadius: "10px", fontSize: "14px", color: "#0d1240", fontFamily: "'DM Sans', sans-serif", outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: "1.5" }}
              />
            </div>

            {/* 🔒 Read-Only Identity Layer (Groupmate Rule Enforcement) */}
            <div style={{ marginBottom: "32px", borderTop: "1px solid #e2ddd6", paddingTop: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 700, color: "#6b6f8a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Linked Account Email
                </label>
                <span title="Locked for security" style={{ cursor: "help", fontSize: "12px" }}></span>
              </div>
              <input
                type="email"
                value={email}
                disabled
                style={{ width: "100%", padding: "14px 16px", background: "#f8fafc", border: "1px solid #e2ddd6", borderRadius: "10px", fontSize: "14px", color: "#94a3b8", cursor: "not-allowed", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }}
              />
              <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: "#9b8ea0" }}>
                Authentication channels are tied securely to this Google address token and cannot be modified.
              </p>
            </div>

            {/* Notification Bar Banner info */}
            {message && (
              <div style={{ padding: "12px 16px", background: "#dcfce7", color: "#166534", borderRadius: "8px", fontSize: "14px", fontWeight: 500, marginBottom: "20px" }}>
                {message}
              </div>
            )}

            {/* Action Buttons Row */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <a href="/customer-ui" style={{ textDecoration: "none" }}>
                <button type="button" style={{ background: "transparent", color: "#0d1240", border: "1px solid #e2ddd6", borderRadius: "10px", padding: "12px 24px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                  Back to Home
                </button>
              </a>
              <button
                type="submit"
                disabled={saving}
                style={{ background: "#c8883a", color: "#ffffff", border: "none", borderRadius: "10px", padding: "12px 28px", fontSize: "14px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Saving Changes..." : "Save Settings"}
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* Footer Element container */}
      <div style={{ background: "#0d1240", color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "24px", fontSize: "13px" }}>
        © 2026 Cookie Krave · Handcrafted with love 🍪
      </div>
    </div>
  );
}