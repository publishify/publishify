export function Logo({ height = 20 }: { height?: number }) {
  return (
    <img
      className="wordmark"
      src="/brand-logo.svg"
      alt="Publishify"
      height={height}
      width={(height * 216.04) / 40.16}
    />
  );
}
