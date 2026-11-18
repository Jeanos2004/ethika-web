import { Module } from "@nestjs/common";
import { MediaModule } from "../media/media.module";
import { AdminContentController, PublicContentController } from "./content.controller";
import { ContentService } from "./content.service";
import { AdminEditorialController, PublicEditorialController } from "./editorial.controller";
import { EditorialService } from "./editorial.service";

@Module({ imports: [MediaModule], controllers: [PublicContentController, AdminContentController, PublicEditorialController, AdminEditorialController], providers: [ContentService, EditorialService] })
export class ContentModule {}
