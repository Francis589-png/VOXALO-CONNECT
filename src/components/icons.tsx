import { MessageCircle, Bot, type LucideProps } from 'lucide-react';
import type { SVGProps } from 'react';

export const Icons = {
  logo: (props: LucideProps) => (
    <MessageCircle {...props} />
  ),
  bot: (props: LucideProps) => (
    <Bot {...props} />
  )
};
