import { connectDB } from "@/lib/mongodb";
import { resolveHomepageSections, type ResolvedSection, type SavedSection } from "@/lib/homepage-sections";
import { HomepageSection } from "@/models/HomepageSection";

/** Server-side read of the homepage layout. A database failure yields the built-in layout, never an error page. */
export async function getHomepageSections(): Promise<ResolvedSection[]> {
  try {
    await connectDB();
    const saved = await HomepageSection.find().lean<SavedSection[]>();
    return resolveHomepageSections(saved);
  } catch (error) {
    console.error("Homepage sections read failed:", error);
    return resolveHomepageSections([]);
  }
}
