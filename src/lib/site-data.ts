import { randomUUID } from "node:crypto";

import { connectDB } from "@/lib/mongodb";
import { serializeRecords } from "@/lib/mongo-record";
import { Category } from "@/models/Category";
import { Collection } from "@/models/Collection";
import { HeroSlide } from "@/models/HeroSlide";
import { HomepageSection } from "@/models/HomepageSection";
import { Product } from "@/models/Product";
import { Settings } from "@/models/Settings";
import { Testimonial } from "@/models/Testimonial";

export type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  categoryId: string;
  collectionId?: string;
  sku: string;
  stock: number;
  availability: string;
  status: "draft" | "active" | "inactive";
  featured: boolean;
  image: string;
  images: string[];
  thumbnail?: string;
  tags: string[];
  material?: string;
  dimensions?: string;
  color?: string;
  customizable: boolean;
  seoTitle?: string;
  seoDescription?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CategoryRecord = { id: string; name: string; slug: string; description?: string; image?: string; active: boolean; createdAt: string; updatedAt: string };
export type CollectionRecord = { id: string; name: string; slug: string; description?: string; image?: string; active: boolean; featured: boolean; sortOrder: number; createdAt: string; updatedAt: string };
export type HeroSlideRecord = { id: string; eyebrow: string; title: string; description: string; image: string; primaryButtonText: string; primaryButtonUrl: string; secondaryButtonText: string; secondaryButtonUrl: string; active: boolean; order: number; createdAt: string; updatedAt: string };
export type HomepageSection = { id: string; key: string; title: string; subtitle: string; description: string; image?: string; buttonText?: string; buttonLink?: string; enabled: boolean; order: number };
export type WebsiteSettings = { websiteName: string; logo: string; favicon?: string; contactEmail: string; phone: string; whatsapp: string; address: string; socialLinks: { label: string; url: string }[]; defaultSeoTitle: string; defaultSeoDescription: string };
export type TestimonialRecord = { id: string; name: string; role: string; quote: string; image?: string; active: boolean };
export type SiteData = { products: ProductRecord[]; categories: CategoryRecord[]; collections: CollectionRecord[]; heroSlides: HeroSlideRecord[]; homepageSections: HomepageSection[]; testimonials: TestimonialRecord[]; settings: WebsiteSettings };

export async function readSiteData(): Promise<SiteData> {
  await connectDB();
  const [products, categories, collections, heroSlides, homepageSections, testimonials, settings] = await Promise.all([
    Product.find().sort({ createdAt: -1 }).lean(),
    Category.find().sort({ name: 1 }).lean(),
    Collection.find().sort({ sortOrder: 1 }).lean(),
    HeroSlide.find().sort({ order: 1 }).lean(),
    HomepageSection.find().sort({ order: 1 }).lean(),
    Testimonial.find().sort({ createdAt: -1 }).lean(),
    Settings.findById("site-settings").lean(),
  ]);

  return {
    products: serializeRecords(products as Array<Record<string, unknown>>) as ProductRecord[],
    categories: serializeRecords(categories as Array<Record<string, unknown>>) as CategoryRecord[],
    collections: serializeRecords(collections as Array<Record<string, unknown>>) as CollectionRecord[],
    heroSlides: serializeRecords(heroSlides as Array<Record<string, unknown>>) as HeroSlideRecord[],
    homepageSections: serializeRecords(homepageSections as Array<Record<string, unknown>>) as HomepageSection[],
    testimonials: serializeRecords(testimonials as Array<Record<string, unknown>>) as TestimonialRecord[],
    settings: settings as unknown as WebsiteSettings,
  };
}

export function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

export function createId(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}
