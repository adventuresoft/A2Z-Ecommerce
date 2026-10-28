import { redirect } from "next/navigation";

interface ProductsRedirectPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Canonical redirect from /products to /shop
 * Preserves all searchParams (e.g. ?brand=apple -> /shop?brand=apple)
 */
export default async function ProductsRedirectPage({
  searchParams,
}: ProductsRedirectPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();

  for (const [key, val] of Object.entries(params)) {
    if (Array.isArray(val)) {
      val.forEach((v) => query.append(key, v));
    } else if (val !== undefined) {
      query.set(key, val);
    }
  }

  const queryString = query.toString();
  redirect(queryString ? `/shop?${queryString}` : "/shop");
}
