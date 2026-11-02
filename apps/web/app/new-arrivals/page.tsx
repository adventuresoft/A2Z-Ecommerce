import { permanentRedirect } from "next/navigation";

export default function LegacyNewArrivalsPage() {
  permanentRedirect("/collections/new-arrivals");
}
