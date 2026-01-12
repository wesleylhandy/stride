# Contributing to Stride

Thank you for your interest in contributing to Stride! This guide will help you get started with contributing to the project, whether you're fixing bugs, adding features, or improving documentation.

## Table of Contents

- [Tooling Setup](#tooling-setup)
- [Development Setup](#development-setup)
- [Code Standards](#code-standards)
- [Git Workflow](#git-workflow)
- [Testing Requirements](#testing-requirements)
- [Mergeability Criteria](#mergeability-criteria)
- [Open Source Best Practices](#open-source-best-practices)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)

## Tooling Setup

### Spec-Kit Workflow

Stride uses [Spec-Kit](https://github.com/github/spec-kit) for spec-driven development. Spec-Kit is a toolkit that provides structure and templates for organizing feature specifications, implementation plans, and tasks. It's not a CLI tool to install—it's a template system integrated into the project.

**Spec-Kit Structure**:

- **`.specify/`**: Contains templates, scripts, and memory (constitution)
- **`specs/`**: Feature specifications organized by feature number
- **AI Agent Commands**: Commands like `/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, `/speckit.implement` are available in Cursor IDE

**Working with Spec-Kit**:

1. **Feature specifications** are located in `specs/` directory:

   ```
   specs/
   ├── 001-feature-name/
   │   ├── spec.md          # Feature specification
   │   ├── plan.md          # Implementation plan
   │   ├── tasks.md         # Task breakdown
   │   └── research.md      # Technical research
   ```

2. **Using Spec-Kit commands in Cursor**:
   - `/speckit.specify` - Create a new feature specification
   - `/speckit.plan` - Generate implementation plan from spec
   - `/speckit.tasks` - Break down plan into actionable tasks
   - `/speckit.implement` - Execute implementation following tasks
   - `/speckit.analyze` - Analyze consistency across artifacts

3. **Viewing specifications**:
   - Navigate to `specs/` directory to view feature specifications
   - Each feature has its own directory with spec, plan, and tasks files
   - Check `tasks.md` for implementation status and progress

For more information about Spec-Kit, see the [GitHub repository](https://github.com/github/spec-kit).

### AI-Powered IDE Setup

Stride development benefits from AI-powered IDE assistance. Choose your preferred editor:

#### Cursor IDE

1. **Install Cursor**:
   - Download from [cursor.sh](https://cursor.sh)
   - Follow the installation instructions for your operating system

2. **Configure Cursor for Stride**:
   - Open the Stride project in Cursor
   - Cursor will automatically detect TypeScript/Next.js projects
   - Enable AI suggestions in settings (usually enabled by default)

3. **Recommended Cursor Settings**:
   - Enable TypeScript strict mode support
   - Enable auto-import suggestions
   - Enable inline code completion

#### VS Code with AI Extensions

1. **Install VS Code**:
   - Download from [code.visualstudio.com](https://code.visualstudio.com)

2. **Install AI Extensions**:

   ```bash
   # Install GitHub Copilot extension
   code --install-extension GitHub.copilot

   # OR install Cursor extension for VS Code
   code --install-extension cursor.cursor-ai
   ```

3. **Configure VS Code**:
   - Open the Stride project
   - Install recommended extensions (VS Code will prompt you)
   - Configure AI extension settings as needed

### AI-Powered CLI Setup

For command-line AI assistance during development:

1. **Install AI CLI tool** (choose one):

   ```bash
   # Option 1: GitHub CLI with Copilot
   gh extension install github/gh-copilot

   # Option 2: Cursor CLI (if using Cursor)
   # Follow Cursor CLI installation instructions
   ```

2. **Usage examples**:

   ```bash
   # Get AI assistance for code questions
   gh copilot explain <code-snippet>

   # Generate code suggestions
   gh copilot suggest "create a function that..."
   ```

### Next.js Local Development Setup

1. **Start the development server**:

   ```bash
   # From project root
   pnpm dev

   # Or start specific app
   pnpm dev --filter @stride/web
   ```

2. **Access the application**:
   - Web app: http://localhost:3000
   - Marketing site: http://localhost:3001 (if configured)

3. **Hot reload**: Changes to code will automatically reload in the browser

### Troubleshooting Tooling Setup

**Issue**: Spec-Kit commands not available in Cursor

- **Solution**: Spec-Kit commands are Cursor IDE commands, not CLI tools. Ensure you're using Cursor IDE and the commands are available in the command palette

**Issue**: AI extensions not working in IDE

- **Solution**: Check extension settings, restart IDE, verify API keys/authentication

**Issue**: Development server won't start

- **Solution**: Check Node.js version (>=24.0.0), ensure dependencies are installed (`pnpm install`), check port availability

**Issue**: TypeScript errors in IDE

- **Solution**: Run `pnpm type-check` to verify types, restart TypeScript server in IDE

## Development Setup

### Database Setup

Choose one of the following options:

#### Option A: Docker (Recommended)

1. **Start PostgreSQL container**:

   ```bash
   docker compose up -d stride-postgres

   # OR use the helper script
   ./scripts/db-start.sh
   ```

2. **Verify database is running**:
   ```bash
   docker ps | grep stride-postgres
   ```

#### Option B: Local PostgreSQL

1. **Install PostgreSQL 16+**:
   - Follow installation instructions for your operating system
   - [PostgreSQL Downloads](https://www.postgresql.org/download/)

2. **Create database**:

   ```bash
   createdb stride
   ```

3. **Update DATABASE_URL** in `.env`:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/stride
   ```

### Environment Configuration

1. **Copy environment template**:

   ```bash
   cp .env.example .env
   ```

2. **Configure required variables** in `.env`:

   ```env
   # Required
   JWT_SECRET=$(openssl rand -hex 32)
   SESSION_SECRET=$(openssl rand -hex 32)
   DB_PASSWORD=your-secure-password

   # Development defaults
   NODE_ENV=development
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   DATABASE_URL=postgresql://stride:stride_dev_password@localhost:5433/stride
   ```

3. **Generate secure secrets**:

   ```bash
   # Generate JWT_SECRET
   openssl rand -hex 32

   # Generate SESSION_SECRET
   openssl rand -hex 32
   ```

### Running the Application Locally

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Run database migrations**:

   ```bash
   pnpm --filter @stride/database db:generate
   pnpm --filter @stride/database db:deploy
   ```

3. **Start development servers**:

   ```bash
   pnpm dev
   ```

4. **Access the application**:
   - Navigate to http://localhost:3000
   - Create admin account on first access

5. **Verify setup**:
   - Create a test issue
   - Verify Kanban board displays correctly
   - Check that all features are accessible

## Code Standards

Stride follows strict development standards to ensure code quality and maintainability. All code must adhere to these standards.

### Development Constitution

For complete development standards, principles, and guidelines, see [`.specify/memory/constitution.md`](.specify/memory/constitution.md).

**Key Principles**:

- **SOLID**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **DRY**: Don't Repeat Yourself (extract repeated logic)
- **YAGNI**: You Aren't Gonna Need It (build what's needed now)
- **KISS**: Keep It Simple, Stupid (simplest solution that works)

**Code Quality Standards**:

- **TypeScript**: Strict mode enabled, no `any` types
- **Error Handling**: Always handle rejections, use try/catch with async/await
- **Security**: Validate all inputs, auth at every boundary, use parameterized queries
- **Testing**: Test behavior, not implementation

**Architecture Patterns**:

- **Repository Pattern**: Abstract data access layer
- **Service Layer**: Complex business logic separation
- **State Management**: Appropriate patterns for different scenarios

## Git Workflow

### Branch Naming Conventions

Use descriptive branch names following this pattern:

```
<type>/<description>
```

**Types**:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/changes
- `chore/` - Build/tooling changes

**Examples**:

- `feature/add-user-authentication`
- `fix/resolve-kanban-drag-issue`
- `docs/update-api-documentation`
- `refactor/simplify-database-queries`

### Commit Message Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Build process or auxiliary tool changes

**Examples**:

```
feat(web): add user authentication endpoint
fix(database): resolve connection pool exhaustion
docs(readme): update installation instructions
refactor(ui): simplify component structure
test(api): add integration tests for projects endpoint
```

### Pull Request Process

1. **Create a feature branch** from `main`:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**: Follow code standards and write tests

3. **Test your changes**:

   ```bash
   pnpm lint
   pnpm type-check
   pnpm test
   ```

4. **Commit your changes**:

   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

5. **Push to your fork**:

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a pull request**:
   - Navigate to the repository on GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template
   - Request review from maintainers

7. **Address review feedback**: Make requested changes and push updates

8. **Wait for approval**: PRs require at least one maintainer approval

## Testing Requirements

### Test Types

Stride uses three types of tests:

1. **Unit Tests**: Test individual functions and components in isolation
2. **Integration Tests**: Test component interactions and API integration
3. **E2E Tests**: Test complete user journeys using Playwright

### Running Tests

```bash
# All tests
pnpm test

# Specific package
pnpm test --filter @stride/web

# Watch mode
pnpm test --watch

# Coverage
pnpm test --coverage
```

### Test Requirements for PRs

All pull requests must include:

1. **Unit tests** for new utility functions and business logic
2. **Integration tests** for new API routes and database operations
3. **E2E tests** for new user-facing features and critical flows
4. **Test coverage** must not decrease (target: 80% for critical paths)

### Writing Tests

**Unit Test Example**:

```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "./my-utils";

describe("myFunction", () => {
  it("should return expected value", () => {
    expect(myFunction(input)).toBe(expected);
  });
});
```

**API Route Test Example**:

```typescript
import { POST } from "@/app/api/example/route";
import { NextRequest } from "next/server";

describe("POST /api/example", () => {
  it("should handle valid request", async () => {
    const request = new NextRequest("http://localhost/api/example", {
      method: "POST",
      body: JSON.stringify({ data: "test" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
```

## Mergeability Criteria

All pull requests must meet the following criteria before they can be merged:

### ✅ Required Criteria

1. **Tests Passing**: All tests must pass (`pnpm test`)
2. **Lint and Type Checks**: Linting and type checking must pass (`pnpm lint`, `pnpm type-check`)
3. **Code Review Approval**: At least one maintainer must approve the PR
4. **Constitution Alignment**: Code must follow development standards in [`.specify/memory/constitution.md`](.specify/memory/constitution.md)
5. **Test Coverage**: Test coverage must not decrease (target: 80% for critical paths)
6. **Documentation Updates**: Feature changes must include documentation updates
7. **Breaking Changes Documentation**: Breaking changes must include migration guides and changelog entries
8. **Tooling-Specific Gates**: If using speckit, all relevant tasks must be marked complete

### ❌ Rejection Criteria

PRs will be rejected if they contain:

- **Incomplete implementations**: Features that are partially implemented or non-functional
- **Failing tests**: Any test failures (unit, integration, or E2E)
- **Style violations**: Code that doesn't follow project style guidelines
- **Security issues**: Vulnerabilities, exposed secrets, or unsafe patterns
- **Breaking changes without documentation**: Breaking changes must include migration guides
- **Missing tests**: New features without appropriate test coverage
- **Type errors**: TypeScript errors or `any` types (use `unknown` if type is uncertain)

### AI Assistance

**Note**: AI assistance (GitHub Copilot, Cursor, ChatGPT, etc.) is considered normal tooling and doesn't require special documentation or attribution. Use AI tools as you would any other development tool.

## Open Source Best Practices

### Code of Conduct

Stride follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/). All contributors are expected to:

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different viewpoints and experiences

### PR Etiquette

- **Keep PRs focused**: One feature or fix per PR
- **Write clear descriptions**: Explain what and why, not just how
- **Reference issues**: Link to related issues or discussions
- **Respond to feedback**: Address review comments promptly
- **Keep PRs up to date**: Rebase on `main` if conflicts arise

### Issue Templates

Use issue templates when reporting bugs or requesting features:

- **Bug Report**: Use the bug report template with reproduction steps
- **Feature Request**: Use the feature request template with use cases
- **Question**: Use discussions for questions, issues for actionable items

### Communication Guidelines

- **GitHub Issues**: For bugs, feature requests, and actionable items
- **GitHub Discussions**: For questions, ideas, and general discussion
- **Pull Requests**: For code changes and implementation discussions
- **Be patient**: Maintainers are volunteers, responses may take time

### Community Standards and Expectations

- **Be helpful**: Help others learn and contribute
- **Be patient**: Everyone starts somewhere
- **Be respectful**: Treat all contributors with respect
- **Be constructive**: Provide helpful feedback, not criticism

### Project-Specific Guidance

#### Spec-Kit Workflow Integration

When working on features with Spec-Kit specifications:

1. **Check specification**: Review the spec in `specs/` directory (e.g., `specs/001-feature-name/spec.md`)
2. **Follow task breakdown**: Use `tasks.md` for implementation guidance
3. **Mark tasks complete**: Update task checkboxes in `tasks.md` as you complete work
4. **Reference spec**: Link PR to relevant specification directory
5. **Use Spec-Kit commands**: In Cursor IDE, use `/speckit.tasks` to generate tasks or `/speckit.implement` to execute implementation

#### AI Tooling Conventions

- **Use AI tools freely**: GitHub Copilot, Cursor, ChatGPT, etc. are all acceptable
- **Review AI-generated code**: Always review and test AI-generated code
- **No special attribution needed**: AI assistance is normal tooling
- **Follow code standards**: AI-generated code must still meet all standards

#### Project Culture and Values

- **Developer-first**: Prioritize developer experience and productivity
- **Open source**: Community-driven development with transparency
- **Quality over speed**: Take time to do things right
- **Learning opportunity**: Every contribution is a chance to learn

### Review Process Expectations

- **Review time**: Reviews typically happen within 1-2 business days
- **Feedback format**: Maintainers provide constructive, actionable feedback
- **Iteration**: Multiple rounds of review are normal and expected
- **Questions**: Ask questions if feedback is unclear

### Maintainer Contact Information

For questions or concerns about the review process:

- **GitHub Issues**: Open an issue with the `question` label
- **GitHub Discussions**: Post in the discussions forum
- **Direct contact**: Contact maintainers through GitHub (if they've enabled it)

### Contributor Recognition

Contributors are recognized in:

- **GitHub Contributors**: Automatic recognition in repository contributors
- **Release Notes**: Significant contributions mentioned in release notes
- **Documentation**: Contributors may be credited in relevant documentation

## Documentation

### Updating Documentation

When making changes that affect documentation:

1. **Update relevant docs**: Modify existing documentation files
2. **Add new docs**: Create new documentation files if needed
3. **Update README**: Update README.md if changes affect setup or usage
4. **Update API docs**: Update API documentation for API changes
5. **Check links**: Verify all internal and external links work

### Documentation Structure

- **README.md**: Project overview, quick start, configuration
- **CONTRIBUTING.md**: This file - contribution guidelines
- **docs/**: Detailed documentation organized by topic
- **specs/**: Feature specifications and implementation plans

### Documentation Standards

- **Clear and concise**: Write for your audience
- **Code examples**: Include working code examples
- **Keep updated**: Documentation should reflect current state
- **Link appropriately**: Link to related documentation

## Issue Reporting

### Reporting Bugs

When reporting bugs, include:

1. **Clear description**: What happened vs. what you expected
2. **Reproduction steps**: Step-by-step instructions to reproduce
3. **Environment**: OS, Node.js version, browser (if applicable)
4. **Error messages**: Full error messages and stack traces
5. **Screenshots**: Visual issues should include screenshots

### Requesting Features

When requesting features, include:

1. **Use case**: Why this feature is needed
2. **Proposed solution**: How you envision it working
3. **Alternatives**: Other solutions you've considered
4. **Impact**: Who benefits from this feature

### Issue Templates

Use GitHub issue templates when available:

- **Bug Report Template**: For reporting bugs
- **Feature Request Template**: For requesting features
- **Question Template**: For asking questions (or use Discussions)

## Code of Conduct

Stride follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating in this project, you agree to abide by its terms.

For questions or concerns about the code of conduct, please contact the project maintainers.

---

Thank you for contributing to Stride! Your efforts help make Stride better for everyone. 🚀
