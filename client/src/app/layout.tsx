import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Store Is Yours · Plumfield Stores",
  description: "Four weeks to lead the people, priorities and performance. A live, multi-team retail leadership simulation for Plumfield Stores.",
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
