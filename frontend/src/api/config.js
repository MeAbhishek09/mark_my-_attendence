// Automatically switches between localhost and production (Render)

export const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:8000";
