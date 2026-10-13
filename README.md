# Tension Masters

Website for Tension Masters, a badminton restringing service in Etwall and Hilton, Derbyshire: www.tensionmasters.co.uk

## Structure

```
public/            the website (Vercel serves only this folder)
  index.html       home
  services.html    pricing, Build-your-own racket designer, booking form (Formspree)
  privacy.html     privacy notice (UK GDPR)
  terms.html       booking terms & cancellation rights
  admin.html       price manager (password protected)
  strings.js       Build-your-own string list (default prices, colours)
  pricing.js       shared pricing, loads live prices/sales from /api/settings
  designer.js      racket designer + 2/4-knot visual
  main.js          nav, booking form, invoice fields
api/
  settings.js      GET public settings / POST save (admin password)
  _costs.js        private string cost prices (admin only, never served)
vercel.json        output folder + security headers
```

## Deploy

1. Push this repo to GitHub and import it into the existing Vercel project (or connect the repo to it).
2. Set up the price manager by following [ADMIN-SETUP.md](ADMIN-SETUP.md). Its storage needs a free Upstash Redis database.

There's no build step: plain HTML, CSS and JS, plus one Node serverless function.
