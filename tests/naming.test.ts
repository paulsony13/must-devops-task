import {
  makeName,
  teamResourceName,
  ssoUserResourceName,
  accountAssignmentResourceName,
} from "../src/naming"

describe("naming", () => {
  it("lowercases and joins with dashes", () => {
    expect(makeName("Dev", "GH-Team", "Backend")).toBe("dev-gh-team-backend")
  })

  it("replaces invalid characters", () => {
    expect(makeName("dev", "gh-user", "alice@example")).toBe("dev-gh-user-alice-example")
  })

  it("throws if the result exceeds 64 characters", () => {
    expect(() => makeName("dev", "kind", "x".repeat(80))).toThrow(/too long/)
  })

  it("produces stable team resource names", () => {
    expect(teamResourceName("dev", "backend")).toBe("dev-gh-team-backend")
  })

  it("produces stable sso user resource names", () => {
    expect(ssoUserResourceName("prod", "alice")).toBe("prod-sso-user-alice")
  })

  it("produces stable account assignment names", () => {
    expect(accountAssignmentResourceName("dev", "developers", "dev")).toBe("dev-aa-developers-dev")
  })
})
