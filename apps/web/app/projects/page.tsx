import Navbar from "../../components/Navbar";
import PageTransition from "../../components/PageTransition";
import ProjectsBoard from "../../components/ProjectsBoard";
import { getProjects } from "../../lib/server-api";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "项目现场",
  description: "正在生长与已经落地的项目记录",
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <div className="mt-28">
          <ProjectsBoard projects={projects} />
        </div>
      </PageTransition>
    </div>
  );
}
