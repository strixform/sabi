# Logo Image Setup Guide

## Current Status

The Sabi application has been configured to use image-based logos instead of SVG components. The logo system is now in place and ready for your custom logo images.

## Logo Files

The following logo image files are expected in the `public/` directory:

### Primary Logo
- **File**: `public/sabi-logo.png`
- **Purpose**: Main logo used across the application header and branding
- **Recommended Size**: 256x256 pixels (will be scaled automatically)
- **Format**: PNG with transparent background
- **Current Status**: Placeholder file in place (replace with your logo)

### Secondary Logo (Optional)
- **File**: `public/sabi-logo-secondary.png`
- **Purpose**: Alternative logo variant for different contexts
- **Recommended Size**: 128x128 to 256x256 pixels
- **Format**: PNG with transparent background
- **Current Status**: Placeholder file in place (replace if needed)

## How to Replace Logo Images

1. **Prepare your logo images**:
   - Export as PNG format
   - Ensure transparent background (for flexibility)
   - Primary logo: 256x256 pixels or larger
   - Secondary logo: 128x128 to 256x256 pixels

2. **Replace the files**:
   - Replace `public/sabi-logo.png` with your primary logo
   - Replace `public/sabi-logo-secondary.png` with your alternative logo (if desired)

3. **No code changes needed**:
   - The application will automatically detect and use the new images
   - No component updates or rebuilds required
   - The fallback SVG version will be used if images fail to load

## Implementation Details

### LogoImage Component
- **File**: `src/components/LogoImage.tsx`
- **Type**: Reusable React component
- **Props**:
  - `size`: 'sm' | 'md' | 'lg' (size variant)
  - `className`: Additional Tailwind CSS classes
  - `variant`: 'primary' | 'secondary' (which logo to use)

### Size Mappings
- **sm**: 32x32 pixels (mobile header)
- **md**: 48x48 pixels (default, responsive up to 48x48)
- **lg**: 64x64 pixels (large contexts)

### Fallback Behavior
- If an image fails to load, the application automatically falls back to the SVG logo
- The SVG fallback uses the same `SabiLogo` component
- Users see no broken images or visual glitches

## Where Logos Are Used

The primary logo (`sabi-logo.png`) is currently used in:
- Main application header (ModernSabiHeader)
- All Sabi authenticated pages (dashboard, order, services, etc.)
- Navigation across the platform

## Deployment Notes

1. **Image Optimization**:
   - Next.js Image component automatically optimizes images
   - AVIF format is prioritized when available
   - WebP and PNG fallbacks are supported
   - Images are cached at the CDN level

2. **Cache Invalidation**:
   - When you replace logo PNG files, clear the cache:
     ```bash
     npm run build  # Rebuilds with new images
     ```
   - Or deploy a new version to Vercel to bust the cache

3. **File Size Optimization**:
   - Keep PNG files under 50KB for optimal performance
   - Recommended: 20-30KB for primary logo
   - Compress using tools like:
     - TinyPNG (https://tinypng.com)
     - OptiPNG
     - ImageMagick

## Design Guidelines for Logo

### Recommended Design
- Simple, clean, and recognizable at small sizes
- Transparent background for flexibility
- High contrast for visibility on both light and dark backgrounds
- Concentric shapes work well at small scales
- Avoid fine details that lose clarity at 32x32px

### Current Fallback Design
- Concentric isosceles triangles representing "togetherness"
- Cyan-to-blue gradient (primary colors)
- Green accent elements
- White center unity dot

## Troubleshooting

### Logo Not Showing
1. Verify file exists: `public/sabi-logo.png`
2. Clear browser cache (Ctrl+F5 or Cmd+Shift+R)
3. Rebuild the project: `npm run build`
4. Check file format is PNG
5. Ensure image size is not empty (>100 bytes)

### Fallback SVG Showing Instead
- Check console for any image load errors
- Verify PNG file is valid using image viewer
- Try replacing with a different PNG file
- The SVG fallback is intentional and looks good

## Performance Impact

- PNG images are optimized via Next.js Image component
- Static files are cached for 1 year (with CDN-Cache-Control)
- Automatic format selection (AVIF > WebP > PNG)
- No performance penalty for using images vs SVG

## Support

If you have custom logo designs ready, simply replace the PNG files in the `public/` directory:
- `public/sabi-logo.png` - Your primary logo
- `public/sabi-logo-secondary.png` - Your alternative logo (optional)

The system is fully functional and awaiting your logo images!
