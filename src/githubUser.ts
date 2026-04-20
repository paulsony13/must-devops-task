import * as pulumi from "@pulumi/pulumi"
import { Membership, TeamMembership } from "@pulumi/github"
import { MembershipRole } from "./config"
import { membershipResourceName, teamMembershipResourceName } from "./naming"

export type GithubUserArgs = {
  env: string
  handle: string
  role?: MembershipRole
  teamAssignments: Array<{
    teamName: string
    teamId: pulumi.Input<string>
  }>
}

export class GithubUser extends pulumi.ComponentResource {
  public readonly membership: Membership
  public readonly teamMemberships: Array<TeamMembership>

  constructor(name: string, args: GithubUserArgs, opts?: pulumi.ComponentResourceOptions) {
    super("user-mgmt:github:User", name, {}, opts)

    this.membership = new Membership(
      membershipResourceName(args.env, args.handle),
      {
        username: args.handle,
        role: args.role ?? "member",
      },
      { parent: this }
    )

    const role: "maintainer" | "member" = args.role === "admin" ? "maintainer" : "member"
    this.teamMemberships = args.teamAssignments.map(
      ({ teamName, teamId }) =>
        new TeamMembership(
          teamMembershipResourceName(args.env, teamName, args.handle),
          {
            teamId,
            username: args.handle,
            role,
          },
          { parent: this, dependsOn: [this.membership] }
        )
    )

    this.registerOutputs({})
  }
}
