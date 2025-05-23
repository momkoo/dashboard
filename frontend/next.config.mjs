// frontend/next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export' 제거 - 개발 모드에서는 필요없음
  images: {
    unoptimized: true,
  },
  // API routes를 위해 standalone 모드 사용
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:8082']
    }
  },
  // 환경변수 설정
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:8082'
  },
  // 개발 모드에서 CORS 문제 해결
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://localhost:8082/:path*',
      },
    ];
  },
};

export default nextConfig;