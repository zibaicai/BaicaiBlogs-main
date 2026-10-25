"use client";

import DirectoryExplorer from "./DirectoryExplorer";
import type { Project } from "../lib/api";

const GithubIcon = () => (
  <svg
    className="w-8 h-8 text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors flex-shrink-0"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"
    />
  </svg>
);

export default function ProjectsBoard({ projects }: { projects: Project[] }) {
  const tagCounts: Record<string, number> = {};
  projects.forEach((project) => {
    (project.tags || []).forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const filters = [
    { value: "all", label: "全部项目", count: projects.length },
    ...Object.keys(tagCounts)
      .map((tag) => ({ value: tag, label: tag, count: tagCounts[tag] }))
      .sort((a, b) => b.count - a.count),
  ];

  const items = projects.map((project) => ({
    key: project.projectId,
    node: (
      <a
        href={project.githubUrl || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="directory-card group p-8 md:p-10"
      >
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />

        <div className="flex items-start justify-between mb-8 relative z-10">
          <div className="flex items-center gap-5 min-w-0">
            <span className="text-5xl group-hover:scale-110 transition-transform duration-500">
              {project.icon || "🚀"}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
              {project.name}
            </h2>
          </div>
          <GithubIcon />
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300 font-serif leading-relaxed line-clamp-3 mb-10 relative z-10 min-h-[60px]">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2 relative z-10">
          {(project.tags || []).map((tag) => (
            <span
              key={tag}
              className="directory-tag border border-indigo-500/10 px-3 py-1.5 uppercase tracking-widest"
            >
              {tag}
            </span>
          ))}
        </div>
      </a>
    ),
    searchText: [project.name, project.description, ...(project.tags || [])].join(" "),
    filterValues: project.tags || [],
  }));

  return (
    <div className="directory-shell mt-0 py-0">
      <DirectoryExplorer
        eyebrow="BAICAI / PROJECTS"
        title="项目矩阵"
        subtitle="把脑中的星图，慢慢搭成可以落脚的云。"
        count={`${projects.length} 个项目`}
        items={items}
        filters={filters}
        searchPlaceholder="搜索项目、代号或技术栈..."
        empty="没有匹配的项目。"
      />
    </div>
  );
}
