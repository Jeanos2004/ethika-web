import { NewsletterTokenPage, tokenMetadata, type TokenPageProps } from "@/components/sections/NewsletterTokenPage";

export const generateMetadata = tokenMetadata("unsubscribe");

export default function UnsubscribeNewsletterPage(props: TokenPageProps) {
  return <NewsletterTokenPage {...props} action="unsubscribe" />;
}
