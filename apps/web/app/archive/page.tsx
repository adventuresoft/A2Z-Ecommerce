import { permanentRedirect } from "next/navigation";

export default function LegacyArchivePage() {
  permanentRedirect("/collections/archive");
}
