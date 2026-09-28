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

export const formatPrice = (price: number) => `PKR ${price.toLocaleString("en-PK")}`;
