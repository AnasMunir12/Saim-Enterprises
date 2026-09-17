export type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  category: string;
  image: string;
  detail: string;
  rating: number;
  reviews: number;
  badge?: string;
  featured?: boolean;
  bestseller?: boolean;
};

export const categories = [
  "All pieces",
  "Lighting",
  "Wall decor",
  "Wooden art",
  "Custom gifts",
  "Seasonal",
];

export const products: Product[] = [
  {
    id: "geometra-lamp",
    name: "Geometra Hanging Lamp",
    slug: "geometra-hanging-lamp",
    price: 4850,
    category: "Lighting",
    image: "https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=900&q=85",
    detail: "A sculptural light with warm geometry, handcrafted to cast an intimate glow across your room.",
    rating: 4.9,
    reviews: 24,
    badge: "Bestseller",
    featured: true,
    bestseller: true,
  },
  {
    id: "noor-lantern",
    name: "Noor Arch Lantern",
    slug: "noor-arch-lantern",
    price: 3250,
    category: "Lighting",
    image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=900&q=85",
    detail: "Laser-cut arches and a soft amber heart make this lantern an evening ritual in object form.",
    rating: 4.8,
    reviews: 18,
    badge: "New arrival",
    featured: true,
  },
  {
    id: "lineage-clock",
    name: "Lineage Wooden Clock",
    slug: "lineage-wooden-clock",
    price: 3900,
    category: "Wooden art",
    image: "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=900&q=85",
    detail: "Natural wood grain, precise CNC detailing, and a quiet face for considered interiors.",
    rating: 4.7,
    reviews: 12,
    featured: true,
    bestseller: true,
  },
  {
    id: "arc-panel",
    name: "Arc Relief Panel",
    slug: "arc-relief-panel",
    price: 5600,
    category: "Wall decor",
    image: "https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=900&q=85",
    detail: "A tactile wall composition inspired by sun paths and the architectural language of home.",
    rating: 5,
    reviews: 9,
    badge: "Limited",
    featured: true,
  },
  {
    id: "ramadan-moon",
    name: "Moon & Minaret Lightbox",
    slug: "moon-minaret-lightbox",
    price: 4200,
    category: "Seasonal",
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=85",
    detail: "A gentle seasonal centerpiece with layered depth, made for nights of gathering and reflection.",
    rating: 4.9,
    reviews: 31,
    badge: "Seasonal",
    bestseller: true,
  },
  {
    id: "keepsake-box",
    name: "The Keepsake Box",
    slug: "the-keepsake-box",
    price: 2750,
    category: "Custom gifts",
    image: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=900&q=85",
    detail: "Personalize a keepsake in your own words, cut and finished by hand in our Lahore studio.",
    rating: 4.8,
    reviews: 16,
    badge: "Personalize",
  },
  {
    id: "beaded-sunburst",
    name: "Sunburst Beaded Mirror",
    slug: "sunburst-beaded-mirror",
    price: 6100,
    category: "Wall decor",
    image: "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=900&q=85",
    detail: "Hand-strung beads frame a small daily sun, bringing rhythm and a little ceremony to the wall.",
    rating: 4.9,
    reviews: 7,
  },
  {
    id: "eid-box",
    name: "Eid Celebration Box",
    slug: "eid-celebration-box",
    price: 1850,
    category: "Seasonal",
    image: "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=85",
    detail: "A thoughtful table detail for hosting, gifting, and the small traditions that make a home.",
    rating: 4.6,
    reviews: 14,
  },
];

export const formatPrice = (price: number) => `PKR ${price.toLocaleString("en-PK")}`;
