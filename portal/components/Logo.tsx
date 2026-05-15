export default function Logo({ height = 38 }: { height?: number }) {
  return (
    <img
      src="https://www.willpowerfitnessfactory.com/wpff-logo-white.png"
      alt="Will Power Fitness Factory"
      style={{ height, width: 'auto', display: 'block' }}
    />
  );
}
