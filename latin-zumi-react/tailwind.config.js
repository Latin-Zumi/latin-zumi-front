export default {
  theme: {
    extend: {
      colors: {
        background: "#f3f6fb",
        surface: "#ffffff",
        card: "#ffffff",
        foreground: "#172238",
        muted: "#637089",
        border: "#d5dce8",
        primary: {
          DEFAULT: "#2459c4",
          hover: "#17449f",
          foreground: "#ffffff"
        },
        secondary: "#ef7a38",
        info: "#2879c7",
        success: "#17835d",
        warning: "#b66b12",
        danger: "#c43c39"
      },
      borderRadius: {
        sm: "8px",
        md: "14px",
        lg: "22px"
      },
      boxShadow: {
        sm: "0 5px 18px rgba(23, 34, 56, 0.08)",
        lg: "0 24px 70px rgba(8, 20, 42, 0.25)"
      }
    }
  }
}