# FundSui - Static GitHub Pages Site

<div align="center">
  <img src="public/beaverlogo.png" alt="Fundsui Logo" width="200"/>
</div>

This is a static, cost-effective version of the FundSui platform hosted on GitHub Pages.

## About

FundSui is a decentralized creator-subscription platform built on Sui, Walrus, and Seal, featuring an immutable 3% fee structure and censorship-resistant content delivery.

This static site showcases the platform's core features and design while the full interactive application is temporarily offline to save on hosting costs.

## Features

- Pure HTML/CSS/JavaScript - no build process required
- Tailwind CSS via CDN for styling
- Three.js for the interactive 3D model
- Responsive design matching the original Next.js application
- GitHub Pages deployment with automatic updates

## Local Development

To run the site locally:

```bash
# Using Python 3
python3 -m http.server 8000

# Or using Node.js
npx serve
```

Then visit `http://localhost:8000` in your browser.

## Deployment

This site is automatically deployed to GitHub Pages when changes are pushed to the `gh-pages` branch.

### Manual Setup

If you need to set up GitHub Pages manually:

1. Go to your repository Settings
2. Navigate to "Pages" in the sidebar
3. Under "Source", select "GitHub Actions"
4. Push to the `gh-pages` branch to trigger deployment

### Deployment Workflow

The `.github/workflows/deploy.yml` file contains the GitHub Actions workflow that:
1. Triggers on pushes to the `gh-pages` branch
2. Uploads the repository contents as a Pages artifact
3. Deploys to GitHub Pages

## Project Structure

```
.
├── index.html           # Main HTML file
├── public/              # Static assets
│   ├── beaverlogo.png  # FundSui logo
│   ├── favicon.ico     # Site favicon
│   └── three/          # 3D model files
│       ├── scene.gltf  # GLTF model
│       ├── scene.bin   # Model binary data
│       └── license.txt # Model license
├── .github/
│   └── workflows/
│       └── deploy.yml  # GitHub Actions deployment
├── package.json        # Development scripts
└── README.md           # This file
```

## Key Differences from Full App

This static version:
- Does not include wallet connection functionality
- Does not display the featured creator section
- Has disabled navigation buttons (Explore, Dashboard, etc.)
- Uses CDN versions of Tailwind CSS and Three.js
- Includes a notice banner about cost-saving measures

## Technologies Used

- HTML5
- Tailwind CSS (via CDN)
- Three.js (via CDN)
- GitHub Pages
- GitHub Actions

## Full Application

For access to the full interactive application with wallet connection, creator subscriptions, and content management, please check the `main` branch of this repository.

For full details about the FundSui platform, its features, and architecture, see the README in the `main` branch.

## License

Copyright 2026 FundSui. All rights reserved.

The 3D model is based on "3D Number - 3 (THREE)" by Jihambru, licensed under CC-BY-4.0.
