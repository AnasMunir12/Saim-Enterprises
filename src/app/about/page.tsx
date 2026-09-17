import { PageChrome } from "@/components/layout/PageChrome";
import { EditorialSection } from "@/components/home/EditorialSection";
import { CustomDesignSection } from "@/components/home/CustomDesignSection";

export default function AboutPage() {
  return <PageChrome><section className="page-hero"><p className="eyebrow">The Saim point of view</p><h1>Made slowly.<br /><em>Made with feeling.</em></h1></section><section className="info-page"><div><p className="eyebrow">Our story</p><h2>Home is in the details.</h2></div><div><p>Saim Enterprises creates handcrafted home décor, lighting and personalized pieces from our studio in Lahore. We work with wood, light, acrylic and carefully chosen finishing details to make objects that feel at home in your home.</p><p>Our work is rooted in useful beauty: pieces made to be lived with, gifted with meaning and kept for a long time.</p></div></section><EditorialSection /><CustomDesignSection /></PageChrome>;
}
