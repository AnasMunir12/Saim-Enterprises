import { ArrowRight, Camera, MessageCircle } from "lucide-react";
import { WHATSAPP_LINK } from "@/lib/constants";
import { galleryImages } from "@/lib/homeData";

export function NewsletterSection() {
  return (
    <>
      <section className="social-gallery">
        <div className="section-row">
          <div>
            <p className="eyebrow">Follow the feeling</p>
            <h2>From our studio.</h2>
          </div>
          <a className="text-link" href="#top">
            <Camera size={16} /> @saimenterprises
          </a>
        </div>

        <div className="gallery-grid">
          {galleryImages.map((image, index) => (
            <img key={`${image}-${index}`} src={image} alt="Saim Enterprises handcrafted interior décor" />
          ))}
        </div>
      </section>

      <section className="newsletter">
        <div>
          <p className="eyebrow">Stay a while</p>
          <h2>
            Bring your idea to
            <br />
            <em>life.</em>
          </h2>
        </div>

        <div className="newsletter-actions">
          <form onSubmit={(event) => event.preventDefault()}>
            <input type="email" placeholder="Your email address" aria-label="Email address" required />
            <button type="submit" aria-label="Subscribe to newsletter">
              <ArrowRight size={18} />
            </button>
            <small>New releases, studio notes and custom project updates.</small>
          </form>

          <a className="whatsapp-inline" href={`${WHATSAPP_LINK}?text=Hi%20Saim%20Enterprises,%20I%20would%20like%20to%20discuss%20a%20custom%20piece.`}>
            <MessageCircle size={17} />
            Chat on WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}
