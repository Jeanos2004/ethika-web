import { BadRequestException, PipeTransform } from "@nestjs/common";
import { z } from "zod";

/**
 * Validation stricte d'une entrée par un schéma Zod (équivalent de ValidationPipe whitelist + forbidNonWhitelisted :
 * les schémas sont `strict`, tout champ inconnu est refusé). Réponse : clés d'erreur par champ, jamais les valeurs reçues.
 */
export class ZodPipe<T extends z.ZodType> implements PipeTransform<unknown, z.infer<T>> {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.infer<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({ error: "invalid_input", fields: z.flattenError(result.error).fieldErrors });
    }
    return result.data;
  }
}
