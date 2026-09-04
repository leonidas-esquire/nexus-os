import { defineRailway, github, project, service } from "railway/iac";

export default defineRailway(() => {
  const web = service("nexus-site", {
    source: github("leonidas-esquire/nexus-os", { branch: "main" }),
    build: "pnpm build",
    start: "pnpm start",
    healthcheck: "/api/health",
    healthcheckTimeout: 300,
    replicas: 1,
  });

  return project("nexus-os", {
    resources: [web],
  });
});
