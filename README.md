<div align="center">
  <img src="icons/icon.svg" width="80" alt="OTPilot">
  <h1>OTPilot</h1>
  <p><strong>Your autopilot for verification codes</strong></p>

  <p>
    <a href="https://github.com/Avenix-Dev/OTPilot/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License">
    </a>
    <a href="https://github.com/sponsors/Avenix-Dev">
      <img src="https://img.shields.io/badge/sponsor-GitHub%20Sponsors-ea4aaa.svg" alt="Sponsor">
    </a>
  </p>
</div>

---

## Features

- **Automatic Detection** - Intelligently finds OTP input fields on any website
- **Smart Extraction** - Multi-tier regex patterns for accurate code detection
- **Privacy First** - All processing happens locally on your device
- **Framework Compatible** - Works with React, Vue, Angular, and vanilla JS sites
- **Multi-field Support** - Handles both single fields and split OTP inputs (6 separate boxes)
- **Open Source** - Fully transparent, review the code yourself

## How It Works

1. **Connect** - Link your Gmail account (read-only access)
2. **Detect** - The extension monitors recent emails for verification codes
3. **Fill** - When you're on a page with an OTP field, it auto-fills the code

## Installation

### Chrome
1. Download the latest release from [Releases](https://github.com/Avenix-Dev/OTPilot/releases)
2. Unzip the file
3. Open `chrome://extensions`
4. Enable "Developer mode" (top right)
5. Click "Load unpacked" and select the unzipped folder

### Firefox
1. Download the Firefox version from [Releases](https://github.com/Avenix-Dev/OTPilot/releases)
2. Open `about:debugging`
3. Click "This Firefox" > "Load Temporary Add-on"
4. Select the `manifest.firefox.json` file

## Setup

### Getting a Gmail API Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Go to **APIs & Services** > **Library**
4. Search for **Gmail API** and enable it
5. Go to **APIs & Services** > **OAuth consent screen**
   - Select **External** user type
   - Fill in the app name (e.g., "OTPilot")
   - Add your email as a test user under **Test users**
6. Go to **APIs & Services** > **Credentials**
7. Click **Create Credentials** > **OAuth client ID**
8. Select **Chrome Extension** as application type
9. Enter your extension ID (found in `chrome://extensions` after loading the extension)
10. Copy the Client ID and replace `YOUR_CLIENT_ID.apps.googleusercontent.com` in `manifest.json`

> **Note:** While your app is in testing mode, only users added as test users can authenticate. For personal use, just add your own email.

## Privacy & Security

Your privacy is our priority:

- **Read-only access** - We only read emails, never send or modify
- **Local processing** - Code extraction happens entirely on your device
- **No data collection** - Zero telemetry, no external servers, no tracking
- **Temporary storage** - Codes are held in memory only, never persisted
- **Open source** - Every line of code is available for review

Read our full [Privacy Policy](docs/PRIVACY_POLICY.md)

## Supported OTP Formats

The extension can detect codes in various formats:

| Format | Example | Confidence |
|--------|---------|------------|
| Explicit label | "Your code is 123456" | High |
| Formatted | "123-456" or "123 456" | High |
| Quoted | "Your code: '789012'" | Medium |
| Context-aware | Text near "verification" | Medium |
| Generic numeric | Any 4-8 digit number | Low |

## Development

```bash
# Clone the repository
git clone https://github.com/Avenix-Dev/OTPilot.git
cd OTPilot

# Load in Chrome
# 1. Open chrome://extensions
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select the project folder

# Test with the included test page
# Open test/test-form.html in your browser
```

## Contributing

We welcome contributions! Here's how you can help:

1. **Report bugs** - Open an issue with details
2. **Suggest features** - Share your ideas
3. **Submit PRs** - Code improvements are always welcome

Please read our [Contributing Guidelines](docs/CONTRIBUTING.md) before submitting.

## Support the Project

If this extension saves you time, consider supporting development:

<a href="https://github.com/sponsors/Avenix-Dev">
  <img src="https://img.shields.io/badge/Sponsor-GitHub%20Sponsors-ea4aaa?style=for-the-badge&logo=github" alt="GitHub Sponsors">
</a>

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">
  <p>
    Built with care by <a href="https://avenix.dev"><strong>Avenix</strong></a>
  </p>
  <p>
    <a href="https://avenix.dev">Website</a> •
    <a href="https://github.com/Avenix-Dev">GitHub</a>
  </p>
  <br>
  <p>
    <sub>Need custom software development? <a href="https://avenix.dev/contact">Contact Avenix</a></sub>
  </p>
</div>
