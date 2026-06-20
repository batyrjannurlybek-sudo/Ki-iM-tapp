export async function GET() {
  return Response.json({
    name: "Ki-iM | tapp — Local Clothing Discovery",
    short_name: "Ki-iM tapp",
    description: "Find clothing across local stores in your city.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  });
}
