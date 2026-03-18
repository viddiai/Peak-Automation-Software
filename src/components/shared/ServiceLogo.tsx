interface ServiceLogoProps {
  name: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-10 h-10 text-xs',
  lg: 'w-14 h-14 text-base',
};

export function ServiceLogo({ name, color, size = 'md' }: ServiceLogoProps) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative shrink-0">
      <div
        className={`${sizes[size]} rounded-xl flex items-center justify-center text-white font-bold tracking-wide`}
        style={{
          backgroundColor: color,
          boxShadow: `0 0 16px ${color}33, 0 2px 8px ${color}22`,
        }}
      >
        {initials}
      </div>
      <div
        className="absolute -inset-1 rounded-xl blur-lg -z-10 opacity-30"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}
