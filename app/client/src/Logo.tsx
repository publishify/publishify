/** The wordmark, drawn in the current text colour (a soft tint of it) so it suits every theme. */
export function Logo({ height = 20 }: { height?: number }) {
  return (
    <span
      className="wordmark"
      role="img"
      aria-label="Publishify"
      style={{ height, width: (height * 216.04) / 40.16 }}
    />
  );
}
