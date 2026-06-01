"use client";

import React from "react";
import CustomerNavbar from "../../components/home-customer/CustomerNavbar";

const monthlyFlavor = {
  name: "Mango Macadamia Cookie",
  badge: "May's Krave",
  description: "Tropical mango flavor meets buttery macadamia nuts in a soft, chewy cookie that transports you to a sunny paradise with every bite.",
  image: "/images/mango.jpg",
};

const defaultFlavors = [
  { name: "Strawberry Creamcheese Cookie", image: "/images/strawberry.jpg", description: "Our signature cookie — soft, chewy, and bursting with sweet strawberry flavor and a creamy cream cheese filling." },
  { name: "Cinnamon Cookie", image: "/images/cinnamon.jpg", description: "Cinnamon sugar-dusted and filled with a warm, spiced cream cheese filling." },
  { name: "S'more Cookie", image: "/images/smore.jpg", description: "Gooey marshmallow, rich chocolate, and a hint of graham cracker all packed into one irresistible cookie." },
  { name: "Matcha Strawberry Creamcheese Cookie", image: "/images/MS.jpg", description: "Earthy matcha dough with strawberry cream cheese filling." },
];

export default function CustomerHomePage() {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#fdf8f2", minHeight: "100vh", color: "#0d1240" }}>

      <CustomerNavbar />

      {/* Hero Banner */}
      <section
        id="home"
        style={{
          position: "relative",
          minHeight: "700px",
          backgroundImage: "url('/images/hb2.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(13,18,64,0.55)",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            padding: "0 120px",
          }}
        >
          <div style={{ maxWidth: "560px", color: "#ffffff" }}>
            <div style={{ fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", color: "#c8883a", marginBottom: "4px", marginTop: "50px", fontWeight: 500 }}>
              WE BAKE COOKIES YOU KRAVE!
            </div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "64px", color: "#ffffff", lineHeight: 1.05, marginBottom: "24px" }}>
              small batch cookies, made to order
            </h1>
            <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "18px", lineHeight: 1.8, marginBottom: "36px", maxWidth: "560px" }}>
              Fresh, handcrafted cookies with a new flavor every month. Order yours before they are gone!
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              <a href="/customer-ui/order" style={{ textDecoration: "none" }}>
                <button style={{ background: "#c8883a", color: "#fff", border: "none", borderRadius: "10px", padding: "14px 32px", fontSize: "15px", fontWeight: 600, cursor: "pointer" }}>
                  Order Now
                </button>
              </a>
              <a href="/customer-ui/order-track" style={{ textDecoration: "none" }}>
                <button style={{ background: "transparent", color: "#ffffff", border: "1.5px solid rgba(255,255,255,0.75)", borderRadius: "10px", padding: "14px 32px", fontSize: "15px", fontWeight: 600, cursor: "pointer" }}>
                  Track Order
                </button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "60px 40px" }}>

        {/* This Month's Krave */}
        <div id="order" style={{ marginBottom: "64px" }}>
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "inline-block", background: "#fde8d8", color: "#7d3200", fontSize: "11px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", padding: "4px 12px", borderRadius: "999px", marginBottom: "12px" }}>
              Limited Monthly Special
            </div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "32px", color: "#0d1240" }}>
              This Month's Krave
            </h2>
          </div>

          <div style={{ display: "flex", gap: "32px", alignItems: "stretch" }}>
            <div style={{ width: "380px", flexShrink: 0, minHeight: "260px", overflow: "hidden" }}>
              <img src={monthlyFlavor.image} alt={monthlyFlavor.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ padding: "40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ display: "inline-block", background: "#fde8d8", color: "#7d3200", fontSize: "11px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", padding: "4px 12px", borderRadius: "999px", marginBottom: "16px", alignSelf: "flex-start" }}>
                {monthlyFlavor.badge}
              </div>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "30px", color: "#0d1240", marginBottom: "12px" }}>
                {monthlyFlavor.name}
              </h3>
              <p style={{ color: "#6b6f8a", fontSize: "14px", lineHeight: 1.7, marginBottom: "28px" }}>
                {monthlyFlavor.description}
              </p>
              <a href="/customer-ui/order" style={{ textDecoration: "none", alignSelf: "flex-start" }}>
                <button style={{ background: "#0d1240", color: "#fff", border: "none", borderRadius: "8px", padding: "11px 24px", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>
                  Order This Flavor
                </button>
              </a>
            </div>
          </div>
        </div>

        {/* Always Available */}
        <div>
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "32px", color: "#0d1240", marginBottom: "8px" }}>
              Always Available
            </h2>
            <p style={{ color: "#6b6f8a", fontSize: "14px" }}>
              Our four signature flavors, baked fresh every week.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
            {defaultFlavors.map((flavor, idx) => (
              <a key={idx} href="/customer-ui/order" style={{ textDecoration: "none" }}>
                <div
                  style={{ background: "#ffffff", border: "1px solid #e2ddd6", borderRadius: "12px", overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer" }}
                  onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(-4px)"; el.style.boxShadow = "0 8px 24px rgba(13,18,64,0.1)"; }}
                  onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(0)"; el.style.boxShadow = "none"; }}
                >
                  <div style={{ height: "140px", overflow: "hidden" }}>
  <img src={flavor.image} alt={flavor.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
</div>
                  <div style={{ padding: "16px" }}>
                    <h4 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "16px", color: "#0d1240", marginBottom: "8px" }}>
                      {flavor.name}
                    </h4>
                    <p style={{ color: "#6b6f8a", fontSize: "12px", lineHeight: 1.6 }}>
                      {flavor.description}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: "#0d1240", color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "24px", fontSize: "13px" }}>
        © 2025 Cookie Krave · Handcrafted with love 🍪
      </div>

    </div>
  );
}