import * as fs from "fs"
import * as path from "path"
import * as os from "os"
import { loadConfig } from "../src/loader"

const writeTemp = (content: string): string => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "um-"))
  const file = path.join(dir, "users.yaml")
  fs.writeFileSync(file, content)
  return file
}

const baseConfig = `
organization:
  github_owner: test-org
  aws:
    identity_store_id: d-123
    sso_instance_arn: arn:aws:sso:::instance/ssoins-test

accounts:
  dev: "111111111111"
  prod: "222222222222"

teams:
  - name: backend
  - name: frontend

groups:
  - name: developers
    accounts: [dev]
    permission_set: DeveloperAccess
  - name: operators
    accounts: [dev, prod]
    permission_set: ReadOnly

users:
  - name: alice
    email: alice@example.com
    github_handle: alice
    github_team: backend
    aws_account: dev
    aws_group: developers
  - name: bob
    email: bob@example.com
    github_handle: bob
    github_team: frontend
    aws_account: prod
    aws_group: operators
`

describe("loadConfig", () => {
  it("loads a valid config", () => {
    const file = writeTemp(baseConfig)
    const cfg = loadConfig(file)
    expect(cfg.users).toHaveLength(2)
    expect(cfg.teams.map((t) => t.name)).toEqual(["backend", "frontend"])
    expect(cfg.accounts.dev).toBe("111111111111")
  })

  it("rejects an unknown team reference", () => {
    const bad = baseConfig.replace("github_team: backend", "github_team: devops")
    const file = writeTemp(bad)
    expect(() => loadConfig(file)).toThrow(/unknown team 'devops'/)
  })

  it("rejects an unknown account reference", () => {
    const bad = baseConfig.replace("aws_account: dev", "aws_account: staging")
    const file = writeTemp(bad)
    expect(() => loadConfig(file)).toThrow(/unknown account 'staging'/)
  })

  it("rejects an unknown group reference", () => {
    const bad = baseConfig.replace("aws_group: developers", "aws_group: dba")
    const file = writeTemp(bad)
    expect(() => loadConfig(file)).toThrow(/unknown group 'dba'/)
  })

  it("rejects a user whose account is not in the group's accounts", () => {
    const bad = baseConfig.replace(
      `  - name: alice
    email: alice@example.com
    github_handle: alice
    github_team: backend
    aws_account: dev
    aws_group: developers`,
      `  - name: alice
    email: alice@example.com
    github_handle: alice
    github_team: backend
    aws_account: prod
    aws_group: developers`
    )
    const file = writeTemp(bad)
    expect(() => loadConfig(file)).toThrow(/group 'developers' is not assigned to that account/)
  })

  it("rejects duplicate github handles", () => {
    const bad = baseConfig.replace("github_handle: bob", "github_handle: alice")
    const file = writeTemp(bad)
    expect(() => loadConfig(file)).toThrow(/duplicate github handle 'alice'/)
  })

  it("rejects unknown permission set", () => {
    const bad = baseConfig.replace("permission_set: DeveloperAccess", "permission_set: GodMode")
    const file = writeTemp(bad)
    expect(() => loadConfig(file)).toThrow(/unknown permission set 'GodMode'/)
  })
})
