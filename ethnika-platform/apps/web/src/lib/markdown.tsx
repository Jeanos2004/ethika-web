import type { ComponentType, ReactNode } from "react";
import { components } from "@/mdx-components";
import { slugify } from "@/lib/slug";

/*
 * Articles rédigés dans le back-office : Markdown limité, transformé ici en éléments React (jamais en HTML brut,
 * jamais évalué comme du MDX). Le rendu reprend les composants contrôlés des articles MDX (src/mdx-components.tsx).
 *
 *   ## Intertitre   ### Sous-titre   - liste   1. liste   > citation   | tableau |
 *   **gras**  *italique*  [lien](/page)  ![texte alternatif](/media/… "légende")
 *   :::cta /lien            :::todo
 *   Titre                   Texte à rédiger
 *   Texte                   :::
 *   Libellé du bouton
 *   :::
 */

type Props = { children?: ReactNode; href?: string; src?: string; alt?: string; caption?: string; title?: string; text?: string; label?: string };
const C = components as Record<string, ComponentType<Props>>;
const Fragment = ({ children }: Props) => <>{children}</>;
const El = (name: string) => C[name] ?? Fragment;
/** Composants résolus une fois pour toutes (jamais créés pendant le rendu). */
const X = {
  p: El("p"),
  h2: El("h2"),
  h3: El("h3"),
  a: El("a"),
  ul: El("ul"),
  ol: El("ol"),
  blockquote: El("blockquote"),
  table: El("table"),
  thead: El("thead"),
  tr: El("tr"),
  th: El("th"),
  td: El("td"),
  Figure: El("Figure"),
  CtaCard: El("CtaCard"),
  Todo: El("Todo"),
};

/** Gras, italique et liens dans une ligne de texte. */
export function inline(text: string, key = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|(?<![\w*])[*_](?![\s*_])(.+?)(?<!\s)[*_](?![\w*])|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${n++}`;
    if (m[1] !== undefined) out.push(<strong key={k}>{inline(m[1], k)}</strong>);
    else if (m[2] !== undefined) out.push(<em key={k}>{inline(m[2], k)}</em>);
    else out.push(<X.a key={k} href={m[4]}>{inline(m[3] ?? "", k)}</X.a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());

/** Intertitres « ## » du corps, avec les mêmes ancres que le rendu (sommaire de l'article). */
export function markdownToc(body: string): { id: string; label: string }[] {
  return [...body.matchAll(/^##\s+(.+)$/gm)].map((m) => {
    const label = (m[1] ?? "").replace(/\*\*|[*_]/g, "").trim();
    return { id: slugify(label), label };
  });
}

/** Corps d'un article en éléments React. */
export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    const key = `b${blocks.length}`;
    const trimmed = line.trim();
    if (!trimmed) {
      i++;
      continue;
    }

    // Blocs ::: (encart d'appel à l'action, contenu à rédiger).
    const fence = /^:::(cta|todo)\s*(\S*)\s*$/.exec(trimmed);
    if (fence) {
      const inner: string[] = [];
      i++;
      while (i < lines.length && (lines[i] ?? "").trim() !== ":::") inner.push((lines[i++] ?? "").trim());
      i++;
      const content = inner.filter(Boolean);
      if (fence[1] === "todo") {
        blocks.push(<X.Todo key={key}>{inline(content.join(" "), key)}</X.Todo>);
      } else {
        blocks.push(<X.CtaCard key={key} href={fence[2] ?? ""} title={content[0] ?? ""} text={content[1] ?? ""} label={content[2] ?? ""} />);
      }
      continue;
    }

    const heading = /^(#{2,3})\s+(.+)$/.exec(trimmed);
    if (heading) {
      const children = inline(heading[2] ?? "", key);
      blocks.push(heading[1] === "##" ? <X.h2 key={key}>{children}</X.h2> : <X.h3 key={key}>{children}</X.h3>);
      i++;
      continue;
    }

    const figure = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/.exec(trimmed);
    if (figure) {
      blocks.push(<X.Figure key={key} src={figure[2] ?? ""} alt={figure[1] ?? ""} caption={figure[3]} />);
      i++;
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quote: string[] = [];
      while (i < lines.length && (lines[i] ?? "").trim().startsWith(">")) quote.push((lines[i++] ?? "").trim().replace(/^>\s?/, ""));
      blocks.push(
        <X.blockquote key={key}>
          <X.p>{inline(quote.join(" "), key)}</X.p>
        </X.blockquote>,
      );
      continue;
    }

    if (/^[-*]\s+/.test(trimmed) || /^\d+[.)]\s+/.test(trimmed)) {
      const ordered = /^\d/.test(trimmed);
      const items: string[] = [];
      const marker = ordered ? /^\d+[.)]\s+/ : /^[-*]\s+/;
      while (i < lines.length && marker.test((lines[i] ?? "").trim())) items.push((lines[i++] ?? "").trim().replace(marker, ""));
      const lis = items.map((it, j) => <li key={j}>{inline(it, `${key}-${j}`)}</li>);
      blocks.push(ordered ? <X.ol key={key}>{lis}</X.ol> : <X.ul key={key}>{lis}</X.ul>);
      continue;
    }

    if (trimmed.startsWith("|") && /^\|?\s*:?-{3,}/.test((lines[i + 1] ?? "").trim())) {
      const head = cells(trimmed);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && (lines[i] ?? "").trim().startsWith("|")) rows.push(cells(lines[i++] ?? ""));
      blocks.push(
        <X.table key={key}>
          <X.thead>
            <X.tr>
              {head.map((h, j) => (
                <X.th key={j}>{inline(h, `${key}-h${j}`)}</X.th>
              ))}
            </X.tr>
          </X.thead>
          <tbody>
            {rows.map((r, ri) => (
              <X.tr key={ri}>
                {head.map((_, j) => (
                  <X.td key={j}>{inline(r[j] ?? "", `${key}-${ri}-${j}`)}</X.td>
                ))}
              </X.tr>
            ))}
          </tbody>
        </X.table>,
      );
      continue;
    }

    // Paragraphe : lignes consécutives jusqu'à une ligne vide ou un autre bloc.
    const para: string[] = [];
    while (i < lines.length) {
      const l = (lines[i] ?? "").trim();
      if (!l || /^(#{2,3}\s|>|[-*]\s|\d+[.)]\s|:::|!\[|\|)/.test(l)) break;
      para.push(l);
      i++;
    }
    if (para.length === 0) {
      // Ligne isolée qui ressemble à un bloc mais n'en est pas un (ex. « | » seul) : texte simple.
      para.push(trimmed);
      i++;
    }
    blocks.push(<X.p key={key}>{inline(para.join(" "), key)}</X.p>);
  }
  return <>{blocks}</>;
}

/** Article MDX du site → Markdown du back-office (reprise des articles existants). */
export function mdxToMarkdown(mdx: string): string {
  const attr = (tag: string, name: string) => new RegExp(`${name}="([^"]*)"`).exec(tag)?.[1] ?? "";
  return mdx
    .replace(/\r\n?/g, "\n")
    .replace(/<Figure\b[^>]*\/>/g, (tag) => `![${attr(tag, "alt")}](${attr(tag, "src")}${attr(tag, "caption") ? ` "${attr(tag, "caption")}"` : ""})`)
    .replace(/<CtaCard\b[^>]*\/>/g, (tag) => `:::cta ${attr(tag, "href")}\n${attr(tag, "title")}\n${attr(tag, "text")}\n${attr(tag, "label")}\n:::`)
    .replace(/<Todo>([\s\S]*?)<\/Todo>/g, (_, text: string) => `:::todo\n${text.trim()}\n:::`)
    .trim();
}
