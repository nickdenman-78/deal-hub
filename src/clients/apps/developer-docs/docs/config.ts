import { createRequire } from 'module';
import type { DefaultTheme } from 'vitepress';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

export const siteDescription = 'ETS developer documentation.';

export const footer: DefaultTheme.Footer = {
  message: `${pkg.description} version ${pkg.version}`,
};

export const nav: DefaultTheme.NavItem[] = [{ text: 'Getting started', link: '/getting-started/' }];

export const sidebar: DefaultTheme.Sidebar = {
  '/getting-started/': [
    {
      text: 'Getting started',
      items: [
        { text: 'Overview', link: '/getting-started/' },
        { text: 'Prerequisites', link: '/getting-started/prerequisites' },
        { text: 'Project layout', link: '/getting-started/project-layout' },
        { text: 'Open in your IDE', link: '/getting-started/ide' },
        { text: 'Build and run', link: '/getting-started/build-and-run' },
        { text: 'The database', link: '/getting-started/database' },
        { text: 'Tests and code quality', link: '/getting-started/tests-and-quality' },
        { text: 'The developer docs site', link: '/getting-started/developer-docs' },
        { text: 'Troubleshooting', link: '/getting-started/troubleshooting' },
        { text: 'Next steps', link: '/getting-started/next-steps' },
      ],
    },
  ],
};
