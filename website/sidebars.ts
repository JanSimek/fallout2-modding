import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  formatsSidebar: [
    {
      type: 'category',
      label: 'File Formats',
      collapsed: false,
      items: [
        'formats/overview',
        {
          type: 'category',
          label: 'Data Files',
          items: [
            'formats/pro',
            // Future: 'formats/map',
            // Future: 'formats/frm',
            // Future: 'formats/lst',
            // Future: 'formats/msg',
          ],
        },
      ],
    },
  ],

  sslSidebar: [
    {
      type: 'category',
      label: 'SSL Scripting',
      collapsed: false,
      items: [
        'ssl/overview',
        'ssl/syntax',
        {
          type: 'category',
          label: 'Function Reference',
          items: [
            'ssl/functions/index',
            'ssl/functions/all',
            {
              type: 'category',
              label: 'Functions by Category',
              items: [
                'ssl/functions/script',
                'ssl/functions/object',
                'ssl/functions/critter',
                'ssl/functions/inventory',
                'ssl/functions/animation',
                'ssl/functions/combat',
                'ssl/functions/dialog',
                'ssl/functions/map',
                'ssl/functions/time',
                'ssl/functions/skill',
                'ssl/functions/party',
                'ssl/functions/meta',
              ],
            },
            {
              type: 'doc',
              id: 'compatibility/missing-sfall-functions',
              label: 'Unimplemented Sfall Functions',
            },
          ],
        },
        {
          type: 'category',
          label: 'Standard Library',
          items: [
            'ssl/stdlib',
          ],
        },
        {
          type: 'category',
          label: 'Examples',
          items: [
            'ssl/examples/basic',
          ],
        },
      ],
    },
  ],

  apiSidebar: [
    {
      type: 'category',
      label: 'Engine API',
      collapsed: false,
      items: [
        'api/overview',
        {
          type: 'category',
          label: 'Functions',
          items: [
            'api/functions/critter',
            'api/functions/item',
            'api/functions/map',
            'api/functions/combat',
            'api/functions/ui',
          ],
        },
        {
          type: 'category',
          label: 'Enums & Constants',
          items: [
            'api/enums/proto-types',
            'api/enums/skills',
            'api/enums/stats',
          ],
        },
      ],
    },
  ],
};

export default sidebars;
