/** @type {import('next').NextConfig} */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig = {
  images: {
    // In development, skip on-the-fly optimization: images load fast and at full
    // quality. In production (Vercel) they're optimized/resized as usual.
    unoptimized: process.env.NODE_ENV !== "production",
    remotePatterns: [
      ...(supabaseHost
        ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/**" }]
        : []),
      // Allow placeholder/demo images during early MVP development.
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
