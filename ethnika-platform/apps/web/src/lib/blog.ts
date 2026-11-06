import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { slugify } from "@/lib/slug";
import { getPost } from "@/content/blog";

/** Sommaire d'un article : intertitres « ## » du fichier MDX, avec les mêmes ancres que le rendu. */
export async function getToc(slug: string): Promise<{ id: string; label: string }[]> {
  if (!getPost(slug)) return []; // slug en liste blanche avant tout accès disque
  const source = await readFile(join(process.cwd(), "src", "content", "blog", `${slug}.mdx`), "utf8");
  return [...source.matchAll(/^##\s+(.+)$/gm)].map((m) => {
    const label = (m[1] ?? "").trim();
    return { id: slugify(label), label };
  });
}
