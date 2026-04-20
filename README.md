# user-management

Pulumi project that manages GitHub organization membership and AWS IAM Identity
Center (SSO) users from a single YAML config file. TypeScript on Node 20.

## What it manages

- GitHub teams (at least `backend` and `frontend`).
- GitHub users: org membership + team membership.
- AWS IAM Identity Center users, groups, group memberships.
- AWS SSO permission sets with least-privilege policies.
- Account assignments (which group gets which permission set on which account).

## Prerequisites

- Node.js 20 and npm.
- Pulumi CLI (`brew install pulumi`).
- AWS account with IAM Identity Center already enabled:
  - Identity Store ID (`d-xxxxxxxxxx`), visible in the IAM Identity Center console.
  - SSO instance ARN (`arn:aws:sso:::instance/ssoins-xxxx`).
- GitHub org admin token (`admin:org`, `read:user`).
- Pulumi Cloud account + access token.

## Layout

```
.
├── index.ts                  entrypoint
├── config/users.yaml         single source of truth
├── src/
│   ├── config.ts             typed schema
│   ├── loader.ts             yaml loader + cross-reference validation
│   ├── naming.ts             resource naming helpers
│   ├── policies.ts           permission-set catalog
│   ├── githubTeam.ts
│   ├── githubUser.ts
│   ├── awsPermissionSet.ts
│   ├── awsSsoGroup.ts
│   ├── awsSsoUser.ts
│   └── userManagement.ts     top-level component
├── tests/                    jest unit tests
├── examples/users.sample.yaml
└── .github/workflows/        preview on PR, apply on main
```

## Single config file

All users, teams, groups, accounts, and org identifiers live in `config/users.yaml`.
Per-user `aws_account` and `github_team` fields drive the assignment; the loader
fails fast if they reference something not declared elsewhere in the file.

```yaml
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
```

## One-time setup

```
npm install
pulumi login
pulumi stack init dev
pulumi config set --secret github:token <TOKEN>
```

AWS credentials come from the environment (`aws sso login` locally, OIDC in CI).

## Local workflow

```
npm run build     # type-check
npm test          # unit tests
pulumi preview --stack dev
pulumi up --stack dev
```

## Adding a user

1. Add an entry under `users:` in `config/users.yaml`.
2. Commit, open a PR. CI runs `pulumi preview` and posts the diff on the PR.
3. Merge to `main`. CI applies after the `dev` environment approval gate.

The loader rejects the config with a clear error if:

- a user's `github_team` or `aws_account` or `aws_group` is not declared
- the `aws_group` is not assigned to the user's `aws_account`
- a `github_handle` is duplicated across users
- a group references an unknown permission set

## Adding a permission set

Edit `src/policies.ts`. Each entry has managed policy ARNs, an optional inline
policy, a session duration, and a description. Reference it by name from a group
in the YAML config.

## Multi-environment support

The default setup uses a single stack (`dev`). If you also need a separate
target (e.g., a sandbox GitHub org or a staging AWS SSO instance), create an
additional stack and override the two identifiers in the config file per-stack:

```
pulumi stack init sandbox
pulumi config set github:owner my-sandbox-org
pulumi config set sso:identityStoreId d-9067sandbox
```

Everything else (teams, groups, users) stays in the single `config/users.yaml`.

## CI

- `.github/workflows/preview.yml` runs on every PR to `main`: tests + `pulumi preview`.
- `.github/workflows/apply.yml` runs on push to `main`: tests + `pulumi up` gated
  on the `dev` GitHub environment approval.

Required repo secrets:

- `PULUMI_ACCESS_TOKEN`
- `GH_ORG_ADMIN_TOKEN`
- `AWS_DEPLOY_ROLE_ARN` (an IAM role trusted by GitHub's OIDC provider)

## Tests

```
npm test
```

Covers config validation, naming helpers, and component wiring via
`pulumi.runtime.setMocks`.
