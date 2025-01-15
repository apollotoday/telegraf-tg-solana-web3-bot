import type { NextConfig } from "next";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaPlugin } = require('@prisma/nextjs-monorepo-workaround-plugin')


const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  redirects: async () => ([
    {
      source: '/hackathon/mm/presentation',
      destination: 'https://drive.google.com/drive/folders/16Gk0-gM1GVBhzxegHgfix-ziL1g65ptR?usp=sharing',
      permanent: false,
      basePath: false
    }, {

      source: '/hackathon/mm/demo',
      destination: 'https://drive.google.com/drive/folders/16Gk0-gM1GVBhzxegHgfix-ziL1g65ptR?usp=sharing',
      permanent: false,
      basePath: false
    }, {
      source: '/hackathon/mm/repo',
      destination: 'https://drive.google.com/drive/folders/16Gk0-gM1GVBhzxegHgfix-ziL1g65ptR?usp=sharing',
      permanent: false,
      basePath: false
    }, {
      source: '/hackathon/characters/presentation',
      destination: 'https://drive.google.com/drive/folders/16Gk0-gM1GVBhzxegHgfix-ziL1g65ptR?usp=sharing',
      permanent: false,
      basePath: false
    }, {

      source: '/hackathon/characters/demo',
      destination: 'https://drive.google.com/drive/folders/16Gk0-gM1GVBhzxegHgfix-ziL1g65ptR?usp=sharing',
      permanent: false,
      basePath: false
    }, {
      source: '/hackathon/characters/repo',
      destination: 'https://drive.google.com/drive/folders/16Gk0-gM1GVBhzxegHgfix-ziL1g65ptR?usp=sharing',
      permanent: false,
      basePath: false
    }
  ]),
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()]
    }

    return config
  }
};

export default nextConfig;
