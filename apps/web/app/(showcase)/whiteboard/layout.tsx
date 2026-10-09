import type { ReactNode } from 'react';
import { metadataForShowcaseRoute } from '@/lib/site';

export const metadata = metadataForShowcaseRoute('/whiteboard');

export default function WhiteboardLayout({ children }: { children: ReactNode }) {
  return children;
}
