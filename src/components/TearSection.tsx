import { useMemo } from 'react';

function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

function HangingPolaroids() {
  const items = useMemo(() => {
    const baseItems = [
      { id: 1, img: '/pic1.webp' },
      { id: 2, img: '/pic2.webp' },
      { id: 3, img: '/pic3.webp' },
      { id: 4, img: '/pic4.webp' },
      { id: 5, img: '/pic5.webp' },
      { id: 6, img: '/pic6.webp' },
      { id: 7, img: '/pic7.webp' },
      { id: 8, img: '/pic8.webp' },
      { id: 9, img: '/pic9.webp' },
      { id: 10, img: '/pic10.webp' },
      { id: 11, img: '/pic11.webp' },
      { id: 12, img: '/pic12.webp' },
      { id: 13, img: '/pic13.webp' },
      { id: 14, img: '/pic14.webp' },
      { id: 15, img: '/pic15.webp' },
      { id: 16, img: '/pic16.webp' },
      { id: 17, img: '/pic17.webp' },
      { id: 18, img: '/pic18.webp' },
      { id: 19, img: '/pic19.webp' },
    ].map(item => ({
      ...item,
      angle: (Math.random() * 20) - 10, // Random angle between -10 and 10
      scale: 0.8 + (Math.random() * 0.4), // Random scale between 0.8 and 1.2
    }));
    return shuffleArray(baseItems);
  }, []);

  const ITEM_WIDTH = 320;
  const TOTAL_WIDTH = items.length * ITEM_WIDTH;

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: 0,
        width: '100%',
        height: '350px',
        transform: 'translateY(-50%)',
        zIndex: 2,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'flex-start',
        overflow: 'visible',
      }}
    >
      <style>
        {`
          @keyframes marquee-rtl {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .polaroid-marquee {
            display: flex;
            width: ${TOTAL_WIDTH * 2}px;
            animation: marquee-rtl 60s linear infinite;
            will-change: transform;
          }
          .polaroid-item {
            width: ${ITEM_WIDTH}px;
            position: relative;
            display: flex;
            justify-content: center;
          }
          .polaroid-card {
            width: 220px;
            height: 260px;
            background: #111;
            border: 1px solid rgba(188, 168, 142, 0.25);
            padding: 12px 12px 48px 12px;
            box-shadow: 0 14px 28px rgba(0,0,0,0.6), 0 10px 10px rgba(0,0,0,0.4);
            display: flex;
            flex-direction: column;
            border-radius: 2px;
          }
          .polaroid-img {
            flex-grow: 1;
            background: #111;
            border: 1px solid rgba(188, 168, 142, 0.25);
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          .polaroid-img img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            pointer-events: none;
          }
          .polaroid-peg {
            position: absolute;
            top: -15px;
            left: 50%;
            transform: translateX(-50%);
            width: 14px;
            height: 40px;
            background: #c19a6b;
            border-radius: 2px;
            box-shadow: inset 0 0 5px rgba(0,0,0,0.2), 0 4px 6px rgba(0,0,0,0.3);
            z-index: 10;
          }
          .polaroid-peg::after {
            content: '';
            position: absolute;
            top: 50%;
            left: -2px;
            right: -2px;
            height: 2px;
            background: rgba(0,0,0,0.3);
          }
        `}
      </style>
      <div className="polaroid-marquee">
        {[0, 1].map((iteration) => (
          <div key={iteration} style={{ display: 'flex', width: TOTAL_WIDTH, position: 'relative' }}>
            {/* The Drooping String */}
            <svg
              width={TOTAL_WIDTH}
              height="100"
              style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
            >
              <path
                d={items.map((_, i) => `M ${i * ITEM_WIDTH} 10 Q ${(i * ITEM_WIDTH) + (ITEM_WIDTH / 2)} 80 ${(i + 1) * ITEM_WIDTH} 10`).join(' ')}
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="1.5"
              />
            </svg>
            
            {items.map((item) => (
              <div className="polaroid-item" key={`${iteration}-${item.id}`}>
                <div style={{ position: 'absolute', top: 45 }}>
                  <div
                    style={{
                      transform: `rotate(${item.angle}deg) scale(${item.scale})`,
                      transformOrigin: 'top center',
                    }}
                  >
                    <div className="polaroid-peg" />
                    <div className="polaroid-card">
                      <div className="polaroid-img">
                        <img src={item.img} alt={`Crew snapshot ${item.id}`} loading="lazy" />
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
    <section
      style={{
        position: 'relative',
        minHeight: '600px',
        overflow: 'hidden',
        background: '#1e2029',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '60px',
        paddingBottom: '20px',
        gap: '40px',
      }}
      aria-hidden="true"
    >
      {/* ── Background: glowing orange gradient ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 70% 40% at 50% 50%, rgba(188,168,142,0.12) 0%, rgba(140,30,5,0.06) 60%, transparent 100%)',
          zIndex: 0,
        }}
      />

      {/* Text Title Above Thread */}
      <div
        style={{
          fontFamily: 'Playfair Display, sans-serif',
          fontSize: 'clamp(40px, 6vw, 84px)',
          color: '#BCA88E',
          letterSpacing: 8,
          position: 'relative',
          zIndex: 3,
        }}
      >
        JOIN OUR CREW
      </div>
      
      {/* Polaroids Thread Wrapper */}
      <div style={{ position: 'relative', width: '100%', height: '350px', zIndex: 1 }}>
        <HangingPolaroids />
      </div>
    </section>
  );
}
