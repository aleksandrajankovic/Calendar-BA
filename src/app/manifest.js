// src/app/manifest.js
export default function manifest() {
  return {
    name: "Kalendar promocija | Meridianbet",
    short_name: "MB Kalendar",
    description:
      "Budite u toku s dnevnim ponudama, otkrijte nove promocije i iskoristite ekskluzivne nagrade uz Meridianbet Kalendar promocija.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b0b",
    theme_color: "#A6080E",
    lang: "bs",
    icons: [
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
