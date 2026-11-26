import { z } from 'zod';

const money = z.number().int().min(0).max(1_000_000);

/**
 * The agency's own prices. Every figure in a quote comes from here or from an edit the agency
 * makes in the quote editor. AI output is never used for prices.
 */
export const RateCardSchema = z.object({
  platforms: z.object({
    wordpress: money,
    shopify: money,
    webflow: money,
    squarespace: money,
  }),
  perPage: money,
  features: z.object({
    booking: money,
    menu: money,
    gallery: money,
    private: money,
    shop: money,
    blog: money,
    newsletter: money,
    vouchers: money,
    services: money,
    testimonials: money,
    team: money,
    faq: money,
  }),
  /** Added for every 10 products beyond the first 10 in an online shop. */
  shopPer10Products: money,
  seo: money,
  copywriting: money,
  /** VAT as a fraction, 0.2 for 20%. */
  vatRate: z.number().min(0).max(1),
});
export type RateCard = z.infer<typeof RateCardSchema>;

/** Studio North's sample rate card from the design. */
export const DEFAULT_RATE_CARD: RateCard = {
  platforms: { wordpress: 1200, shopify: 1800, webflow: 1500, squarespace: 800 },
  perPage: 250,
  features: {
    booking: 600,
    menu: 400,
    gallery: 250,
    // Enquiry forms are part of a page, so they cost nothing extra by default.
    private: 0,
    shop: 900,
    blog: 300,
    newsletter: 150,
    vouchers: 350,
    services: 0,
    testimonials: 0,
    team: 0,
    faq: 0,
  },
  shopPer10Products: 450,
  seo: 350,
  copywriting: 300,
  vatRate: 0.2,
};
