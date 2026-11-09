export type BrandHeroConfig = {
  enabled: boolean;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  buttonText: string;
  buttonLink: string;
};

export const defaultBrandHero: BrandHeroConfig = {
  enabled: false,
  eyebrow: "",
  title: "",
  description: "",
  image: "",
  buttonText: "",
  buttonLink: "",
};
