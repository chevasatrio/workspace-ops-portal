import { fetchAPI } from "@/lib/strapi";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Tag } from "lucide-react";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  try {
    const articlesRes = await fetchAPI(`/articles`, {
      filters: { slug: { $eq: params.slug } }
    }, { next: { revalidate: 60 } });
    
    if (articlesRes.data && articlesRes.data.length > 0) {
      const article = articlesRes.data[0];
      return {
        title: `${article.attributes?.title || article.title} | Knowledge Base`,
      };
    }
  } catch (e) {
    // Ignore error
  }
  return { title: "Article Not Found | Knowledge Base" };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  let article = null;
  let error = false;

  try {
    const articlesRes = await fetchAPI(`/articles`, {
      filters: { slug: { $eq: params.slug } },
      populate: "*"
    }, { next: { revalidate: 60 } });
    
    if (articlesRes.data && articlesRes.data.length > 0) {
      article = articlesRes.data[0];
    } else {
      notFound();
    }
  } catch (e) {
    error = true;
    console.error("Failed to fetch article", e);
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Error loading article</h2>
        <p className="text-slate-500 mt-2">Make sure the Strapi CMS is running.</p>
        <Link href="/knowledge-base" className="text-indigo-600 mt-4 inline-block hover:underline">
          Return to Knowledge Base
        </Link>
      </div>
    );
  }

  // Handle both Strapi v4 (attributes nested) and v5 (flat by default depending on config)
  const title = article.attributes?.title || article.title;
  const content = article.attributes?.content || article.content;
  const publishedAt = article.attributes?.publishedAt || article.publishedAt || article.createdAt;
  const categoryName = article.attributes?.category?.data?.attributes?.name || article.category?.name;

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <Link 
        href="/knowledge-base" 
        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Knowledge Base
      </Link>

      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 md:p-12 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-4">
            {categoryName && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-medium">
                <Tag className="w-3.5 h-3.5" />
                {categoryName}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(publishedAt).toLocaleDateString('id-ID', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
            {title}
          </h1>
        </div>

        <div className="p-8 md:p-12 prose prose-slate dark:prose-invert prose-indigo max-w-none">
          {/* Note: In a real app we would use react-markdown to render markdown content */}
          {/* For now, we render the raw content or fallback if not available */}
          {content ? (
            <div dangerouslySetInnerHTML={{ __html: content }} /> // If rich text returns HTML
            // Or if markdown: <ReactMarkdown>{content}</ReactMarkdown>
          ) : (
            <p className="text-slate-500 italic">No content available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
