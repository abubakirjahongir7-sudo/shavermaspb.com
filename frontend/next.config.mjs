/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lokal tarmoqdagi telefondan dev serverni ochib ko'rish uchun.
  allowedDevOrigins: ["192.168.1.214"],
  // Bu Windows kompyuterida `next dev` jarayon ocholmay (spawn EPERM) /order/[id]
  // sahifasi 500 qaytaradi. Production build'ga ta'sir qilmaydi.
  ...(process.env.NODE_ENV === "development" ? { experimental: { workerThreads: true } } : {}),
  // www. bilan kirganlarni asosiy domenga o'tkazamiz — backend faqat bitta
  // manzildan so'rov qabul qiladi, ilova ham bitta manzilga o'rnatiladi.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www\\.(?<domain>.+)" }],
        destination: "https://:domain/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
