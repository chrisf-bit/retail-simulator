import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Store Is Yours · Plumfield Stores",
  description: "Four weeks to lead the people, priorities and performance. A live, multi-team retail leadership simulation for Plumfield Stores.",
};

// Apply the saved theme before first paint so there is no dark->light flash on
// load. Runs inline in <head>; defaults to dark when nothing is stored.
const themeInit = `(function(){try{var t=localStorage.getItem("theme");if(t==="light")document.documentElement.setAttribute("data-theme","light");}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="h-full">
        <div id="app-root" className="h-screen w-screen overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
