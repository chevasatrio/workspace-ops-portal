import { fetchAPI } from "@/lib/strapi";
import Link from "next/link";
import { BookOpen, ChevronRight, Search, FileText } from "lucide-react";
import EmptyState from "@/components/EmptyState";
export const metadata = {
  title: "Knowledge Base | OpsPortal",
  description: "IT Asset & Knowledge Management",
};

export default async function KnowledgeBasePage() {
  // We'll fetch articles and categories from Strapi once it's ready.
  // For now, we'll try to fetch, and if it fails, display an empty state or error.
  let articles: any[] = [];
  let categories: any[] = [];
  let error = false;

  try {
    const articlesRes = await fetchAPI("/articles", { populate: "*", sort: ["publishedAt:desc"] }, { next: { revalidate: 60 } });
    articles = articlesRes.data || [];
    
    const categoriesRes = await fetchAPI("/categories", {}, { next: { revalidate: 60 } });
    categories = categoriesRes.data || [];
  } catch (e) {
    error = true;
    console.error("Failed to fetch from Strapi");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            Knowledge Base
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse guides, tutorials, and FAQs.
          </p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search articles..."
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {error ? (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
          <BookOpen className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-amber-800 dark:text-amber-300">Strapi CMS Not Connected</h3>
          <p className="text-amber-600 dark:text-amber-400/80 mt-1 max-w-md mx-auto">
            We couldn't connect to the Strapi backend. If it's currently installing or not running, please start it first.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4">
            {articles.length === 0 ? (
              <EmptyState 
                icon={FileText} 
                title="Tidak Ada Artikel" 
                description="Belum ada artikel panduan yang diterbitkan. Silakan cek kembali nanti." 
              />
            ) : (
              articles.map((article: any) => (
                <Link 
                  key={article.id} 
                  href={`/knowledge-base/${article.attributes?.slug || article.slug}`}
                  className="block bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                          {article.attributes?.category?.data?.attributes?.name || article.category?.name || "Uncategorized"}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(article.attributes?.publishedAt || article.publishedAt || article.createdAt).toLocaleDateString('id-ID', {
                            year: 'numeric', month: 'long', day: 'numeric'
                          })}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {article.attributes?.title || article.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                        {/* We will extract plain text or description if available */}
                        Read full guide for more details.
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sticky top-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Categories</h3>
              {categories.length === 0 ? (
                <p className="text-sm text-slate-500">No categories</p>
              ) : (
                <ul className="space-y-2">
                  {categories.map((category: any) => (
                    <li key={category.id}>
                      <Link 
                        href={`/knowledge-base?category=${category.attributes?.slug || category.slug}`}
                        className="flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        <span>{category.attributes?.name || category.name}</span>
                        {/* Optional: Add count if populated */}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
