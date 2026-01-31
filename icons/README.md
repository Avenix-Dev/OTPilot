# Extension Icons

This folder should contain PNG icons at the following sizes:
- `icon16.png` - 16x16 pixels (toolbar)
- `icon32.png` - 32x32 pixels
- `icon48.png` - 48x48 pixels (extensions page)
- `icon128.png` - 128x128 pixels (Chrome Web Store)

## Generating Icons

You can generate PNG icons from the `icon.svg` file using:

### Using ImageMagick (command line):
```bash
convert icon.svg -resize 16x16 icon16.png
convert icon.svg -resize 32x32 icon32.png
convert icon.svg -resize 48x48 icon48.png
convert icon.svg -resize 128x128 icon128.png
```

### Using an online converter:
1. Visit https://cloudconvert.com/svg-to-png
2. Upload `icon.svg`
3. Set dimensions and download each size

### Using Figma/Sketch:
1. Import `icon.svg`
2. Export at 16, 32, 48, and 128 pixel sizes

## Icon Design

The icon features:
- Avenix blue (#2563eb) background
- White envelope representing email
- Blue circle with checkmark representing verified code
- Rounded corners for modern look
