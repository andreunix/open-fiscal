import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: 'Open Fiscal',
    },
    links: [
      {
        text: 'Documentação',
        url: '/docs',
        active: 'nested-url',
      },
    ],
  };
}
