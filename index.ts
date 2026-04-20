import * as pulumi from "@pulumi/pulumi"
import * as github from "@pulumi/github"
import { loadConfig } from "./src/loader"
import { UserManagement } from "./src/userManagement"

const stackConfig = new pulumi.Config()
const env = stackConfig.require("env")
const configFile = stackConfig.require("configFile")

const cfg = loadConfig(configFile)

const githubProvider = new github.Provider(`${env}-github`, {
  owner: cfg.organization.githubOwner,
})

const userMgmt = new UserManagement(
  `user-management-${env}`,
  { env, config: cfg },
  { providers: { github: githubProvider } }
)

export const teamCount = Object.keys(userMgmt.teams).length
export const groupCount = Object.keys(userMgmt.groups).length
export const userCount = cfg.users.length
export const githubOwner = cfg.organization.githubOwner
