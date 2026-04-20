import * as pulumi from "@pulumi/pulumi"

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    const id = `${args.name}-id`
    return {
      id,
      state: {
        ...args.inputs,
        arn:
          args.inputs.arn ??
          `arn:aws:mock:::${args.type.replace(/:/g, "/")}/${args.name}`,
        groupId: id,
        userId: id,
      },
    }
  },
  call: (args: pulumi.runtime.MockCallArgs) => args.inputs,
})

import { GithubTeam } from "../src/githubTeam"
import { AwsPermissionSet } from "../src/awsPermissionSet"
import { AwsSsoGroup } from "../src/awsSsoGroup"
import { permissionSetCatalog } from "../src/policies"

const promiseOf = <T>(output: pulumi.Output<T>): Promise<T> =>
  new Promise((resolve) => output.apply(resolve))

describe("components", () => {
  it("GithubTeam defaults to closed privacy", async () => {
    const team = new GithubTeam("team-backend", { teamName: "backend" })
    const privacy = await promiseOf(team.team.privacy as pulumi.Output<string>)
    expect(privacy).toBe("closed")
  })

  it("AwsPermissionSet uses policy from catalog", async () => {
    const ps = new AwsPermissionSet("ps-readonly", {
      instanceArn: "arn:aws:sso:::instance/ssoins-test",
      displayName: "ReadOnly",
      policy: permissionSetCatalog.ReadOnly,
    })
    const sessionDuration = await promiseOf(
      ps.permissionSet.sessionDuration as pulumi.Output<string>
    )
    expect(sessionDuration).toBe("PT8H")
  })

  it("AwsSsoGroup creates one AccountAssignment per account", async () => {
    const group = new AwsSsoGroup("group-operators", {
      env: "dev",
      identityStoreId: "d-123",
      instanceArn: "arn:aws:sso:::instance/ssoins-test",
      displayName: "operators",
      permissionSetArn: "arn:aws:sso:::permissionSet/ssoins-test/ps-readonly",
      accounts: [
        { accountName: "dev", accountId: "111111111111" },
        { accountName: "prod", accountId: "222222222222" },
      ],
    })
    expect(group.assignments).toHaveLength(2)
  })
})
