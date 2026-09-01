import { useMemo } from 'react';

function shuffleArray<T>(array: T[]): T[] {
  const next = [...array];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function HangingPolaroids() {
  const items = useMemo(() => {
    const base = Array.from({ length: 19 }, (_, i) => ({
      id: i + 1,
      img: `/pic${i + 1}.webp`,
      angle: Math.random() * 20 - 10,
      scale: 0.8 + Math.random() * 0.4,
    }));
    return shuffleArray(base);
  }, []);

  const itemWidth = 320;
  const totalWidth = items.length * itemWidth;

  return (
    <div className="polaroid-track">
      <div className="polaroid-marquee" style={{ width: totalWidth * 2 }}>
        {[0, 1].map((iteration) => (
          <div key={iteration} className="polaroid-strip" style={{ width: totalWidth }}>
            <svg width={totalWidth} height="100" className="polaroid-string" aria-hidden="true">
              <path
                d={items.map((_, i) => `M ${i * itemWidth} 10 Q ${i * itemWidth + itemWidth / 2} 80 ${(i + 1) * itemWidth} 10`).join(' ')}
                fill="none"
                stroke="rgba(201,161,83,0.35)"
                strokeWidth="1.5"
              />
            </svg>
            {items.map((item) => (
              <div className="polaroid-item" key={`${iteration}-${item.id}`} style={{ width: itemWidth }}>
                <div className="polaroid-hang">
                  <div
                    className="polaroid-spin"
                    style={{ transform: `rotate(${item.angle}deg) scale(${item.scale})` }}
                  >
                    <div className="polaroid-peg" />
                    <div className="polaroid-card">
                      <div className="polaroid-img">
                        <img src={item.img} alt="" loading="lazy" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TearSection() {
  return (
    <section className="polaroid-section" id="crew-line" aria-label="Crew polaroids">
      <div className="polaroid-copy">
        <p className="eyebrow">02 / ON THE LINE</p>
        <h2>Join our<br /><em>crew.</em></h2>
      </div>
      <div className="polaroid-thread">
        <HangingPolaroids />
      </div>
    </section>
  );
}
