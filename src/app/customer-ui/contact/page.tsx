"use client";

import React, { useState } from "react";
import CustomerNavbar from "../../../components/home-customer/CustomerNavbar";

interface FormData {
  name: string;
  email: string;
  message: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      setSubmitStatus({
        type: "error",
        message: "Please enter your name",
      });
      return;
    }

    if (!formData.email.trim() || !formData.email.includes("@")) {
      setSubmitStatus({
        type: "error",
        message: "Please enter a valid email address",
      });
      return;
    }

    if (!formData.message.trim()) {
      setSubmitStatus({
        type: "error",
        message: "Please enter a message",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus({
          type: "success",
          message: "Thank you for your message! We'll get back to you soon.",
        });
        setFormData({ name: "", email: "", message: "" });
      } else {
        setSubmitStatus({
          type: "error",
          message: "Failed to send message. Please try again.",
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: "An error occurred. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
          src="/images/HeroBanner.jpg"
          alt="Contact Cookie Krave"
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
            Contact Us
          </h1>

          <p
            style={{
              maxWidth: "700px",
              color: "rgba(255,255,255,0.9)",
              fontSize: "18px",
              lineHeight: 1.8,
            }}
          >
            We'd love to hear from you. Whether it's an order inquiry,
            feedback, or a cookie kraving, we're here to help.
          </p>
        </div>
      </section>

      {/* Contact Information */}
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
          Get In Touch
        </h2>

        <p
          style={{
            color: "#6b6f8a",
            lineHeight: 1.9,
            fontSize: "16px",
            marginBottom: "40px",
          }}
        >
          Have questions about our cookies, delivery schedules, or
          monthly specials? Reach out to us through any of the channels
          below and we'll get back to you as soon as possible.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "24px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2ddd6",
              borderRadius: "16px",
              padding: "32px",
            }}
          >
            <h3
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "24px",
                marginBottom: "12px",
              }}
            >
              📧 Email
            </h3>
            <p style={{ color: "#6b6f8a", lineHeight: 1.8 }}>
              cookiekrave@gmail.com
            </p>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2ddd6",
              borderRadius: "16px",
              padding: "32px",
            }}
          >
            <h3
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "24px",
                marginBottom: "12px",
              }}
            >
              📱 Phone
            </h3>
            <p style={{ color: "#6b6f8a", lineHeight: 1.8 }}>
              +63 912 345 6789
            </p>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2ddd6",
              borderRadius: "16px",
              padding: "32px",
            }}
          >
            <h3
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "24px",
                marginBottom: "12px",
              }}
            >
              📍 Location
            </h3>
            <p style={{ color: "#6b6f8a", lineHeight: 1.8 }}>
              Quezon City, Philippines
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section
        style={{
          background: "#ffffff",
          padding: "80px 40px",
        }}
      >
        <div
          style={{
            maxWidth: "700px",
            margin: "0 auto",
          }}
        >
          <h2
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "38px",
              textAlign: "center",
              marginBottom: "40px",
            }}
          >
            Send Us a Message
          </h2>

          {submitStatus.type && (
            <div
              style={{
                padding: "16px",
                borderRadius: "12px",
                marginBottom: "24px",
                backgroundColor:
                  submitStatus.type === "success"
                    ? "#d4edda"
                    : "#f8d7da",
                color:
                  submitStatus.type === "success"
                    ? "#155724"
                    : "#721c24",
                border: `1px solid ${
                  submitStatus.type === "success"
                    ? "#c3e6cb"
                    : "#f5c6cb"
                }`,
              }}
            >
              {submitStatus.message}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={isSubmitting}
              style={{
                padding: "16px",
                border: "1px solid #e2ddd6",
                borderRadius: "12px",
                fontSize: "16px",
                backgroundColor: isSubmitting ? "#f5f5f5" : "#ffffff",
              }}
            />

            <input
              type="email"
              name="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isSubmitting}
              style={{
                padding: "16px",
                border: "1px solid #e2ddd6",
                borderRadius: "12px",
                fontSize: "16px",
                backgroundColor: isSubmitting ? "#f5f5f5" : "#ffffff",
              }}
            />

            <textarea
              name="message"
              placeholder="Your Message"
              rows={6}
              value={formData.message}
              onChange={handleInputChange}
              disabled={isSubmitting}
              style={{
                padding: "16px",
                border: "1px solid #e2ddd6",
                borderRadius: "12px",
                fontSize: "16px",
                resize: "vertical",
                backgroundColor: isSubmitting ? "#f5f5f5" : "#ffffff",
              }}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                background: isSubmitting ? "#6b7080" : "#0d1240",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                padding: "16px",
                fontSize: "16px",
                fontWeight: 600,
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </form>
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
