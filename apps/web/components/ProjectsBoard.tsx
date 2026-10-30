import ArchiveItemCard from "../components/ArchiveItemCard";
import DirectoryExplorer from "../components/DirectoryExplorer";
import { formatDay, type Project } from "../lib/api";
import { repoProviderLabel } from "../lib/repo";

export default function ProjectsBoard({ projects }: { projects: Project[] }) {
  const tagCounts: Record<string, number> = {};
  projects.forEach((project) => {
    const primaryTag = project.tags?.[0];
    if (primaryTag) tagCounts[primaryTag] = (tagCounts[primaryTag] || 0) + 1;
  });

  const filters = [
    { value: "all", label: "全部项目", count: projects.length },
    ...Object.keys(tagCounts)
      .map((tag) => ({ value: tag, label: tag, count: tagCounts[tag] }))
      .sort((a, b) => b.count - a.count),
  ];

  const items = projects.map((project) => {
    const primaryTag = project.tags?.[0];
    return {
      key: project.projectId,
      node: (
        <ArchiveItemCard
          layout="profile"
          external
          href={project.githubUrl || "#"}
          title={project.name}
          description={project.description}
          label={project.createdAt ? `收录于 ${formatDay(project.createdAt)}` : undefined}
          category="PROJECT"
          tags={project.tags || []}
          cornerBadge={repoProviderLabel(project.githubUrl)}
          media={{ kind: "icon", content: project.icon || "🚀" }}
        />
      ),
      searchText: [project.name, project.description, ...(project.tags || [])].join(" "),
      filterValues: primaryTag ? [primaryTag] : [],
      title: project.name,
      tags: project.tags,
      date: project.createdAt,
    };
  });


  return (
    <div className="directory-shell mt-0 py-0">
      <DirectoryExplorer
        eyebrow="BAICAI / BUILDS"
        title="项目现场"
        subtitle="一些正在生长、也允许慢慢完成的东西。"
        count={`${projects.length} 个项目`}
        items={items}
        filters={filters}
        views={["grid", "timeline", "masonry"]}
        gridVariant="profile"
        searchPlaceholder="搜索项目、代号或技术栈..."
        empty="还没有公开的项目。"
      />
    </div>
  );
}
