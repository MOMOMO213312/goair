// English translations.
// Keep this file's key structure IDENTICAL to ar.ts (same nesting, same keys).

const en = {
  common: {
    appName: "GoAir",
    loading: "Loading...",
    tryAgain: "Try again",
    home: "Home",
  },
  header: {
    home: "Home",
    explore: "Explore",
    packages: "Packages",
    subscriptions: "Subscriptions",
    myTrips: "My Trips",
    trackBooking: "Track my booking",
    menu: "Menu",
  },
  languageToggle: {
    label: "Language",
    ar: "عربي",
    en: "English",
  },
  notFound: {
    title: "Page not found",
    body: "The page you're looking for doesn't exist or has moved.",
    backHome: "Back to home",
  },
  errorPage: {
    title: "This page failed to load",
    body: "Something went wrong on our end. Try refreshing or go back home.",
    retry: "Try again",
    home: "Home",
  },
  footer: {
    tagline:
      "Shared transport to and from Egypt & Lebanon's airports — fixed price, known schedules, and someone waiting for you by name in arrivals.",
    emailPlaceholder: "Your email",
    subscribe: "Subscribe",
    invalidEmail: "Enter a valid email address.",
    subscribeSuccess: "You're on the mailing list.",
    subscribeError: "We couldn't register your email.",
    goairHeading: "GoAir",
    myBookings: "My Bookings",
    partnerPrograms: "Partner Programs",
    contactUs: "Contact Us",
    policiesHeading: "Policies",
    faq: "FAQ",
    privacy: "Privacy Policy",
    terms: "Terms & Conditions",
    trustedRiders: "+10,000 riders have trusted us with their trip",
    tagFooter: "Hand on the land, eye on the sky.",
  },
  home: {
    meta: {
      title: "GoAir — Shared airport transfers in Egypt & Lebanon",
      description:
        "Book your seat on shared transport to and from Egypt & Lebanon's airports: fixed price per seat, fixed schedules, and pickup right outside the airport.",
      ogDescription: "Fixed price, known schedules, and pickup outside the airport — no haggling.",
    },
    errorLoadingTrips: {
      title: "We can't load routes right now",
      body: "Try refreshing the page in a moment.",
    },
    hero: {
      badge: "Egypt & Lebanon — available now",
      title: "Your trip starts here",
      subtitle: "Complete travel solutions designed for every journey",
      imageAlt: "Airport runway at sunset",
      statActiveRoutes: "active route",
      statCountrySingular: "country available now",
      statCountryPlural: "countries available now",
      statSupport: "support",
    },
    faq: {
      title: "Quick questions",
      q1: "Where will I meet the driver?",
      a1: "A clear meeting point right outside the airport — details show up on your ticket after booking is confirmed.",
      q2: "Does the price change?",
      a2: "The price shown per seat is fixed — you won't see a different price at checkout.",
      q3: "How do I track my booking?",
      a3: "From the \"My Bookings\" page — enter the ticket code you received after booking.",
    },
  },
} as const;

export default en;
