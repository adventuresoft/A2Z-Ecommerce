import type { Metadata } from "next";
import { Inter, Hind_Siliguri } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["bengali"],
  variable: "--font-hind-siliguri",
  display: "swap",
});

export const metadata: Metadata = {
  title: "A to Z Ecommerce | Best Tech & Best Deals",
  description:
    "Bangladesh's trusted destination for genuine electronics, smartphones, laptops, audio gear and everyday essentials with best prices and official warranty.",
};

import { StoreProvider } from "../context/StoreContext";
import { AuthProvider } from "../context/AuthContext";

const EXTENSION_CLEANUP_SCRIPT = `
(function () {
  try {
    var EXT_ATTRS = ['bis_skin_checked', 'bis_register', 'bis_id', 'bis_size'];
    function isExtAttr(name) {
      return EXT_ATTRS.indexOf(name) !== -1 || name.indexOf('__processed_') === 0 || name.indexOf('bis_') === 0;
    }
    function cleanNode(node) {
      if (!node || node.nodeType !== 1 || !node.attributes) return;
      for (var i = node.attributes.length - 1; i >= 0; i--) {
        var attrName = node.attributes[i].name;
        if (isExtAttr(attrName)) {
          node.removeAttribute(attrName);
        }
      }
    }
    function cleanTree(root) {
      if (!root) return;
      cleanNode(root);
      if (root.querySelectorAll) {
        var els = root.querySelectorAll('[bis_skin_checked],[bis_register],[bis_id],[bis_size]');
        for (var i = 0; i < els.length; i++) {
          cleanNode(els[i]);
        }
      }
    }
    cleanTree(document.documentElement);
    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.type === 'attributes' && m.attributeName && isExtAttr(m.attributeName)) {
          m.target.removeAttribute(m.attributeName);
        } else if (m.type === 'childList' && m.addedNodes) {
          for (var j = 0; j < m.addedNodes.length; j++) {
            cleanTree(m.addedNodes[j]);
          }
        }
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true
    });
    window.addEventListener('load', function () {
      setTimeout(function () {
        observer.disconnect();
      }, 4000);
    }, { once: true });
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${hindSiliguri.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: EXTENSION_CLEANUP_SCRIPT }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="font-sans antialiased bg-[#F8FAFC] text-[#0F172A] min-h-screen overflow-x-hidden"
      >
        <AuthProvider>
          <StoreProvider>{children}</StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
