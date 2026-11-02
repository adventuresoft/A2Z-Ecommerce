import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "admin-lte/dist/css/adminlte.min.css";
import "./globals.css";
import { AdminLayoutProvider, AdminLayout } from "@/components/layout";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Admin Dashboard — A to Z E-Commerce",
  description: "Back-office operations, catalog, and order management portal",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/Logo.png",
  },
};

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
      className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: EXTENSION_CLEANUP_SCRIPT }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="layout-fixed sidebar-expand-lg bg-body-tertiary min-vh-100"
      >
        <AuthProvider>
          <AdminLayoutProvider>
            <AdminLayout>{children}</AdminLayout>
          </AdminLayoutProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
