"use client";

import React from "react";
import CustomerNavbar from "../../../components/home-customer/CustomerNavbar";

export default function AboutUsPage() {

  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: "#fdf8f2",
        minHeight: "100vh",
        color: "#0d1240",
      }}
    >
      <CustomerNavbar />

      {/* Hero Section */}
      <section
    style={{
        position: "relative",
        height: "500px",
        overflow: "hidden",
  }}
>
  <img
    src="/images/frontImage.jpg"
    alt="Cookie Krave"
    style={{
      width: "100%",
      height: "100%",
      objectFit: "cover",
    }}
  />

  <div
    style={{
      position: "absolute",
      inset: 0,
      background: "rgba(13,18,64,0.45)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
      padding: "20px",
    }}
  >
    <h1
      style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: "56px",
        color: "#ffffff",
        marginBottom: "20px",
      }}
    >
      About Cookie Krave
    </h1>

    <p
      style={{
        maxWidth: "700px",
        color: "rgba(255,255,255,0.9)",
        fontSize: "18px",
        lineHeight: 1.8,
      }}
    >
      Handcrafted cookies made with premium ingredients, baked fresh
      in small batches, and created to bring joy in every bite.
    </p>
  </div>
</section>

      {/* Our Story */}
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "80px 40px",
        }}
      >
        <h2
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: "38px",
            marginBottom: "24px",
          }}
        >
          Our Story
        </h2>

        <p
          style={{
            color: "#6b6f8a",
            lineHeight: 1.9,
            fontSize: "16px",
          }}
        >
          Cookie Krave started with a simple passion for baking and a
          desire to create cookies that feel special. What began as
          homemade treats shared with family and friends eventually grew
          into a small business focused on delivering fresh, high-quality
          cookies to fellow cookie lovers.

          <br />
          <br />

          Every batch is carefully prepared using quality ingredients,
          unique flavor combinations, and plenty of attention to detail.
          From our monthly special flavors to our signature classics,
          each cookie is baked with the goal of creating a memorable
          experience for every customer.
        </p>
      </section>

      {/* Mission & Vision */}
      <section
        style={{
          background: "#ffffff",
          padding: "80px 40px",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "40px",
          }}
        >
          <div
            style={{
              border: "1px solid #e2ddd6",
              borderRadius: "16px",
              padding: "32px",
            }}
          >
            <h3
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "28px",
                marginBottom: "16px",
              }}
            >
              Our Mission
            </h3>

            <p
              style={{
                color: "#6b6f8a",
                lineHeight: 1.8,
              }}
            >
              To provide freshly baked, handcrafted cookies that bring
              happiness, comfort, and unforgettable flavors to every
              customer.
            </p>
          </div>

          <div
            style={{
              border: "1px solid #e2ddd6",
              borderRadius: "16px",
              padding: "32px",
            }}
          >
            <h3
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "28px",
                marginBottom: "16px",
              }}
            >
              Our Vision
            </h3>

            <p
              style={{
                color: "#6b6f8a",
                lineHeight: 1.8,
              }}
            >
              To become a beloved cookie brand known for creativity,
              quality, and a growing community of cookie enthusiasts.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div
        style={{
          background: "#0d1240",
          color: "rgba(255,255,255,0.4)",
          textAlign: "center",
          padding: "24px",
          fontSize: "13px",
        }}
      >
        © 2025 Cookie Krave · Handcrafted with love 🍪
      </div>
    </div>
  );
}