import * as pulumi from "@pulumi/pulumi"
import { ssoadmin } from "@pulumi/aws"
import { PolicyDefinition } from "./policies"

export type AwsPermissionSetArgs = {
  instanceArn: pulumi.Input<string>
  displayName: string
  policy: PolicyDefinition
}

export class AwsPermissionSet extends pulumi.ComponentResource {
  public readonly permissionSet: ssoadmin.PermissionSet
  public readonly arn: pulumi.Output<string>

  constructor(name: string, args: AwsPermissionSetArgs, opts?: pulumi.ComponentResourceOptions) {
    super("user-mgmt:aws:PermissionSet", name, {}, opts)

    this.permissionSet = new ssoadmin.PermissionSet(
      name,
      {
        name: args.displayName,
        instanceArn: args.instanceArn,
        sessionDuration: args.policy.sessionDuration,
        description: args.policy.description,
      },
      { parent: this }
    )

    args.policy.managedPolicies.forEach((managedArn, idx) => {
      new ssoadmin.ManagedPolicyAttachment(
        `${name}-mp-${idx}`,
        {
          instanceArn: args.instanceArn,
          managedPolicyArn: managedArn,
          permissionSetArn: this.permissionSet.arn,
        },
        { parent: this }
      )
    })

    if (args.policy.inlinePolicy) {
      new ssoadmin.PermissionSetInlinePolicy(
        `${name}-inline`,
        {
          instanceArn: args.instanceArn,
          permissionSetArn: this.permissionSet.arn,
          inlinePolicy: args.policy.inlinePolicy,
        },
        { parent: this }
      )
    }

    this.arn = this.permissionSet.arn
    this.registerOutputs({ arn: this.arn })
  }
}
