import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-provider";
import { ScrollToTop } from "@/components/scroll-to-top";
import { CookieBanner } from "@/components/cookie-banner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#ff0000",
  width: "device-width",
  initialScale: 1,
};

const SITE_URL = "https://lifeline-command.netlify.app";

// Dokładnie 50 znaków
const META_TITLE = "LifeLine Voice – Asystent Pierwszej Pomocy oraz RKO";

// Dokładnie 150 znaków
const META_DESCRIPTION =
  "Głosowy asystent pierwszej pomocy i RKO. Szybkie instrukcje ratunkowe, metronom 110 BPM oraz automatyczne wsparcie w nagłych wypadkach bez użycia rąk.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: META_TITLE,
  description: META_DESCRIPTION,
  applicationName: "LifeLine Voice",
  keywords: [
    "pierwsza pomoc",
    "RKO",
    "resuscytacja",
    "asystent głosowy",
    "metronom RKO",
    "zadławienie",
    "numer 112",
    "first aid",
    "CPR assistant",
    "emergency voice",
  ],
  authors: [{ name: "Adam Gierczak", url: "https://github.com/AdamBabinicz" }],
  creator: "Adam Gierczak",
  publisher: "LifeLine Voice",
  alternates: {
    canonical: "/",
    languages: {
      pl: "/",
      en: "/",
      "x-default": "/",
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      {
        url: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: META_TITLE,
    description: META_DESCRIPTION,
    url: SITE_URL,
    siteName: "LifeLine Voice",
    images: [
      {
        url: "/images/2.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "LifeLine Voice – Emergency Response Command",
      },
      {
        url: "/web-app-manifest-512x512.png",
        width: 512,
        height: 512,
        type: "image/png",
        alt: "LifeLine Voice Icon",
      },
    ],
    locale: "pl_PL",
    alternateLocale: ["en_US"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: META_TITLE,
    description: META_DESCRIPTION,
    images: [
      {
        url: "/images/1.png",
        width: 1200,
        height: 630,
        alt: "LifeLine Voice – Emergency Response Command",
      },
    ],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LifeLine Voice",
  },
  category: "medical",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "LifeLine Voice",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/web-app-manifest-512x512.png`,
        width: 512,
        height: 512,
      },
      description: META_DESCRIPTION,
      founder: {
        "@type": "Person",
        "@id": `${SITE_URL}/#author`,
        name: "Adam Gierczak",
        url: "https://github.com/AdamBabinicz",
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "112",
        contactType: "emergency",
        areaServed: "PL",
        availableLanguage: ["Polish", "English"],
      },
    },
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#author`,
      name: "Adam Gierczak",
      url: "https://github.com/AdamBabinicz",
      jobTitle: "Software Engineer & AI Builder",
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#app`,
      name: "LifeLine Voice",
      url: SITE_URL,
      applicationCategory: "HealthApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires modern web browser with speech support",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "PLN",
      },
      description: META_DESCRIPTION,
      inLanguage: ["pl", "en"],
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
      author: {
        "@id": `${SITE_URL}/#author`,
      },
    },
    {
      "@type": "MedicalWebPage",
      "@id": `${SITE_URL}/#webpage`,
      url: SITE_URL,
      name: META_TITLE,
      description: META_DESCRIPTION,
      about: [
        {
          "@type": "MedicalProcedure",
          name: "Cardiopulmonary Resuscitation (CPR / RKO)",
          procedureType: "EmergencyProcedure",
        },
        {
          "@type": "MedicalProcedure",
          name: "First Aid for Choking and Hemorrhage",
          procedureType: "EmergencyProcedure",
        },
      ],
      inLanguage: ["pl-PL", "en-US"],
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
      author: {
        "@id": `${SITE_URL}/#author`,
      },
      potentialAction: {
        "@type": "CommunicateAction",
        target: "tel:112",
        name: "Call Emergency Services (112)",
      },
    },
  ],
};

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        {/* SCHEMA.ORG STRUCTURED DATA (JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* GOOGLE CONSENT MODE V2 - INITIALIZACJA BEZ BŁĘDU HYDRACJI #418 */}
        <Script
          id="google-consent-mode-default"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;

              var initialAnalytics = 'denied';
              var initialMarketing = 'denied';
              try {
                var stored = localStorage.getItem('lifeline_cookie_consent_v1');
                if (stored) {
                  var parsed = JSON.parse(stored);
                  if (parsed) {
                    if (parsed.analytics) initialAnalytics = 'granted';
                    if (parsed.marketing) initialMarketing = 'granted';
                  }
                }
              } catch(e) {}

              gtag('consent', 'default', {
                'analytics_storage': initialAnalytics,
                'ad_storage': initialMarketing,
                'ad_user_data': initialMarketing,
                'ad_personalization': initialMarketing,
                'wait_for_update': 500
              });
            `,
          }}
        />

        {/* GOOGLE TAG MANAGER - LAZY ONLOAD */}
        {GTM_ID && (
          <Script
            id="gtm-loader"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${GTM_ID}');
              `,
            }}
          />
        )}

        {/* GOOGLE ANALYTICS 4 - LAZY ONLOAD */}
        {GA4_ID && (
          <>
            <Script
              id="ga4-loader"
              strategy="lazyOnload"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
            />
            <Script
              id="ga4-config"
              strategy="lazyOnload"
              dangerouslySetInnerHTML={{
                __html: `
                  gtag('js', new Date());
                  gtag('config', '${GA4_ID}', {
                    page_path: window.location.pathname,
                    anonymize_ip: true
                  });
                `,
              }}
            />
          </>
        )}

        {/* GTM NOSCRIPT FALLBACK */}
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
            />
          </noscript>
        )}

        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <LanguageProvider>
            {children}
            <CookieBanner />
            <ScrollToTop />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
