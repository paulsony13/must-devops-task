import * as pulumi from "@pulumi/pulumi"
import { identitystore } from "@pulumi/aws"
import { groupMembershipResourceName } from "./naming"

export type AwsSsoUserArgs = {
  env: string
  identityStoreId: pulumi.Input<string>
  userName: string
  displayName: string
  email: string
  groups: Array<{ groupName: string; groupId: pulumi.Input<string> }>
}

export class AwsSsoUser extends pulumi.ComponentResource {
  public readonly user: identitystore.User
  public readonly userId: pulumi.Output<string>
  public readonly memberships: Array<identitystore.GroupMembership>

  constructor(name: string, args: AwsSsoUserArgs, opts?: pulumi.ComponentResourceOptions) {
    super("user-mgmt:aws:SsoUser", name, {}, opts)

    const nameParts = args.displayName.split(" ")
    const givenName = nameParts[0] ?? args.userName
    const familyName = nameParts.slice(1).join(" ") || givenName

    this.user = new identitystore.User(
      name,
      {
        identityStoreId: args.identityStoreId,
        userName: args.userName,
        displayName: args.displayName,
        name: {
          givenName,
          familyName,
        },
        emails: {
          value: args.email,
          primary: true,
          type: "work",
        },
      },
      { parent: this }
    )
    this.userId = this.user.userId

    this.memberships = args.groups.map(
      ({ groupName, groupId }) =>
        new identitystore.GroupMembership(
          groupMembershipResourceName(args.env, groupName, args.userName),
          {
            identityStoreId: args.identityStoreId,
            groupId,
            memberId: this.userId,
          },
          { parent: this }
        )
    )

    this.registerOutputs({ userId: this.userId })
  }
}
