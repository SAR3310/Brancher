# Brancher - Documentation Standards & Guidelines

**Version**: 1.0  
**Date**: 2026-09-30  
**Purpose**: Establish consistent, professional documentation standards across all project documents

---

## 1. Documentation Philosophy

### Core Objectives
1. **Clarity**: Documentation harus mudah dipahami oleh developers baru maupun existing
2. **Completeness**: Mencakup semua aspek penting tanpa berlebihan
3. **Consistency**: Format, style, dan struktur konsisten di seluruh docs
4. **Maintainability**: Mudah diupdate dan di-maintain seiring waktu
5. **Discoverability**: Mudah ditemukan melalui search dan navigation
6. **Accuracy**: Selalu up-to-date dengan codebase terkini

### Who Reads Our Docs?
- ✅ **Developers** (onboarding, architecture understanding)
- ✅ **DevOps/SRE** (deployment, operations)
- ✅ **Product Managers** (features, roadmap)
- ✅ **Contributors** (standards, contribution guide)
- ✅ **Users** (setup, troubleshooting)
- ✅ **Security Auditors** (security practices)

---

## 2. Documentation Structure

### Repository Documentation Hierarchy
```
brancher/
├── README.md                      # Entry point (what, why, quick start)
├── docs/
│   ├── index.md                  # Documentation portal
│   ├── GETTING-STARTED.md        # Detailed setup guide
│   ├── ARCHITECTURE.md           # System design & architecture
│   ├── API.md                    # API reference (or OpenAPI spec)
│   ├── DEPLOYMENT.md             # Production deployment guide
│   ├── CONTRIBUTING.md           # Developer contribution guide
│   ├── TROUBLESHOOTING.md        # Common issues & solutions
│   ├── SECURITY.md               # Security documentation
│   ├── PERFORMANCE.md            # Performance tuning guide
│   ├── DATABASE.md               # Database schema & migrations
│   ├── REAL-TIME.md              # Socket.io & real-time events
│   ├── TESTING.md                # Testing strategy & practices
│   └── CHANGELOG.md              # Version history
├── .github/
│   └── ISSUE_TEMPLATE/           # Issue templates
├── CODE_OF_CONDUCT.md            # Community guidelines
└── LICENSE.md                    # Licensing information
```

### README.md Structure
```markdown
# Project Name
Brief one-liner description

## Features
- Bulleted feature list
- ...

## Quick Start
1. Installation
2. Running

## Documentation
Links to detailed docs

## Contributing
Link to contributing guide

## License
License type

## Support
Contact/chat links
```

---

## 3. Markdown Standards

### Formatting Guidelines

#### Headings
```markdown
# H1: Main title (used once per document)
## H2: Major sections
### H3: Subsections
#### H4: Details (use sparingly)

❌ Don't: Skip heading levels (H1 → H3)
✅ Do: Follow hierarchy (H1 → H2 → H3)
```

#### Text Styling
```markdown
**Bold**: For emphasis, keywords
_Italic_: For references, file names (alternate with `code`)
`Code`: Inline code, commands, variables
**Don't overuse** bold or _italics_

✅ Good:
The **configuration** file is located in the `data/` directory.

❌ Bad:
The ***configuration*** file is ***located in*** the `data/` directory.
```

#### Lists
```markdown
✅ Unordered lists (bullets):
- Item 1
- Item 2
  - Sub-item 2.1
  - Sub-item 2.2
- Item 3

✅ Ordered lists (when sequence matters):
1. First step
2. Second step
   1. Sub-step 2.1
   2. Sub-step 2.2
3. Third step

✅ Definition lists:
Term 1
: Definition of term 1

Term 2
: Definition of term 2

❌ Don't mix list types at same level
✅ Do indent sub-lists by 2-4 spaces
```

#### Code Blocks
```markdown
❌ Single backticks for multi-line: Wrong!

✅ Triple backticks with language:
\`\`\`javascript
function example() {
  console.log('Hello');
}
\`\`\`

✅ Specify language for syntax highlighting:
\`\`\`bash
npm install
npm start
\`\`\`

\`\`\`sql
SELECT * FROM users WHERE id = 1;
\`\`\`

\`\`\`python
def hello():
    print("Hello")
\`\`\`

Important: Always include language identifier for proper highlighting
```

#### Blockquotes
```markdown
> Use for important notes, warnings, tips

> **Note**: This is important information

> **Warning**: This could break things if not done correctly

> **Tip**: This is helpful but not required

Don't nest blockquotes (hard to read)
```

#### Tables
```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Data 4   | Data 5   | Data 6   |

✅ Align tables for readability
✅ Use pipes at start and end
✅ Use dashes and pipes for formatting
❌ Don't overcomplicate (max 4-5 columns)
```

#### Links
```markdown
[Link text](URL)
[Link text](URL "Title for hover")

✅ Good:
[Read the API documentation](docs/API.md)

❌ Bad:
Click [here](docs/API.md) for API docs

✅ Internal links:
[Architecture](ARCHITECTURE.md)
[Getting Started](./docs/GETTING-STARTED.md)

✅ External links:
[Node.js Documentation](https://nodejs.org/docs)
```

#### Images
```markdown
![Alt text](image-path-or-url)

✅ Good:
![Architecture diagram showing backend and frontend](docs/images/architecture.png)

❌ Bad:
![img](image.png)

Recommendations:
- Always include descriptive alt text
- Store images in docs/images/
- Use SVG for diagrams when possible
- Optimize PNG/JPEG before committing
```

---

## 4. Documentation Templates

### API Endpoint Documentation Template
```markdown
## GET /api/endpoint

### Description
What this endpoint does.

### Authentication
Required? (Bearer token, Session, etc.)

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | User ID |
| limit | integer | No | Items per page (default: 50) |

### Request Example
\`\`\`bash
curl -X GET http://localhost:3000/api/endpoint/123
\`\`\`

### Response (200 OK)
\`\`\`json
{
  "data": { ... },
  "success": true
}
\`\`\`

### Errors
- **400 Bad Request**: Invalid parameters
- **401 Unauthorized**: Missing authentication
- **404 Not Found**: Resource not found
- **429 Too Many Requests**: Rate limited

### Rate Limit
30 requests per 15 minutes per IP
```

### Component Documentation Template
```markdown
## ComponentName

### Purpose
What this component does and when to use it.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | - | Component title |
| disabled | boolean | false | Disable state |

### Usage
\`\`\`jsx
<ComponentName title="My Component" />
\`\`\`

### States
- **Default**: Normal state
- **Disabled**: Disabled state
- **Loading**: Loading state

### Accessibility
- WCAG 2.1 AA compliant
- Keyboard navigation: Tab to focus
- Screen reader: Announces role and state

### Examples
[See Storybook](link)
```

### Architecture Decision Record (ADR) Template
```markdown
# ADR-001: Use Socket.io for real-time communication

## Date
2026-09-30

## Status
Accepted

## Context
We need real-time bidirectional communication for messages.

## Decision
Use Socket.io with WebSocket primary and polling fallback.

## Consequences
- ✅ Real-time updates for all users
- ✅ Automatic fallback for restricted networks
- ✅ Built-in rooms and namespaces
- ⚠️ Requires Redis adapter for multi-instance deployment
- ⚠️ Additional complexity vs pure HTTP polling

## Alternatives Considered
1. GraphQL Subscriptions
2. Server-Sent Events (SSE)
3. HTTP polling

## References
- [Socket.io Documentation](link)
- [Related Issue](link)
```

---

## 5. Code Documentation Standards

### JSDoc for JavaScript
```javascript
/**
 * Calculate total price including tax.
 * 
 * @param {number} price - Base price before tax
 * @param {number} [taxRate=0.1] - Tax rate (default 10%)
 * @returns {number} Total price with tax
 * @throws {Error} If price is negative
 * 
 * @example
 * calculateTotal(100, 0.15);
 * // Returns 115
 */
function calculateTotal(price, taxRate = 0.1) {
  if (price < 0) {
    throw new Error('Price must be positive');
  }
  return price * (1 + taxRate);
}
```

### Function/Method Documentation
```javascript
/**
 * Sends a message to a channel
 * 
 * @param {string} channelId - The channel ID
 * @param {string} content - Message content (1-2000 chars)
 * @param {Object} [options] - Optional settings
 * @param {string} [options.replyTo] - Message ID to reply to
 * @param {string} [options.fileUrl] - Attached file URL
 * 
 * @returns {Promise<Message>} Created message object
 * @returns {number} returns.id - Message ID
 * @returns {string} returns.content - Message content
 * @returns {Date} returns.createdAt - Creation timestamp
 * 
 * @throws {ValidationError} If content is invalid
 * @throws {AuthorizationError} If user lacks permission
 * @throws {NotFoundError} If channel doesn't exist
 * 
 * @example
 * const msg = await sendMessage('ch-123', 'Hello world');
 * console.log(msg.id); // Message ID
 * 
 * @see {@link Message} for message schema
 */
async function sendMessage(channelId, content, options = {}) {
  // Implementation
}
```

### Class Documentation
```javascript
/**
 * Manages user authentication and sessions.
 * 
 * @class AuthManager
 */
class AuthManager {
  /**
   * Creates an AuthManager instance.
   * 
   * @param {Object} config
   * @param {string} config.secret - Session secret
   * @param {number} [config.ttl=2592000] - Session TTL (default 30 days)
   */
  constructor(config) {
    this.secret = config.secret;
    this.ttl = config.ttl || 2592000;
  }

  /**
   * Authenticate user with email and password.
   * 
   * @param {string} email
   * @param {string} password
   * @returns {Promise<User>} Authenticated user
   * @throws {AuthError}
   */
  async authenticate(email, password) {
    // Implementation
  }
}
```

---

## 6. Commit Message Standards

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
```
feat:     A new feature
fix:      A bug fix
docs:     Documentation changes
style:    Code style changes (formatting, semicolons, etc.)
refactor: Code refactoring without feature/bug changes
perf:     Performance improvements
test:     Test additions or modifications
chore:    Build, deps, or tool changes
ci:       CI/CD changes
```

### Examples

✅ Good:
```
feat(messages): Add message reactions support

Add ability to react to messages with emojis.
Uses WebSocket to sync reactions in real-time.

Fixes #123
```

✅ Good:
```
fix(auth): Prevent session fixation vulnerability

Regenerate session ID after login to prevent
session fixation attacks as per OWASP guidelines.

Refs: SECURITY-001
```

❌ Bad:
```
Fixed stuff
```

❌ Bad:
```
Updated files
```

---

## 7. Version Numbering (Semantic Versioning)

### Format
```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]

Example: 0.1.0, 1.2.3, 2.0.0-beta.1, 2.0.0-rc.1
```

### Rules
- **MAJOR**: Breaking changes (↑ when breaking API)
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)
- **Pre-release**: -alpha, -beta, -rc (release candidate)
- **Build**: +build.123 (for builds, not versions)

### Examples
```
0.1.0 - Initial release
0.2.0 - Add messaging features (new feature)
0.2.1 - Fix message timestamp bug (patch)
1.0.0 - Production ready (major release)
1.1.0 - Add reactions feature (new feature)
2.0.0 - Migrate to PostgreSQL (breaking change)
2.0.0-beta.1 - Beta release for testing
```

---

## 8. CHANGELOG Format

### File Location
`docs/CHANGELOG.md` or `CHANGELOG.md` at root

### Format
```markdown
# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]
### Added
- New feature

### Changed
- Modified behavior

### Fixed
- Bug fix

### Removed
- Deprecated feature

## [1.1.0] - 2026-09-30
### Added
- New real-time notification system

### Changed
- Improved message search performance

### Fixed
- Fixed session timeout issue (#123)
- Fixed emoji rendering on mobile

### Removed
- Deprecated OAuth 1.0 support

## [1.0.0] - 2026-09-01
### Added
- Initial release
```

---

## 9. Issue & Pull Request Templates

### Issue Template (.github/ISSUE_TEMPLATE/bug.md)
```markdown
---
name: Bug Report
about: Report a bug
title: "[BUG] Brief description"
labels: bug
---

## Description
Clear description of the bug.

## Steps to Reproduce
1. Step 1
2. Step 2
3. Expected behavior
4. Actual behavior

## Environment
- OS: Windows/macOS/Linux
- Node version: 22
- Browser: Chrome 120
- Version: 0.1.0

## Screenshots
If applicable, add screenshots.

## Additional context
Any additional information.
```

### PR Template (.github/pull_request_template.md)
```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Related Issues
Fixes #123

## Changes Made
- Change 1
- Change 2

## Testing
- [ ] Unit tests added
- [ ] Manual testing done
- [ ] No new test coverage needed (explain why)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed changes
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Tests pass
```

---

## 10. Documentation Review Checklist

When creating or updating documentation:

- [ ] **Clarity**: Anyone can understand without confusion
- [ ] **Completeness**: No important information missing
- [ ] **Accuracy**: Information matches current code
- [ ] **Consistency**: Follows style and format guidelines
- [ ] **Examples**: Real, working code examples included
- [ ] **Links**: All links work and are correct
- [ ] **Formatting**: Proper markdown, good readability
- [ ] **Accessibility**: Alt text for images, code syntax highlighted
- [ ] **Maintenance**: Included notes for future updates
- [ ] **Grammar**: Spell-checked and grammar-checked

---

## 11. Documentation Maintenance Schedule

### Daily
- Address user questions/feedback
- Update example code if it breaks

### Weekly
- Review new issues for doc gaps
- Update FAQ section

### Monthly
- Review all docs for accuracy
- Update API documentation if changes made
- Update deployment guide if process changed

### Quarterly
- Full documentation audit
- Update best practices based on experience
- Reorganize if structure is unclear

### Annually
- Major documentation revision
- Update standards and guidelines
- Archive old versions

---

## 12. Documentation Tools & Workflow

### Tools Used
- **Writing**: Markdown (GitHub, VSCode)
- **Version Control**: Git (commit all docs)
- **Hosting**: GitHub Pages or Vercel (optional for public docs)
- **Search**: Built-in GitHub wiki search or Algolia
- **Spell Check**: VS Code Spell Checker extension
- **Link Checker**: markdown-link-check npm package

### Workflow
```
1. Create feature → Write code
2. Document feature → Write docs
3. Review code + docs together
4. Merge with tests passing
5. Update CHANGELOG
6. Release version
```

### Automations
```bash
# Check links in docs
npm install -D markdown-link-check
markdown-link-check docs/*.md

# Check spelling
npm install -D cspell
cspell "docs/**/*.md"

# Generate docs from JSDoc
npm install -D jsdoc
jsdoc server/*.js -d docs/api/
```

---

## 13. Multi-Language Support (Future)

```
When supporting multiple languages:
├── docs/
│   ├── en/
│   │   ├── README.md
│   │   ├── GETTING-STARTED.md
│   │   └── ...
│   ├── id/
│   │   ├── README.md
│   │   ├── GETTING-STARTED.md
│   │   └── ...
│   └── ja/
│       └── ...
```

---

## 14. Documentation Quality Metrics

### Track These
- **Coverage**: % of code documented
- **Accuracy**: % of docs matching current code
- **Freshness**: Average age of documentation
- **Accessibility**: Readability score
- **Usage**: Page views, search queries
- **Feedback**: User satisfaction with docs

### Goals
- ✅ > 90% code coverage
- ✅ > 95% accuracy
- ✅ < 3 months average age
- ✅ Flesch Reading Ease > 50 (easy to read)
- ✅ Positive user satisfaction

---

## Conclusion

Good documentation is:
- ✅ **Written when code is written**
- ✅ **Updated when code changes**
- ✅ **Reviewed during code review**
- ✅ **Organized logically**
- ✅ **Clear and concise**
- ✅ **Accurate and maintainable**

By following these standards, we ensure Brancher's documentation is world-class and enables rapid development and onboarding.

---

*Documentation Standards v1.0*  
*Last Updated: 2026-09-30*  
*Maintained by: Technical Writing Team*  
*Review Schedule: Quarterly*
