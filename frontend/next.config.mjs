// frontend/next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 이 라인을 추가합니다.
  images: {
    unoptimized: true, // next export 시 이미지 최적화 비활성화
  },
  // 기타 Next.js 설정...
};

export default nextConfig;
