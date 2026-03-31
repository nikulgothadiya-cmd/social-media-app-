import { useNavigate } from "react-router-dom";

export default function BottomNav() {
  const navigate = useNavigate();
  const buttons = [
    { label: "Home", icon: "🏠", to: "/" },
    { label: "Reels", icon: "🎞️", to: "/reels" },
    { label: "Chats", icon: "💬", to: "/chat" },
    { label: "Post", icon: "➕", to: "/create" },
    { label: "Profile", icon: "👤", to: "/profile/me" }
  ];

  return (
    <nav
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        height: "68px",
        background: "rgba(0,0,0,0.9)",
        backdropFilter: "blur(8px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        zIndex: 100
      }}
    >
      {buttons.map((btn) => (
        <button
          key={btn.to}
          className="bottom-nav-btn"
          aria-label={btn.label}
          onClick={() => navigate(btn.to)}
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            cursor: "pointer"
          }}
        >
          <span style={{ fontSize: "20px", lineHeight: 1 }}>{btn.icon}</span>
          <span style={{ fontSize: "12px" }}>{btn.label}</span>
        </button>
      ))}
    </nav>
  );
}
