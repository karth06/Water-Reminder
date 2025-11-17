# 📦 VS Code Marketplace Publishing Guide

## Prerequisites

1. **Microsoft Account**: You need a Microsoft account
2. **Azure DevOps Organization**: Required for publisher account
3. **Personal Access Token (PAT)**: For vsce authentication

## Step-by-Step Publishing

### 1. Create Publisher Account

1. Visit [VS Code Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
2. Sign in with your Microsoft account
3. Click **"Create Publisher"**
4. Fill in details:
   - **Publisher ID**: Unique identifier (lowercase, no spaces)
   - **Display Name**: Your name or company
   - **Description**: Brief bio
   - **Website/Email**: Your contact info

### 2. Generate Personal Access Token (PAT)

1. Go to [Azure DevOps](https://dev.azure.com/)
2. Click on **User Settings** (gear icon) → **Personal Access Tokens**
3. Click **"+ New Token"**
4. Configure:
   - **Name**: "VSCode Extension Publishing"
   - **Organization**: All accessible organizations
   - **Expiration**: 90 days (or custom)
   - **Scopes**: Select **"Marketplace" → "Manage"**
5. Click **"Create"** and copy the token (save it securely!)

### 3. Update Package Files

Edit `package.json`:
```json
{
  "publisher": "your-publisher-id",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/water-reminder"
  },
  "author": "Your Name"
}
```

### 4. Login with vsce

```powershell
cd d:\Python-Exercises\vscode-water-reminder-extension
npx @vscode/vsce login your-publisher-id
```

Enter your PAT when prompted.

### 5. Publish Extension

**Option A: Automatic Publish**
```powershell
npx @vscode/vsce publish
```

**Option B: Manual Upload**
```powershell
# Package the extension
npx @vscode/vsce package

# Then manually upload water-reminder-1.0.0.vsix at:
# https://marketplace.visualstudio.com/manage
```

### 6. Verify Publication

1. Visit https://marketplace.visualstudio.com/vscode
2. Search for "Water Reminder"
3. Verify all information is correct

## Publishing Checklist

Before publishing, ensure:

- [ ] Publisher name updated in `package.json`
- [ ] Repository URL is correct
- [ ] Author name is correct
- [ ] `README.md` is polished and has:
  - [ ] Clear description
  - [ ] Installation instructions
  - [ ] Usage examples
  - [ ] Screenshots/GIF (highly recommended)
  - [ ] Feature list
  - [ ] Configuration options
- [ ] `CHANGELOG.md` is up-to-date
- [ ] Version number is correct (1.0.0 for first release)
- [ ] License file exists (MIT)
- [ ] Icon exists and looks good (128x128px minimum)
- [ ] Keywords are relevant and searchable
- [ ] No sensitive data in package
- [ ] Extension compiles without errors
- [ ] Tested in fresh VS Code install

## After Publishing

### Update README with Installation Badge

```markdown
[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/your-publisher.water-reminder.svg)](https://marketplace.visualstudio.com/items?itemName=your-publisher.water-reminder)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/your-publisher.water-reminder.svg)](https://marketplace.visualstudio.com/items?itemName=your-publisher.water-reminder)
```

### Monitor Extension

- Check reviews regularly
- Respond to issues on GitHub
- Monitor download statistics
- Update for VS Code API changes

## Publishing Updates

When you make changes:

1. Update version in `package.json`:
   - Patch: `1.0.0` → `1.0.1` (bug fixes)
   - Minor: `1.0.0` → `1.1.0` (new features)
   - Major: `1.0.0` → `2.0.0` (breaking changes)

2. Update `CHANGELOG.md`

3. Rebuild and publish:
   ```powershell
   npm run vscode:prepublish
   npx @vscode/vsce publish
   ```

## Troubleshooting

### "Publisher not found"
- Make sure you created a publisher on marketplace.visualstudio.com
- Check publisher ID matches exactly (case-sensitive)

### "Personal access token is invalid"
- Generate new PAT with "Marketplace (Manage)" scope
- Make sure organization is set to "All accessible organizations"

### "Extension validation failed"
- Run `npx @vscode/vsce package` locally first
- Check for errors in output
- Verify `package.json` is valid JSON

### "Icon not found"
- Ensure `icon` field in `package.json` points to existing file
- Icon should be at least 128x128px PNG

## Additional Resources

- [VS Code Extension Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [vsce Documentation](https://github.com/microsoft/vscode-vsce)
- [Extension Manifest Reference](https://code.visualstudio.com/api/references/extension-manifest)
- [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Support

If you encounter issues:
1. Check [vsce GitHub Issues](https://github.com/microsoft/vscode-vsce/issues)
2. Visit [VS Code Extension Authoring](https://code.visualstudio.com/api)
3. Ask on [Stack Overflow](https://stackoverflow.com/questions/tagged/visual-studio-code)
