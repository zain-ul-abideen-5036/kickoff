import type { MetadataRoute } from 'next';
import { appUrl } from '@/lib/server/context';

/** Only the landing page is public; the workspace, intake drafts and share links stay unindexed. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/$',
        disallow: [
          '/briefs',
          '/settings',
          '/share/',
          '/start/',
          '/api/',
          '/login',
          '/setup',
          '/design-system',
        ],
      },
    ],
    host: appUrl(),
  };
}
