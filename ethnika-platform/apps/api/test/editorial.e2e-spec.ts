import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import type { PrismaService } from "../src/prisma/prisma.service";
import type { UsersService } from "../src/modules/auth/users.service";
import { MediaService } from "../src/modules/media/media.service";
import { adminSession, agentSession, cleanup, createApp, KEY } from "./helpers";

/** PNG 2 × 3 px valide (dimensions lues dans l'en-tête IHDR). */
const png = Buffer.from("89504e470d0a1a0a0000000d49484452000000020000000308060000009a8c5b2b0000000d4944415478da63f8ffff3f0300050001ff5c2b47d20000000049454e44ae426082", "hex");

/* Blog, galerie et images envoyées depuis le back-office. */
describe("Back-office : blog, galerie, médias (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let users: UsersService;
  let agent: { session: string };
  let admin: { session: string };
  const api = () => request(app.getHttpServer());
  const as = (s: { session: string }, r: request.Test) => r.set("x-internal-key", KEY).set("x-session-token", s.session);

  beforeAll(async () => {
    ({ app, prisma, users } = await createApp());
    agent = await agentSession(app, users, "agent");
    admin = await adminSession(app, users);
  });

  afterAll(async () => {
    await cleanup(prisma);
    await app.close();
  });

  const upload = (s: { session: string }, bytes: Buffer, type = "image/png") => as(s, api().post("/v1/admin/media")).set("content-type", type).set("x-file-name", encodeURIComponent("e2e-photo é.png")).send(bytes);

  describe("médias", () => {
    it("envoi d'une image : type reconnu par son contenu, dimensions lues, servie au site", async () => {
      const res = await upload(admin, png).expect(201);
      expect(res.body).toMatchObject({ mimeType: "image/png", width: 2, height: 3, size: png.length });
      expect(res.body.url).toMatch(/^\/media\/[0-9a-f-]{36}\.png$/);

      const served = await api().get(`/v1/public/media/${res.body.id}`).set("x-internal-key", KEY).buffer(true).expect(200);
      expect(served.headers["content-type"]).toBe("image/png");
      expect(served.headers["cache-control"]).toContain("immutable");
      expect(Buffer.compare(served.body as Buffer, png)).toBe(0);
    });

    it("refuse un faux type, un fichier vide, un agent et l'absence de clé interne", async () => {
      await upload(admin, Buffer.from("<svg onload=alert(1)>"), "image/png").expect(400);
      await upload(admin, Buffer.alloc(0)).expect(400);
      await upload(agent, png).expect(403);
      await api().get("/v1/public/media/00000000-0000-4000-8000-000000000000").expect(401);
      await api().get("/v1/public/media/00000000-0000-4000-8000-000000000000").set("x-internal-key", KEY).expect(404);
    });

    it("purge les images envoyées mais jamais utilisées, garde celles qui servent", async () => {
      const orphan = await upload(admin, png).expect(201);
      const used = await upload(admin, png).expect(201);
      await as(admin, api().post("/v1/admin/gallery")).send({ imageUrl: used.body.url, category: "vie", i18n: { fr: { alt: "Utilisée", place: "E2E" } } }).expect(201);
      const media = app.get(MediaService);
      await media.purgeOrphans(new Date(Date.now() + 1000));
      expect(await prisma.media.findUnique({ where: { id: orphan.body.id } })).toBeNull();
      expect(await prisma.media.findUnique({ where: { id: used.body.id } })).not.toBeNull();
    });

    it("refuse une image de plus de 5 Mo", async () => {
      await upload(admin, Buffer.concat([png, Buffer.alloc(5 * 1024 * 1024)])).expect(413);
    });
  });

  describe("articles du blog", () => {
    const post = {
      slug: "e2e-article",
      category: "conseils",
      imageUrl: "/images/avion-ciel.jpg",
      i18n: {
        fr: { title: "Article de test", lead: "Chapô de test.", excerpt: "Résumé.", tag: "Conseils · Test", imageAlt: "Avion", body: "## Partie\n\nTexte de l'article.", tags: ["Test"] },
        en: { title: "Test article" },
      },
    };

    it("brouillon invisible, publication datée automatiquement, lecture localisée", async () => {
      const created = await as(admin, api().post("/v1/admin/posts")).send(post).expect(201);
      expect(created.body).toMatchObject({ published: false, publishedAt: null });
      await api().get(`/v1/public/posts/${post.slug}`).set("x-internal-key", KEY).expect(404);

      const published = await as(admin, api().patch(`/v1/admin/posts/${created.body.id}`)).send({ published: true }).expect(200);
      expect(published.body.publishedAt).toBe(new Date().toISOString().slice(0, 10));

      const fr = await api().get(`/v1/public/posts/${post.slug}`).set("x-internal-key", KEY).expect(200);
      expect(fr.body).toMatchObject({ title: "Article de test", body: post.i18n.fr.body, bodyLocale: "fr", readingMinutes: 1, category: "conseils" });
      const en = await api().get(`/v1/public/posts/${post.slug}?locale=en`).set("x-internal-key", KEY).expect(200);
      // Titre traduit, corps français en repli (signalé au lecteur).
      expect(en.body).toMatchObject({ title: "Test article", lead: "Chapô de test.", bodyLocale: "fr" });
      const list = await api().get("/v1/public/posts").set("x-internal-key", KEY).expect(200);
      expect(list.body.find((p: { slug: string }) => p.slug === post.slug)).not.toHaveProperty("body");
    });

    it("slug déjà pris → 409, catégorie inconnue → 400, agent → 403", async () => {
      await as(admin, api().post("/v1/admin/posts")).send(post).expect(409);
      await as(admin, api().post("/v1/admin/posts")).send({ ...post, slug: "e2e-autre", category: "politique" }).expect(400);
      await as(agent, api().get("/v1/admin/posts")).expect(403);
    });
  });

  describe("galerie", () => {
    it("photo envoyée, publiée, puis supprimée avec son image", async () => {
      const media = await upload(admin, png).expect(201);
      const photo = await as(admin, api().post("/v1/admin/gallery"))
        .send({ imageUrl: media.body.url, category: "fouta", tall: true, i18n: { fr: { alt: "Cascade", place: "E2E" } } })
        .expect(201);
      const list = await api().get("/v1/public/gallery?locale=en").set("x-internal-key", KEY).expect(200);
      expect(list.body).toContainEqual({ id: photo.body.id, image: media.body.url, category: "fouta", tall: true, alt: "Cascade", place: "E2E" });

      await as(admin, api().patch(`/v1/admin/gallery/${photo.body.id}`)).send({ published: false }).expect(200);
      const hidden = await api().get("/v1/public/gallery").set("x-internal-key", KEY).expect(200);
      expect(hidden.body.some((p: { id: string }) => p.id === photo.body.id)).toBe(false);

      await as(admin, api().delete(`/v1/admin/gallery/${photo.body.id}`)).expect(200);
      // Plus aucun contenu ne l'utilise : l'image est supprimée elle aussi.
      expect(await prisma.media.findUnique({ where: { id: media.body.id } })).toBeNull();
    });

    it("refuse une image externe en http et une catégorie inconnue", async () => {
      await as(admin, api().post("/v1/admin/gallery")).send({ imageUrl: "http://exemple.com/a.jpg", category: "fouta", i18n: { fr: { alt: "A", place: "E2E" } } }).expect(400);
      await as(admin, api().post("/v1/admin/gallery")).send({ imageUrl: "/images/a.jpg", category: "mars", i18n: { fr: { alt: "A", place: "E2E" } } }).expect(400);
    });
  });
});
