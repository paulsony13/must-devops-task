export const makeName = (env: string, kind: string, name: string): string => {
  const slug = `${env}-${kind}-${name}`.toLowerCase().replace(/[^a-z0-9-]/g, "-")
  if (slug.length > 64) {
    throw new Error(`resource name too long: ${slug}`)
  }
  return slug
}

export const teamResourceName = (env: string, team: string) => makeName(env, "gh-team", team)
export const membershipResourceName = (env: string, handle: string) => makeName(env, "gh-membership", handle)
export const teamMembershipResourceName = (env: string, team: string, handle: string) =>
  makeName(env, "gh-tm", `${team}-${handle}`)

export const ssoUserResourceName = (env: string, handle: string) => makeName(env, "sso-user", handle)
export const ssoGroupResourceName = (env: string, group: string) => makeName(env, "sso-group", group)
export const groupMembershipResourceName = (env: string, group: string, handle: string) =>
  makeName(env, "sso-gm", `${group}-${handle}`)
export const permissionSetResourceName = (env: string, name: string) => makeName(env, "ps", name)
export const accountAssignmentResourceName = (env: string, group: string, account: string) =>
  makeName(env, "aa", `${group}-${account}`)
