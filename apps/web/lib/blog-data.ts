export interface BlogPost {
  slug: string;
  title: string;
  category: "Travel" | "Reviews" | "Maintenance" | "Touring" | "Safety" | "Routes" | "Guides";
  excerpt: string;
  content: string[];
  coverImage: string;
  publishedAt: string;
  author: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "ultimate-leh-ladakh-riding-guide",
    title: "The Ultimate Leh–Ladakh Riding Guide",
    category: "Guides",
    excerpt: "Everything you need to know before tackling India's most iconic motorcycle route — permits, altitude sickness, best months, and bike choice.",
    content: [
      "Leh–Ladakh is the trip every Indian rider dreams about, and for good reason — few places on Earth combine such dramatic scenery with genuinely challenging riding.",
      "Best time to go: June through September, once the passes have cleared of snow. July and August see the most stable weather.",
      "Bike choice matters more here than almost anywhere else. A bike with good ground clearance and torque low in the rev range — like the Royal Enfield Himalayan — handles the broken sections far better than a road-focused machine.",
      "Acclimatize in Leh for at least a day before heading further. Altitude sickness is the single biggest risk on this route, not the roads themselves.",
    ],
    coverImage: "https://picsum.photos/seed/blog-ladakh/1200/700",
    publishedAt: "2026-05-12",
    author: "BIKIE Editorial",
  },
  {
    slug: "5-pre-ride-checks-every-rider-should-know",
    title: "5 Pre-Ride Checks Every Rider Should Know",
    category: "Maintenance",
    excerpt: "A two-minute routine that catches most of the problems that ruin road trips before they start.",
    content: [
      "Tyres: check pressure and look for embedded objects or unusual wear before every ride, not just long trips.",
      "Chain: a slack, dry chain is the most common roadside failure on rentals. Look for consistent tension and a light sheen of lubricant.",
      "Brakes: squeeze both levers before moving off. Spongy feel or excessive travel means the bike needs attention before you go further.",
      "Lights: indicators, headlight, and brake light — thirty seconds of walking around the bike saves a dangerous night-time surprise.",
      "Fuel and fluids: don't rely on the gauge alone in remote areas — carry a mental note of your last fill-up distance.",
    ],
    coverImage: "https://picsum.photos/seed/blog-checks/1200/700",
    publishedAt: "2026-04-02",
    author: "BIKIE Editorial",
  },
  {
    slug: "goa-coastal-route-weekend-itinerary",
    title: "Goa's Coastal Route: A Perfect Weekend Itinerary",
    category: "Routes",
    excerpt: "Skip the highway. This two-day loop hits every beach worth stopping at, with just enough riding to feel like an adventure.",
    content: [
      "Day one: start in North Goa, riding the coastal road down through Baga, Anjuna, and Vagator before lunch at a cliffside shack.",
      "Afternoon: continue south along the coast to Palolem, arriving in time for sunset.",
      "Day two: loop back inland through the Western Ghats foothills for a change of scenery before returning to your pickup point.",
      "Total distance is under 200km across both days — comfortable even for less experienced riders.",
    ],
    coverImage: "https://picsum.photos/seed/blog-goa-route/1200/700",
    publishedAt: "2026-03-18",
    author: "BIKIE Editorial",
  },
  {
    slug: "royal-enfield-himalayan-450-review",
    title: "Royal Enfield Himalayan 450: Long-Term Review",
    category: "Reviews",
    excerpt: "After 3,000km across three states, here's what actually holds up about BIKIE's most-booked adventure bike.",
    content: [
      "The new 452cc Sherpa engine is the biggest improvement over the outgoing model — smoother, more responsive, and noticeably better on long highway stretches.",
      "Suspension travel remains excellent for broken mountain roads, though the seat firms up on rides past four hours.",
      "Fuel efficiency settled around 30km/l in mixed conditions, in line with the spec sheet.",
      "Verdict: still the default recommendation for first-time Himalayan riders on BIKIE.",
    ],
    coverImage: "https://picsum.photos/seed/blog-himalayan-review/1200/700",
    publishedAt: "2026-02-25",
    author: "BIKIE Editorial",
  },
];
