import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render";
import { Markdown, markdownToc, mdxToMarkdown } from "@/lib/markdown";

vi.mock("@/i18n/navigation", () => ({ Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => <a href={href} className={className}>{children}</a> }));

const source = `Premier paragraphe avec **gras**, *italique* et un [lien](/contact).
Suite du même paragraphe.

## Kassa, la fêtarde

- Plages
- Restaurants

1. Réserver
2. Partir

> « Une image qu'on n'oublie pas. »

| Vous cherchez… | Choisissez |
| --- | --- |
| Calme | **Roume** |

![Plage et îlot](/images/conakry-plage-ilot.jpg "Photo d'illustration.")

:::cta /circuits
Envie de partir ?
Escapade de 2 jours.
Voir les circuits
:::

:::todo
Texte à rédiger.
:::`;

describe("Markdown des articles", () => {
  it("rend titres, listes, citation, tableau, figure, encart et paragraphes", () => {
    const { container } = renderWithIntl(<Markdown source={source} />);
    expect(screen.getByRole("heading", { level: 2, name: "Kassa, la fêtarde" }).getAttribute("id")).toBe("kassa-la-fetarde");
    expect(container.querySelector("p")?.textContent).toBe("Premier paragraphe avec gras, italique et un lien. Suite du même paragraphe.");
    expect(container.querySelector("strong")?.textContent).toBe("gras");
    expect(container.querySelector("em")?.textContent).toBe("italique");
    expect(screen.getByRole("link", { name: "lien" }).getAttribute("href")).toBe("/contact");
    expect(container.querySelectorAll("ul > li")).toHaveLength(2);
    expect(container.querySelectorAll("ol > li")).toHaveLength(2);
    expect(container.querySelector("blockquote")?.textContent).toContain("Une image");
    expect(screen.getByRole("columnheader", { name: "Choisissez" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "Roume" })).toBeTruthy();
    expect(screen.getByText("Photo d'illustration.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Voir les circuits" }).getAttribute("href")).toBe("/circuits");
    expect(screen.getByText("Texte à rédiger.")).toBeTruthy();
  });

  it("n'interprète jamais de HTML ni de lien dangereux, et ignore les images externes", () => {
    const { container } = renderWithIntl(<Markdown source={'<img src=x onerror="alert(1)"> [clic](javascript:alert(1))\n\n![x](https://evil.example.com/a.jpg)'} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toContain('<img src=x onerror="alert(1)">');
  });

  it("construit le sommaire avec les mêmes ancres que le rendu", () => {
    expect(markdownToc("## Kassa, la **fêtarde**\n\ntexte\n\n### Pas au sommaire\n\n## Tamara")).toEqual([
      { id: "kassa-la-fetarde", label: "Kassa, la fêtarde" },
      { id: "tamara", label: "Tamara" },
    ]);
  });

  it("convertit les composants des articles MDX existants", () => {
    const md = mdxToMarkdown('Intro\n\n<Figure src="/images/a.jpg" alt="Plage" caption="Légende" />\n\n<CtaCard href="/x" title="T" text="Texte" label="Voir" />\n\n<Todo>[À rédiger]</Todo>');
    expect(md).toBe('Intro\n\n![Plage](/images/a.jpg "Légende")\n\n:::cta /x\nT\nTexte\nVoir\n:::\n\n:::todo\n[À rédiger]\n:::');
  });
});
