import { imageInfo } from "./image-info";
import { mediaIdOf } from "./media.service";
import { readingMinutes } from "../content/content.schemas";

/** JPEG minimal : SOI, segment APP0 puis SOF0 (hauteur 480, largeur 640). */
const jpeg = Buffer.from("ffd8ffe000104a46494600010100000100010000ffc0001108" + "01e0" + "0280" + "03012200021101031101", "hex");
/** WebP « VP8X » : largeur et hauteur codées moins un sur 24 bits (800 × 600). */
const webp = Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBPVP8X"), Buffer.alloc(8), Buffer.from([0x1f, 0x03, 0x00, 0x57, 0x02, 0x00])]);

describe("reconnaissance des images", () => {
  it("lit le type et les dimensions d'un JPEG et d'un WebP", () => {
    expect(imageInfo(jpeg)).toEqual({ mimeType: "image/jpeg", width: 640, height: 480 });
    expect(imageInfo(webp)).toEqual({ mimeType: "image/webp", width: 800, height: 600 });
  });

  it("refuse SVG, GIF et texte, quel que soit le nom annoncé", () => {
    expect(imageInfo(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBeNull();
    expect(imageInfo(Buffer.from("GIF89a\x01\x00\x01\x00"))).toBeNull();
    expect(imageInfo(Buffer.from("bonjour"))).toBeNull();
  });

  it("retrouve l'identifiant d'un média depuis son adresse, jamais depuis une autre", () => {
    expect(mediaIdOf("/media/0b5c7a3e-1d2f-4c6b-9a8e-7f6d5c4b3a21.jpg")).toBe("0b5c7a3e-1d2f-4c6b-9a8e-7f6d5c4b3a21");
    expect(mediaIdOf("/images/plage.jpg")).toBeNull();
    expect(mediaIdOf("https://cdn.example.com/media/0b5c7a3e-1d2f-4c6b-9a8e-7f6d5c4b3a21.jpg")).toBeNull();
  });

  it("estime le temps de lecture à environ 200 mots par minute", () => {
    expect(readingMinutes("Court.")).toBe(1);
    expect(readingMinutes(Array(1000).fill("mot").join(" "))).toBe(5);
  });
});
