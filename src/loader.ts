import * as fs from "fs"
import * as path from "path"
import * as yaml from "js-yaml"
import { Config, UserConfig, GroupConfig, TeamConfig } from "./config"

type RawUser = {
  name: string
  email: string
  github_handle: string
  github_team: string
  github_role?: "member" | "admin"
  aws_account: string
  aws_group: string
}

type RawGroup = {
  name: string
  accounts: Array<string>
  permission_set: string
}

type RawTeam = {
  name: string
  privacy?: "closed" | "secret"
  parent?: string
}

type RawConfig = {
  organization: {
    github_owner: string
    aws: {
      identity_store_id: string
      sso_instance_arn: string
    }
  }
  accounts: Record<string, string>
  teams: Array<RawTeam | string>
  groups: Array<RawGroup>
  users: Array<RawUser>
}

const normalizeTeam = (t: RawTeam | string): TeamConfig =>
  typeof t === "string" ? { name: t } : { name: t.name, privacy: t.privacy, parent: t.parent }

const normalizeGroup = (g: RawGroup): GroupConfig => ({
  name: g.name,
  accounts: g.accounts,
  permissionSet: g.permission_set as GroupConfig["permissionSet"],
})

const normalizeUser = (u: RawUser): UserConfig => ({
  name: u.name,
  email: u.email,
  githubHandle: u.github_handle,
  githubTeam: u.github_team,
  githubRole: u.github_role,
  awsAccount: u.aws_account,
  awsGroup: u.aws_group,
})

const validate = (cfg: Config): void => {
  const teamNames = new Set(cfg.teams.map((t) => t.name))
  const groupNames = new Set(cfg.groups.map((g) => g.name))
  const accountNames = new Set(Object.keys(cfg.accounts))
  const permissionSets = new Set(["DeveloperAccess", "ReadOnly", "BillingViewer"])

  for (const t of cfg.teams) {
    if (t.parent && !teamNames.has(t.parent)) {
      throw new Error(`team '${t.name}' references unknown parent '${t.parent}'`)
    }
  }

  for (const g of cfg.groups) {
    if (!permissionSets.has(g.permissionSet)) {
      throw new Error(`group '${g.name}' uses unknown permission set '${g.permissionSet}'`)
    }
    for (const a of g.accounts) {
      if (!accountNames.has(a)) {
        throw new Error(`group '${g.name}' references unknown account '${a}'`)
      }
    }
  }

  const seen = new Set<string>()
  for (const u of cfg.users) {
    if (seen.has(u.githubHandle)) {
      throw new Error(`duplicate github handle '${u.githubHandle}'`)
    }
    seen.add(u.githubHandle)

    if (!teamNames.has(u.githubTeam)) {
      throw new Error(`user '${u.name}' references unknown team '${u.githubTeam}'`)
    }
    if (!accountNames.has(u.awsAccount)) {
      throw new Error(`user '${u.name}' references unknown account '${u.awsAccount}'`)
    }
    if (!groupNames.has(u.awsGroup)) {
      throw new Error(`user '${u.name}' references unknown group '${u.awsGroup}'`)
    }

    const group = cfg.groups.find((g) => g.name === u.awsGroup)!
    if (!group.accounts.includes(u.awsAccount)) {
      throw new Error(
        `user '${u.name}' assigned to account '${u.awsAccount}' but group '${u.awsGroup}' is not assigned to that account`
      )
    }
  }
}

export const loadConfig = (filePath: string): Config => {
  const abs = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath)
  const raw = yaml.load(fs.readFileSync(abs, "utf8")) as RawConfig

  const cfg: Config = {
    organization: {
      githubOwner: raw.organization.github_owner,
      aws: {
        identityStoreId: raw.organization.aws.identity_store_id,
        ssoInstanceArn: raw.organization.aws.sso_instance_arn,
      },
    },
    accounts: raw.accounts,
    teams: raw.teams.map(normalizeTeam),
    groups: raw.groups.map(normalizeGroup),
    users: raw.users.map(normalizeUser),
  }

  validate(cfg)
  return cfg
}
