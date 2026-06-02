"use client";

import React, { useEffect, useState } from "react";

const navItems = ["Home", "About Us", "Track Order", "Contact"];

const getNavHref = (item: string) =>
  item === "About Us"
    ? "/customer-ui/about-us"
    : item === "Track Order"
    ? "/customer-ui/order-track"
    : item === "Contact"
    ? "/customer-ui/contact"
    : item === "Home"
    ? "/customer-ui"
    : "#";

const isOrderPath = (pathname: string) =>
  pathname === "/customer-ui/order" || pathname === "/customer-ui/order/";

const getActiveNav = (pathname: string) => {
  if (pathname.includes("/order-track") || pathname.includes("/customer-ui/order-track")) {
    return "Track Order";
  }
  if (isOrderPath(pathname)) {
    return "";
  }
  if (pathname.includes("/customer-ui/about-us")) {
    return "About Us";
  }
  if (pathname.includes("/customer-ui/contact")) {
    return "Contact";
  }
  return "Home";
};

export default function CustomerNavbar() {
  const [activeNav, setActiveNav] = useState<string>("Home");
  const [isCartPage, setIsCartPage] = useState<boolean>(false);
  const [isProfilePage, setIsProfilePage] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const pathname = window.location.pathname;
    setIsCartPage(isOrderPath(pathname));
    setIsProfilePage(pathname.includes("/customer-ui/profile"));
    setActiveNav(getActiveNav(pathname));
  }, []);

  return (
    <nav
      style={{
        background: "#ffffff",
        height: "82px",
        padding: "0 60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomLeftRadius: "24px",
        borderBottomRightRadius: "24px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <a href="/customer-ui" style={{ textDecoration: "none" }}>
        <img
          src="/images/CKWebLogo.png"
          alt="Cookie Krave"
          style={{ height: "100px", width: "auto", objectFit: "contain" }}
        />
      </a>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "auto" }}>
        {navItems.map((item) => (
          <a
            key={item}
            href={getNavHref(item)}
            onClick={() => setActiveNav(item)}
            style={{
              fontSize: "15px",
              fontWeight: activeNav === item ? 700 : 500,
              color: activeNav === item ? "#0d1240" : "#6b6f8a",
              textDecoration: "none",
              paddingBottom: "4px",
              borderBottom: activeNav === item ? "2px solid #0d1240" : "2px solid transparent",
              transition: "all 0.2s",
              cursor: "pointer",
            }}
          >
            {item}
          </a>
        ))}

        {/* 🛒 Shopping Cart Button */}
        {!isCartPage && (
          <a href="/customer-ui/order" style={{ textDecoration: "none" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: "4px",
                width: "44px",
                height: "44px",
                background: "#0d1240",
                color: "#ffffff",
                borderRadius: "14px",
                fontSize: "18px",
                cursor: "pointer",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" />
                <circle cx="10" cy="20" r="1" fill="currentColor" />
                <circle cx="18" cy="20" r="1" fill="currentColor" />
              </svg>
            </span>
          </a>
        )}

        {/* 👤 Account Profile Button */}
        <a href="/customer-ui/profile" style={{ textDecoration: "none" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: "4px",
              width: "44px",
              height: "44px",
              background: isProfilePage ? "#c8883a" : "transparent",
              color: isProfilePage ? "#ffffff" : "#0d1240",
              border: isProfilePage ? "none" : "1.5px solid #e2ddd6",
              borderRadius: "14px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
        </a>
      </div>
    </nav>
  );
}