import ArchiveCard from "../components/ArchiveCard";
import DirectoryExplorer from "../components/DirectoryExplorer";
import type { Project } from "../lib/api";

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
      <ArchiveCard
        external
        href={project.githubUrl || "#"}
        alt={project.name}
        media={
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-slate-900/30 text-5xl">
            {project.icon || "🚀"}
          </div>
        }
        eyebrow="PROJECT"
        title={project.name}
        description={project.description}
        badges={(project.tags || []).map((tag) => (
          <span key={tag} className="archive-badge">#{tag}</span>
        ))}
        meta={project.githubUrl ? "GitHub" : undefined}
      />
    ),
    searchText: [project.name, project.description, ...(project.tags || [])].join(" "),
    filterValues: project.tags || [],
  }));

  return (
    <div className="directory-shell mt-0 py-0">
      <DirectoryExplorer
        eyebrow="BAICAI / BUILDS"
        title="项目现场"
        subtitle="一些正在生长、也允许慢慢完成的东西。"
        count={`${projects.length} 个项目`}
        items={items}
        filters={filters}
        compact
        searchPlaceholder="搜索项目、代号或技术栈..."
        empty="还没有公开的项目。"
      />
    </div>
  );
}
