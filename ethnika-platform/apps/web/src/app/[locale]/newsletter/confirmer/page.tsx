import { NewsletterTokenPage, tokenMetadata, type TokenPageProps } from "@/components/sections/NewsletterTokenPage";

export const generateMetadata = tokenMetadata("confirm");

export default function ConfirmNewsletterPage(props: TokenPageProps) {
  return <NewsletterTokenPage {...props} action="confirm" />;
}
