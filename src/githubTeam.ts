import * as pulumi from "@pulumi/pulumi"
import { Team } from "@pulumi/github"
import { TeamPrivacy } from "./config"

export type GithubTeamArgs = {
  teamName: string
  privacy?: TeamPrivacy
  parentTeamId?: pulumi.Input<string>
  description?: string
}

export class GithubTeam extends pulumi.ComponentResource {
  public readonly team: Team
  public readonly id: pulumi.Output<string>

  constructor(name: string, args: GithubTeamArgs, opts?: pulumi.ComponentResourceOptions) {
    super("user-mgmt:github:Team", name, {}, opts)

    this.team = new Team(
      name,
      {
        name: args.teamName,
        privacy: args.privacy ?? "closed",
        parentTeamId: args.parentTeamId,
        description: args.description,
      },
      { parent: this }
    )
    this.id = this.team.id
    this.registerOutputs({ id: this.id })
  }
}
