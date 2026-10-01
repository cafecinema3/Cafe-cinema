# Cafe Cinema Web App

A responsive Persian/English static website built from the supplied original and neon SVG artwork.

## Pages and behavior

- Home, Menu, Food, Drinks, Instagram, and About Us screens.
- Original SVGs provide each screen's content; neon glows stay off raster image areas (except on About Us).
- One red separator is shared above the bottom navigation, and all four navigation borders have a subtle glow.
- The supplied crumpled-paper texture is the shell background; flat `#282829` backing pixels are made transparent at render time, including behind the Instagram logo.
- Food and drinks screens keep the Menu tab active.
- The Instagram call-to-action links to `https://www.instagram.com/Cinema.cafee_/`.
- The Instagram logo uses a 2.7-second lamp-flicker animation.
- The bottom navigation is responsive and highlights only the current section.

## GitHub Pages

The live site is published from the `main` branch and repository root. Keep `index.html`, `app.js`, `styles.css`, and the `assets/` folder together at the root. Committing updates to `main` triggers the Pages deployment.

Live site: <https://cafecinema3.github.io/Cafe-cinema/>

For local testing, serve this folder with a static web server. Direct `file://` access may prevent the browser from fetching SVG assets.
