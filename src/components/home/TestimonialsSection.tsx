"use client";

import { useEffect, useState } from "react";

type Testimonial = { name: string; role: string; quote: string; active?: boolean };

export function TestimonialsSection() {
	const [testimonial, setTestimonial] = useState<Testimonial | null>(null);

	useEffect(() => {
		fetch("/api/testimonials")
			.then(async (response) => (response.ok ? (await response.json()) as Testimonial[] : []))
			.then((items) => setTestimonial(items.find((item) => item.active !== false) ?? null))
			.catch(() => setTestimonial(null));
	}, []);

	if (!testimonial) return null;

	return <section className="testimonials section-pad"><p className="eyebrow">Kind words</p><blockquote>“{testimonial.quote}”</blockquote><p className="testimonial-name">{testimonial.name} <span>{testimonial.role || "Verified customer"}</span></p></section>;
}
