import { Category } from "@/models/Category";
import { ContentList } from "@/models/ContentList";
import { Collection } from "@/models/Collection";
import { BrandHero } from "@/models/BrandHero";
import { HeroSlide } from "@/models/HeroSlide";
import { HomepageSection } from "@/models/HomepageSection";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { Settings } from "@/models/Settings";
import { Testimonial } from "@/models/Testimonial";
import { User } from "@/models/User";

export async function isCloudinaryImageReferenced(publicId: string) {
  const match = new RegExp(`(?:^|/)${publicId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\.[a-z0-9]+)?(?:$|[?#])`, "i");
  const imageValue = { $regex: match };
  const referenced = await Promise.all([
    Product.exists({ $or: [{ image: imageValue }, { images: imageValue }, { thumbnail: imageValue }] }),
    Category.exists({ image: imageValue }),
    Collection.exists({ image: imageValue }),
    BrandHero.exists({ image: imageValue }),
    HeroSlide.exists({ image: imageValue }),
    HomepageSection.exists({ $or: [{ image: imageValue }, { "items.image": imageValue }] }),
    ContentList.exists({ "items.image": imageValue }),
    Order.exists({ "items.image": imageValue }),
    Testimonial.exists({ image: imageValue }),
    Settings.exists({ $or: [{ logo: imageValue }, { favicon: imageValue }] }),
    User.exists({ avatar: imageValue }),
  ]);

  return referenced.some(Boolean);
}
