import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/components/StoreProvider";

export const metadata: Metadata = {
  title: "Saim Enterprises | Objects with a little soul",
  description: "Handcrafted lighting, decor and custom pieces for considered homes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body><StoreProvider>{children}</StoreProvider></body>
    </html>
  );
}
