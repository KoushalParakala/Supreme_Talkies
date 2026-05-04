import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      background: '#0a0b0e', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Nav scrolled={true} />
      
      {/* Decorative background 404 */}
      <h1 style={{ 
        position: 'absolute', 
        fontFamily: 'Playfair Display, serif', 
        fontSize: 'clamp(120px, 30vw, 400px)', 
        color: '#BCA88E', 
        opacity: 0.05, 
        margin: 0, 
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 0
      }}>
        404
      </h1>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ 
          position: 'relative', 
          zIndex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: 16,
          textAlign: 'center',
          padding: '0 24px'
        }}
      >
        <div style={{ width: 40, height: 1, background: '#BCA88E', opacity: 0.4, marginBottom: 8 }} />
        
        <h2 style={{ 
          fontFamily: 'Montserrat, sans-serif', 
          fontSize: 11, 
          letterSpacing: 6, 
          color: '#BCA88E', 
          margin: 0,
          textTransform: 'uppercase'
        }}>
          FRAME NOT FOUND
        </h2>
        
        <p style={{ 
          fontFamily: 'Inter, sans-serif', 
          fontSize: 14, 
          color: '#F0EBE0', 
          opacity: 0.5, 
          margin: 0,
          maxWidth: 300,
          lineHeight: 1.6
        }}>
          The reel you're looking for doesn't exist.
        </p>

        <motion.button
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.05, letterSpacing: '6px' }}
          whileTap={{ scale: 0.98 }}
          style={{
            background: 'none',
            border: '1px solid rgba(188,168,142,0.5)',
            color: '#BCA88E',
            padding: '14px 42px',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 4,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            marginTop: 24,
            textTransform: 'uppercase'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#BCA88E';
            (e.currentTarget as HTMLElement).style.color = '#0e0f13';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'none';
            (e.currentTarget as HTMLElement).style.color = '#BCA88E';
          }}
        >
          BACK TO HOME
        </motion.button>
      </motion.div>

      {/* Aesthetic crop marks / corner accents similar to hero could go here, 
          but keeping it focused as per instructions */}
    </div>
  );
}
