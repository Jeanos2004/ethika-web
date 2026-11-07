import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import type { Response } from "express";

/**
 * Réponses d'erreur génériques : jamais de pile, de requête SQL ni de donnée personnelle renvoyée au client.
 * Les erreurs inattendues sont journalisées côté serveur avec leur seul message technique.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("HTTP");

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      res.status(status).json(typeof body === "object" ? body : { error: body });
      return;
    }
    // Message technique seulement (jamais le corps de requête) ; robuste aux erreurs venant d'un autre contexte (worker, VM).
    const message = exception && typeof exception === "object" && "message" in exception ? String((exception as { message: unknown }).message) : String(exception);
    this.logger.error(message.slice(0, 500));
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: "internal_error" });
  }
}
