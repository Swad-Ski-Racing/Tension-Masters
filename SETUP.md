# Tension Masters — SETUP

Follow these steps once to put the site live with a working price manager.

> **Never put the database connection string in GitHub or any file in this repo.**
> It only goes into Vercel's Environment Variables (step 3).

---

## 1. Upload to GitHub

1. Create a new repository on github.com. **Make it Private.**
2. Click **uploading an existing file**, then drag in everything *inside* this `tensionmasters` folder: `public`, `api`, `package.json`, `vercel.json`, `SETUP.md`, `README.md` and the rest.
3. Click **Commit changes**.

## 2. Connect it to Vercel

1. On vercel.com, open the existing **tensionmasters** project → **Settings** → **Git** → **Connect Git Repository**, and choose the new repo.
   (Or **Add New → Project**, import the repo, and move the domain across.)
2. Under **Settings → Build & Deployment**, set Framework Preset to **Other** and leave the build command empty. `vercel.json` already tells Vercel to serve the `public` folder.

## 3. Add the Neon database

1. In Vercel, go to the project → **Settings** → **Environment Variables**.
2. Add one variable:
   - **Key:** `DATABASE_URL`
   - **Value:** your Neon connection string. It starts with `postgresql://neondb_owner:...` and is in the Neon dashboard under **Connect**.
   - **Environments:** tick Production, Preview and Development.
3. Click **Save**.

The database table `tm_settings` has already been created in your Neon database. If you ever use a new database, the site creates the table on its first save, or you can run `setup.sql` in Neon → **SQL Editor**.

## 4. Redeploy

Go to **Deployments** → **⋯** on the latest deployment → **Redeploy**. Vercel only picks up new environment variables after a redeploy.

## 5. Publish the starting prices

1. Open the website, scroll to the footer, and click **Admin login**.
2. Log in with the admin password.
3. Check the prices and press **Save & publish**. You should see "Saved — the website updates within a minute".

### Changing the admin password
The password is built in, and the code only stores a hash of it. To change it, add an environment variable `ADMIN_PASSWORD` in Vercel with the new password, then redeploy.

### If saving fails
- "Storage not set up yet": `DATABASE_URL` is missing, or you haven't redeployed since adding it.
- "Could not save — check the database connection": open Vercel → Deployments → the latest deployment → **Logs** to see the exact error. The usual cause is a mistyped connection string.

---

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
