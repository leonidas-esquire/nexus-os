# Security Policy

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in Nexus OS, please report it responsibly.

### How to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please report vulnerabilities via one of the following methods:

1. **Email:** Send a detailed report to [security@aiagents.nexus](mailto:security@aiagents.nexus)
2. **GitHub Security Advisories:** Use [GitHub's private vulnerability reporting](https://github.com/leonidas-esquire/nexus-os/security/advisories/new)

### What to Include

When reporting a vulnerability, please include:

- **Description** — A clear description of the vulnerability
- **Impact** — What an attacker could achieve by exploiting it
- **Steps to Reproduce** — Detailed steps to reproduce the issue
- **Affected Versions** — Which versions of Nexus OS are affected
- **Proof of Concept** — If possible, include a minimal PoC
- **Suggested Fix** — If you have ideas on how to fix it

### Response Timeline

| Action | Timeline |
|--------|----------|
| Acknowledgment of report | Within 48 hours |
| Initial assessment | Within 5 business days |
| Status update | Within 10 business days |
| Fix release (critical) | Within 30 days |
| Fix release (non-critical) | Within 90 days |

### What to Expect

1. **Acknowledgment** — We will confirm receipt of your report within 48 hours
2. **Assessment** — Our security team will evaluate the severity and impact
3. **Communication** — We will keep you informed of our progress
4. **Fix** — We will develop and test a fix
5. **Disclosure** — We will coordinate disclosure timing with you
6. **Credit** — With your permission, we will credit you in the security advisory

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅ Current release |
| < 0.1   | ❌ Not supported |

## Security Best Practices

When using Nexus OS in production:

- **Keep updated** — Always run the latest version
- **Protect credentials** — Never commit API keys or secrets to version control
- **Use AXIS Trust** — Enable trust verification for agent-to-agent interactions
- **Set cost limits** — Configure budget enforcement to prevent runaway costs
- **Review audit logs** — Regularly check the dashboard audit trail
- **WASM sandboxing** — Run untrusted agents in WASM sandboxes

## Scope

The following are in scope for security reports:

- Nexus OS CLI and core library
- WASM sandbox escape vulnerabilities
- Authentication and authorization bypasses
- Data exposure or leakage
- Denial of service vulnerabilities
- Supply chain vulnerabilities in dependencies

The following are **out of scope**:

- Issues in third-party dependencies (report to the upstream project)
- Social engineering attacks
- Physical security issues
- Issues requiring unlikely user interaction

## PGP Key

For encrypted communication, you can use our PGP key:

```
Fingerprint: [To be published]
```

## Acknowledgments

We thank the following individuals for responsibly disclosing security vulnerabilities:

*No reports yet — be the first!*

---

Thank you for helping keep Nexus OS and its users safe.
