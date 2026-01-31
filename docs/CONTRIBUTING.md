# Contributing to Avenix OTP Autofill

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Code of Conduct

Be respectful and constructive. We're all here to make a useful tool.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/avenix/otp-autofill/issues)
2. If not, create a new issue with:
   - Clear title describing the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser version and OS
   - Screenshots if applicable

### Suggesting Features

1. Check existing issues and discussions
2. Create a new issue with the "enhancement" label
3. Describe the feature and its use case
4. Explain why it would benefit users

### Submitting Code

1. **Fork** the repository
2. **Create a branch** for your feature: `git checkout -b feature/my-feature`
3. **Make your changes** following our coding style
4. **Test thoroughly** - load the extension and verify it works
5. **Commit** with clear messages: `git commit -m "Add feature X"`
6. **Push** to your fork: `git push origin feature/my-feature`
7. **Open a Pull Request** with a clear description

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/otp-autofill.git
cd otp-autofill

# Load in Chrome
# 1. Open chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the project folder

# Make changes and reload the extension to test
```

## Coding Style

- Use ES6+ JavaScript features
- Add JSDoc comments for functions
- Use meaningful variable names
- Keep functions focused and small
- Follow existing code patterns

### Example

```javascript
/**
 * Extract OTP code from email text
 * @param {string} text - Email body text
 * @returns {Object|null} Extracted code with confidence level
 */
function extractOTP(text) {
  // Implementation
}
```

## Testing

Before submitting:

1. Load the extension in Chrome/Firefox
2. Test Gmail authentication
3. Test OTP extraction with the test page (`test/test-form.html`)
4. Test on real websites with OTP fields
5. Check the console for errors

## Pull Request Guidelines

- Keep PRs focused on a single feature/fix
- Update documentation if needed
- Add comments for complex logic
- Ensure no console errors
- Test in both Chrome and Firefox if possible

## Questions?

- Open a GitHub issue for questions
- Email: dev@avenix.dev

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing!

**Avenix Team**
