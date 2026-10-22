import { getProjects } from "@/lib/api";

export const revalidate = 60;
export const metadata = { title: "项目" };

export default async function ProjectsPage() {
  const projects = await getProjects();
  return (
    <>
      <h1 style={{ marginTop: 28 }}>项目（{projects.length}）</h1>
      {projects.map((p) => (
        <div className="card" key={p.id}>
          <h2 style={{ margin: "0 0 6px" }}>{p.name}</h2>
          {p.description && <p className="muted">{p.description}</p>}
          {p.githubUrl && <a href={p.githubUrl} target="_blank" rel="noreferrer">源码</a>}
        </div>
      ))}
    </>
  );
}
