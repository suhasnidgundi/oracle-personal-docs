import type { Route } from "./+types/doc";
import {
  getDocBySlug,
  getNavTree,
  getSearchIndex,
  getRelatedDocs,
} from "~/lib/content.server";
import { DocsLayout } from "~/components/layout/DocsLayout";
import { DocPage } from "~/components/docs/DocPage";

export function meta({ data }: Route.MetaArgs) {
  if (!data?.doc) {
    return [
      { title: "Not Found — Oracle Personal Docs" },
      { name: "description", content: "The requested documentation page could not be found." },
    ];
  }

  const { frontmatter } = data.doc;
  return [
    { title: `${frontmatter.title} — Oracle Personal Docs` },
    {
      name: "description",
      content: `${frontmatter.title} - ${frontmatter.module.toUpperCase()} ${frontmatter.contentType} documentation for Oracle Fusion.`,
    },
    { name: "keywords", content: frontmatter.tags?.join(", ") || "" },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const slug = params["*"];
  if (!slug) {
    throw new Response("Not Found", { status: 404 });
  }

  const doc = getDocBySlug(slug);
  if (!doc) {
    throw new Response("Not Found", { status: 404 });
  }

  const navTree = getNavTree();
  const searchIndex = getSearchIndex();
  const relatedDocs = doc.frontmatter.related
    ? getRelatedDocs(doc.frontmatter.related)
    : [];

  return { doc, navTree, searchIndex, relatedDocs };
}

export default function DocRoute({ loaderData }: Route.ComponentProps) {
  const { doc, navTree, searchIndex, relatedDocs } = loaderData;

  return (
    <DocsLayout navTree={navTree} searchIndex={searchIndex}>
      <DocPage doc={doc} relatedDocs={relatedDocs} />
    </DocsLayout>
  );
}
