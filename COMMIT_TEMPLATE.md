# Commit Template

## Format

```
<type>: <subject>

<body>

<footer>
```

## Types

- **feat**: A new feature
- **fix**: A bug fix
- **refactor**: Refactoring existing code
- **style**: Formatting, missing semi colons, etc (no code change)
- **docs**: Changes to documentation
- **test**: Adding or modifying tests
- **chore**: Build tasks, package manager configs, etc (no code change)

## Rules

1. **Subject line** (max 50 characters)
   - Use imperative mood ("Add feature" not "Added feature")
   - Capitalize first letter
   - No period at the end

2. **Body** (optional, max 72 characters per line)
   - Explain WHAT and WHY (not how)
   - Separate from subject with blank line

3. **Footer** (optional)
   - Reference issues: `Fixes #123` or `Relates to #456`

## Examples

### Simple commit
```
feat: Add offer fetching for Kiwi store
```

### Commit with body
```
fix: Prevent server crash when API returns null

The Tjek API sometimes returns null values in hotspot data.
Added null checks and filtering to prevent crashes.

Fixes #42
```

### Refactoring
```
refactor: Restructure project to Clean Architecture

- Moved services to core/persistence/rest modules
- Updated all import paths
- Removed unused meal/category features
- Kept only offer fetching functionality
```
