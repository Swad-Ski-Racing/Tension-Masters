# Tension Masters — price manager setup

The site works without this setup: it uses the default prices in `strings.js`, `pricing.js` and `services.html`.
These steps switch on the admin panel at `/admin.html`, so Isaac can change prices, run sales and choose popular strings without touching any code.

## One-time setup (Vercel)

1. **Deploy this repo** to the existing Vercel project. `vercel.json` tells Vercel to serve the `public/` folder and run the `api/` folder as a server function.
2. **Add storage:** Vercel project → **Storage** → **Marketplace** → **Upstash for Redis** → create a free database and connect it to this project.
   This adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` to the project automatically.
3. **Password:** the admin password is built in. The code only stores a salted hash of it, never the password itself. To change it, add an `ADMIN_PASSWORD` environment variable in Vercel; that takes priority over the built-in one.
4. **Redeploy** so the storage variables take effect.
5. Open the **Admin login** link in the site footer (`/admin.html`), log in, and press **Save & publish** once to store the starting prices.

## What Isaac can change

| Setting | Effect on the site |
|---|---|
| BG65 / BG80 price | Pricing cards, the booking form and the "from £x" labels |
| 4-knot fee | Added per racket when a customer picks 4 knots (two-tone and hybrid strings always use 4 knots). 2-knot is always free. |
| Labour (own strings) | Blank = "Quote". Set a price to show it and include it in the total. |
| Sale | Percentage off everything, BG65/BG80 only, build-your-own only, or ticked strings. Can have an end date. Shows a banner and crossed-out prices. |
| Show / hide a string | Removes it from "Build your own" (for example, when it's out of stock). |
| ★ Popular | Shows the string in the "Popular" quick picks and at the top of the dropdown. |

Changes appear on the site within about 30–60 seconds of saving.

## Booking emails (Formspree)

Every booking email starts with:
- **Invoice total**: the amount to charge, including any sale and the 4-knot fee.
- **Invoice breakdown**: each line, e.g. `2 × Yonex BG66 Ultimax — White / Yellow @ £21.00 = £42.00 | 2 × 4-knot stringing (two-piece) @ £4.23 = £8.46 | TOTAL TO INVOICE: £50.46`

The browser works out the total from the live prices. Isaac can check it against the price manager if anything looks odd.

## Adding a new string

1. Add a line to `public/strings.js` with its suggested price (cost + £15) and its colours.
2. Add its cost to `api/_costs.js`. The cost file is private: only the logged-in admin can see costs.
3. Deploy.
The new string appears in the price manager automatically.

## Legal checklist for Isaac (things the website can't do for you)

- [ ] **Confirm the address** used in the footer, terms and privacy notice (5 Egginton Road, Hilton, Derby DE65) and **add the full postcode**. UK law (the E-Commerce Regulations 2002) requires a business website to show a real postal address.
- [ ] **ICO data protection fee:** take the 2-minute self-assessment at ico.org.uk/fee. Small businesses that only keep customer records are often exempt, but check.
- [ ] **HMRC:** register as self-employed once trading income goes over £1,000 a year, and keep records for at least 5 years.
- [ ] **Sales:** only show a "was" price that has genuinely been charged recently, and end a sale on the date you say it ends (Digital Markets, Competition and Consumers Act 2024).
- [ ] **Bookings:** confirm each booking by message or email, and include the price. That confirmation is when the contract starts (see `terms.html`).
- [ ] **Insurance:** consider public liability insurance to cover customers' rackets while you have them.
- [ ] **Formspree:** delete old submissions from the Formspree dashboard in line with the privacy notice (enquiries that don't go ahead: within 12 months).
