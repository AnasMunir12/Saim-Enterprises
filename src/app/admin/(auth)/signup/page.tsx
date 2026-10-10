import { notFound } from "next/navigation";

// Public admin signup does not exist. Customers register at /signup.
export default function AdminSignupDisabledPage() {
  notFound();
}
