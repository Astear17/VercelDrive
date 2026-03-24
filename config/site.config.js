/**
 * Website customization settings — things like the site title, shared folder,
 * fonts, icons, contact info, and footer.
 */
module.exports = {
  // [OPTIONAL] Icon shown next to the site title in the navigation bar.
  // Place the icon inside your project's /public folder (NOT your OneDrive).
  // Use the path relative to /public.
  icon: '/icons/128.png',

  // Prefix used for KV Storage keys.
  // You can set this in Vercel as 'KV_PREFIX'. No need to change the code.
  kvPrefix: process.env.KV_PREFIX || '',

  // Website title shown in the navbar.
  // You can set this in Vercel as 'NEXT_PUBLIC_SITE_TITLE'.
  title: process.env.NEXT_PUBLIC_SITE_TITLE || 'VercelDrive',

  // [OPTIONAL] List of folders that require a password.
  // These should match directories containing a .password file.
  // Set this in Vercel as 'NEXT_PUBLIC_PROTECTED_ROUTES', separated by commas.
  protectedRoutes: process.env.NEXT_PUBLIC_PROTECTED_ROUTES
    ? process.env.NEXT_PUBLIC_PROTECTED_ROUTES.split(',')
    : [],

  // [OPTIONAL] Email shown on the right side of the navbar.
  // Set this in Vercel as 'NEXT_PUBLIC_EMAIL'.
  email: process.env.NEXT_PUBLIC_EMAIL ? `mailto:${process.env.NEXT_PUBLIC_EMAIL}` : '',
  
  // [OPTIONAL] Footer HTML. Escape double quotes using \".
  // You can include badges or any HTML you want.
  footer:
    'Powered by <a href="https://github.com/Astear17/VercelDrive" target="_blank" rel="noopener noreferrer">VercelDrive - Astear17</a>.',

  // [OPTIONAL] Social links shown on the site.
  // Font Awesome brand icons are supported based on the "name" field.
  links: [
    {
      name: 'GitHub',
      link: 'https://github.com/Astear17/VercelDrive',
    },
  ],

  // [OPTIONAL] Maximum number of items shown per folder.
  // OneDrive API limits this to 200.
  maxItems: 200,

  // Google Fonts configuration.
  // Generate fonts at https://fonts.google.com.
  googleFontSans: 'Inter',       // Main sans-serif font
  googleFontMono: 'Fira Mono',   // Monospace font
  googleFontLinks: [
    'https://fonts.googleapis.com/css2?family=Fira+Mono&family=Inter:wght@400;500;700&display=swap',
  ],

  // Format for displaying dates and times (day.js format).
  datetimeFormat: 'DD-MM-YYYY HH:mm:ss',
}
