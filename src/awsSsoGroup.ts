import * as pulumi from "@pulumi/pulumi"
import { identitystore, ssoadmin } from "@pulumi/aws"
import { accountAssignmentResourceName } from "./naming"

export type AwsSsoGroupArgs = {
  env: string
  identityStoreId: pulumi.Input<string>
  instanceArn: pulumi.Input<string>
  displayName: string
  description?: string
  permissionSetArn: pulumi.Input<string>
  accounts: Array<{ accountName: string; accountId: string }>
}

export class AwsSsoGroup extends pulumi.ComponentResource {
  public readonly group: identitystore.Group
  public readonly groupId: pulumi.Output<string>
  public readonly assignments: Array<ssoadmin.AccountAssignment>

  constructor(name: string, args: AwsSsoGroupArgs, opts?: pulumi.ComponentResourceOptions) {
    super("user-mgmt:aws:SsoGroup", name, {}, opts)

    this.group = new identitystore.Group(
      name,
      {
        identityStoreId: args.identityStoreId,
        displayName: args.displayName,
        description: args.description,
      },
      { parent: this }
    )
    this.groupId = this.group.groupId

    this.assignments = args.accounts.map(
      ({ accountName, accountId }) =>
        new ssoadmin.AccountAssignment(
          accountAssignmentResourceName(args.env, args.displayName, accountName),
          {
            instanceArn: args.instanceArn,
            permissionSetArn: args.permissionSetArn,
            principalId: this.groupId,
            principalType: "GROUP",
            targetId: accountId,
            targetType: "AWS_ACCOUNT",
          },
          { parent: this }
        )
    )

    this.registerOutputs({ groupId: this.groupId })
  }
}
