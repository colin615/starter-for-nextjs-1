import ReactMarkdown from "react-markdown";
import { readFile } from "fs/promises";
import { join } from "path";
import LogoText from "@/components/svgs/logo-text";

export default async function SharePage({ params }) {
  const { uid } = await params;

  // For now, serve hej_noah.md file
  // Later this will be replaced with a database lookup or file mapping
  const markdownPath = join(
    process.cwd(),
    "src/app/markdown/hej_noah.md"
  );

  let markdownContent = "";

  try {
    markdownContent = await readFile(markdownPath, "utf-8");
  } catch (error) {
    markdownContent = "# File Not Found\n\nThe requested document could not be found.";
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <div className="mb-8 pb-6 border-b border-stone-800">
          <LogoText />
        </div>
        <article className="prose prose-invert prose-lg max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => (
                <h1 className="text-4xl font-bold mb-6 text-stone-100" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 className="text-3xl font-bold mb-4 mt-8 text-stone-100" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="text-2xl font-bold mb-3 mt-6 text-stone-100" {...props} />
              ),
              p: ({ node, ...props }) => (
                <p className="mb-4 text-stone-300 leading-relaxed" {...props} />
              ),
              strong: ({ node, ...props }) => (
                <strong className="font-bold text-stone-100" {...props} />
              ),
            }}
          >
            {markdownContent}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}

