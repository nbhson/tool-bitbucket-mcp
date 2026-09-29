import { apiClient } from "../config.js";
import { pageParams, toPage, type PaginationArgs } from "../pagination.js";

/** The user bound to BITBUCKET_TOKEN — needed to resolve reviewer names. */
export async function handleGetCurrentUser() {
  const response = await apiClient.get("/rest/api/1.0/users/current");
  const u = response.data;
  return {
    name: u.name,
    slug: u.slug,
    displayName: u.displayName,
    emailAddress: u.emailAddress,
    active: u.active,
    type: u.type,
  };
}

export async function handleSearchUsers(args: { query: string } & PaginationArgs) {
  const { query, ...page } = args;
  const { limit, start } = pageParams(page);
  const response = await apiClient.get("/rest/api/1.0/users", {
    params: { filter: query, limit, start },
  });
  const envelope = toPage(response.data, limit, start);
  return {
    ...envelope,
    values: envelope.values.map((u: any) => ({
      name: u.name,
      slug: u.slug,
      displayName: u.displayName,
      emailAddress: u.emailAddress,
      active: u.active,
    })),
  };
}
