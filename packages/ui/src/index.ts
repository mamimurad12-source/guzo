export const brand = {
  name: 'GUZO',
  slogan: 'Move Your Way.',
  colors: {
    primary: '#0F172A',
    secondary: '#06B6D4',
    accent: '#F59E0B',
    success: '#10B981',
    danger: '#EF4444'
  }
} as const;

export function AppShell({ title, children }: { title: string; children: string }) {
  return {
    title,
    children
  };
}
