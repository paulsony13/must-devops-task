import * as pulumi from "@pulumi/pulumi"
import { Config, PermissionSetName } from "./config"
import { GithubTeam } from "./githubTeam"
import { GithubUser } from "./githubUser"
import { AwsPermissionSet } from "./awsPermissionSet"
import { AwsSsoGroup } from "./awsSsoGroup"
import { AwsSsoUser } from "./awsSsoUser"
import { permissionSetResourceName, ssoGroupResourceName, ssoUserResourceName, teamResourceName } from "./naming"
import { permissionSetCatalog } from "./policies"

export type UserManagementArgs = {
  env: string
  config: Config
}

export class UserManagement extends pulumi.ComponentResource {
  public readonly teams: Record<string, GithubTeam>
  public readonly groups: Record<string, AwsSsoGroup>
  public readonly users: Array<GithubUser | AwsSsoUser>
  public readonly permissionSets: Record<string, AwsPermissionSet>

  constructor(name: string, args: UserManagementArgs, opts?: pulumi.ComponentResourceOptions) {
    super("user-mgmt:core:UserManagement", name, {}, opts)

    const { config, env } = args
    const { identityStoreId, ssoInstanceArn } = config.organization.aws

    this.teams = {}
    for (const team of config.teams) {
      this.teams[team.name] = new GithubTeam(
        teamResourceName(env, team.name),
        {
          teamName: team.name,
          privacy: team.privacy,
          parentTeamId: team.parent ? this.teams[team.parent].id : undefined,
        },
        { parent: this }
      )
    }

    this.permissionSets = {}
    const usedPermissionSets = new Set(config.groups.map((g) => g.permissionSet))
    for (const psName of usedPermissionSets) {
      const key = psName as PermissionSetName
      this.permissionSets[key] = new AwsPermissionSet(
        permissionSetResourceName(env, key),
        {
          instanceArn: ssoInstanceArn,
          displayName: `${env}-${key}`,
          policy: permissionSetCatalog[key],
        },
        { parent: this }
      )
    }

    this.groups = {}
    for (const group of config.groups) {
      const ps = this.permissionSets[group.permissionSet]
      this.groups[group.name] = new AwsSsoGroup(
        ssoGroupResourceName(env, group.name),
        {
          env,
          identityStoreId,
          instanceArn: ssoInstanceArn,
          displayName: `${env}-${group.name}`,
          description: `${group.name} group managed by Pulumi`,
          permissionSetArn: ps.arn,
          accounts: group.accounts.map((accountName) => ({
            accountName,
            accountId: config.accounts[accountName],
          })),
        },
        { parent: this }
      )
    }

    this.users = []
    for (const user of config.users) {
      const githubUser = new GithubUser(
        `gh-${user.githubHandle}`,
        {
          env,
          handle: user.githubHandle,
          role: user.githubRole,
          teamAssignments: [
            {
              teamName: user.githubTeam,
              teamId: this.teams[user.githubTeam].id,
            },
          ],
        },
        { parent: this }
      )
      this.users.push(githubUser)

      const ssoUser = new AwsSsoUser(
        ssoUserResourceName(env, user.githubHandle),
        {
          env,
          identityStoreId,
          userName: user.githubHandle,
          displayName: user.name,
          email: user.email,
          groups: [
            {
              groupName: user.awsGroup,
              groupId: this.groups[user.awsGroup].groupId,
            },
          ],
        },
        { parent: this }
      )
      this.users.push(ssoUser)
    }

    this.registerOutputs({
      teamCount: Object.keys(this.teams).length,
      groupCount: Object.keys(this.groups).length,
      userCount: config.users.length,
    })
  }
}
