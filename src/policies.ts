import { PermissionSetName } from "./config"

export type PolicyDefinition = {
  managedPolicies: Array<string>
  inlinePolicy?: string
  sessionDuration: string
  description: string
}

const denyPrivilegedActions = JSON.stringify({
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Deny",
      Action: [
        "iam:*",
        "organizations:*",
        "account:*",
        "sso:*",
        "identitystore:*",
      ],
      Resource: "*",
    },
  ],
})

export const permissionSetCatalog: Record<PermissionSetName, PolicyDefinition> = {
  DeveloperAccess: {
    managedPolicies: ["arn:aws:iam::aws:policy/PowerUserAccess"],
    inlinePolicy: denyPrivilegedActions,
    sessionDuration: "PT8H",
    description: "Developer access with PowerUser privileges scoped away from IAM/Org changes",
  },
  ReadOnly: {
    managedPolicies: ["arn:aws:iam::aws:policy/ReadOnlyAccess"],
    sessionDuration: "PT8H",
    description: "Read-only access across all services",
  },
  BillingViewer: {
    managedPolicies: ["arn:aws:iam::aws:policy/job-function/Billing"],
    sessionDuration: "PT4H",
    description: "View billing and cost data",
  },
}
