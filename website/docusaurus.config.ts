import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Fallout 2 Modding',
  tagline: 'SSL scripting and engine documentation for Fallout 2 Community Edition',
  favicon: 'img/favicon.png',

  future: {
    v4: true,
  },

  // Set the production url of your site here
  url: 'https://JanSimek.github.io',
  // Set to '/' for local dev, '/fallout2-modding/' for GitHub Pages
  baseUrl: '/fallout2-modding/',

  // GitHub pages deployment config.
  organizationName: 'JanSimek', // Update with your GitHub username
  projectName: 'fallout2-modding',

  onBrokenLinks: 'throw',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/your-username/fallout2-modding/tree/main/website/',
          routeBasePath: '/', // Docs-only mode - docs at root
        },
        blog: false, // Disable blog
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.jpg',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Fallout 2 Modding',
      logo: {
        alt: 'Fallout 2 Modding Logo',
        src: 'img/logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'formatsSidebar',
          position: 'left',
          label: 'Formats',
        },
        {
          type: 'docSidebar',
          sidebarId: 'sslSidebar',
          position: 'left',
          label: 'SSL',
        },
        {
          type: 'docSidebar',
          sidebarId: 'apiSidebar',
          position: 'left',
          label: 'API',
        },
        {
          href: 'https://github.com/alexbatalov/fallout2-ce',
          label: 'fallout2-ce',
          position: 'right',
        },
        {
          href: 'https://github.com/your-username/fallout2-modding',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Formats',
              to: '/formats/overview',
            },
            {
              label: 'SSL Scripting',
              to: '/ssl/overview',
            },
            {
              label: 'API Reference',
              to: '/api/overview',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'NMA Fallout Modding',
              href: 'https://www.nma-fallout.com/forums/fallout-modding.12/',
            },
            {
              label: 'fallout2-ce GitHub',
              href: 'https://github.com/alexbatalov/fallout2-ce',
            },
          ],
        },
        {
          title: 'Resources',
          items: [
            {
              label: 'Resources',
              to: '/resources',
            },
            {
              label: 'Contributing',
              to: '/contributing',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/your-username/fallout2-modding',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Fallout 2 Modding Documentation. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.vsLight,
      darkTheme: prismThemes.vsDark,
      additionalLanguages: ['c', 'cpp'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
