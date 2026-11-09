import { connectDB } from "@/lib/mongodb";
import { defaultBrandHero, type BrandHeroConfig } from "@/lib/brand-hero";
import { BrandHero } from "@/models/BrandHero";

export async function getBrandHero(): Promise<BrandHeroConfig> {
  try {
    await connectDB();
    const hero = await BrandHero.findById("brand-hero").lean<BrandHeroConfig>();
    return hero ? { ...defaultBrandHero, ...hero } : defaultBrandHero;
  } catch (error) {
    console.error("Brand hero read failed:", error);
    return defaultBrandHero;
  }
}
