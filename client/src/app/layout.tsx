import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plumfield Stores · Leadership Simulation",
  description: "Real-time multi-team retail leadership simulation for Plumfield Stores.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-full">
        <div id="app-root" className="h-screen w-screen overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
