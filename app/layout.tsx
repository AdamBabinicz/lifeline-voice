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
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "LifeLine Voice — Emergency Response Command",
  description:
    "Hands-free, real-time emergency first aid assistant powered by AI. Immediate voice guidance for CPR, choking, bleeding and trauma.",
  keywords: [
    "first aid",
    "CPR",
    "emergency",
    "resuscitation",
    "AED",
    "medical assistant",
    "hands-free",
    "voice AI",
  ],
  authors: [{ name: "LifeLine Voice Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "LifeLine Voice — Emergency Response Command",
    description:
      "Hands-free, real-time emergency first aid assistant. Immediate voice guidance for life-threatening situations.",
    type: "website",
    locale: "pl_PL",
    alternateLocale: "en_US",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LifeLine Voice",
  },
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
        {/* GOOGLE CONSENT MODE V2 DEFAULT INITIALIZATION */}
        <Script
          id="google-consent-mode-default"
          strategy="beforeInteractive"
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

        {/* GOOGLE TAG MANAGER */}
        {GTM_ID && (
          <Script
            id="gtm-loader"
            strategy="afterInteractive"
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

        {/* GOOGLE ANALYTICS 4 */}
        {GA4_ID && (
          <>
            <Script
              id="ga4-loader"
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
            />
            <Script
              id="ga4-config"
              strategy="afterInteractive"
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
              style={{ display: "none", visibility: "hidden" }}
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
