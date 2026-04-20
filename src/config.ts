export type TeamName = string
export type AccountName = string
export type GroupName = string
export type PermissionSetName = "DeveloperAccess" | "ReadOnly" | "BillingViewer"

export type MembershipRole = "member" | "admin"
export type TeamPrivacy = "closed" | "secret"

export type OrganizationConfig = {
  githubOwner: string
  aws: {
    identityStoreId: string
    ssoInstanceArn: string
  }
}

export type TeamConfig = {
  name: TeamName
  privacy?: TeamPrivacy
  parent?: TeamName
}

export type GroupConfig = {
  name: GroupName
  accounts: Array<AccountName>
  permissionSet: PermissionSetName
}

export type UserConfig = {
  name: string
  email: string
  githubHandle: string
  githubTeam: TeamName
  githubRole?: MembershipRole
  awsAccount: AccountName
  awsGroup: GroupName
}

export type Config = {
  organization: OrganizationConfig
  accounts: Record<AccountName, string>
  teams: Array<TeamConfig>
  groups: Array<GroupConfig>
  users: Array<UserConfig>
}
