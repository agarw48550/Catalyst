# Project Catalyst

A Next.js 15+ application built with App Router, optimized for Vercel deployment.

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, or pnpm

### Installation

```bash
# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building

Build the application for production:

```bash
npm run build
# or
yarn build
# or
pnpm build
```

This will create an optimized production build in the `.next` directory.

### Production

Start the production server:

```bash
npm start
# or
yarn start
# or
pnpm start
```

## Deployment on Vercel

This project is configured for seamless deployment on Vercel.

### Configuration

- **Framework**: Next.js (automatically detected by Vercel)
- **Build Command**: `npm run build` (specified in `vercel.json`)
- **Output Directory**: Managed automatically by Next.js (`.next` directory)
- **Public Assets**: Static files in `/public` directory

### Key Files

- `vercel.json` - Vercel deployment configuration
- `next.config.mjs` - Next.js configuration
- `/public` - Static assets (favicon, logo, etc.)

### Deployment Steps

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Configure Project**: Vercel will auto-detect Next.js settings
3. **Deploy**: Click "Deploy" - Vercel handles the rest!

### Important Notes

- ✅ The `/public` directory always exists with placeholder assets
- ✅ No manual `outputDirectory` setting needed in `vercel.json` for App Router
- ✅ Next.js 15+ manages build output automatically
- ✅ For static export, uncomment `output: 'export'` in `next.config.mjs` and Vercel will use the `out` directory

## Project Structure

```
catalyst/
├── app/                  # Next.js App Router directory
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles
├── public/              # Static assets
│   ├── favicon.svg      # Site favicon
│   ├── logo.svg         # Catalyst logo
│   └── README.md        # Assets documentation
├── next.config.mjs      # Next.js configuration
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vercel.json          # Vercel deployment config
└── README.md           # This file
```

## Learn More

To learn more about Next.js and Vercel:

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - Interactive Next.js tutorial
- [Vercel Documentation](https://vercel.com/docs) - Learn about Vercel deployment
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs) - Next.js deployment guide

## License

MIT
