export interface Film {
  id: string;
  title: string;
  productionNote: string;
  color: string;
  rating: string;
  duration: string;
  director: string;
  producer: string;
  cast?: string;
  synopsis: string;
  specialNote?: string;
  videoLink?: string;
  stills?: string[];
  reelImage?: string;
  writtenBy?: string;
  cinematography?: string;
  music?: string;
  associateDirector?: string;
  colourist?: string;
  publicityDesign?: string;
  editing?: string;
  comingSoon?: boolean;
  presentedBy?: string;
  teluguDubbingTeam?: string;
  supremeTalkiesTeam?: string;
  posterImage?: string;
  customCredits?: { role: string; value: string }[];
}

export const FILMS: Film[] = [
  {
    id: '1',
    title: 'AVASARAMA? AHAMKARAMA!',
    productionNote: 'Ego consumes where purpose once stood.',
    color: '#0a1a2a',
    rating: 'UA',
    duration: '59:16 MINS',
    director: 'SRIRAM JALEPALLI & HARSHA RELANGI',
    producer: 'SUPREME TALKIES ORIGINALS',
    cast: 'SRIRAM JALLEPALLI, HARSHA RELANGI, VEEKSHITHA, MANI, CHETAN, PREETHAM, SIDDARTHA, ASHWANTH, ABHIRAM REDDY, SANDEEP, KOUSHAL PARAKALA OTHERS....',
    synopsis:
      'A young man’s attempt to escape his problems spirals into a bitter clash of egos with another man, where pride quickly overshadows purpose. What begins as a means to move forward turns into a battle for dominance, as neither is willing to step back. In the end, ego consumes the protagonist, overpowering his original need and leaving him trapped in the very conflict he sought to escape.',
    specialNote: 'First Supreme Talkies film',
    videoLink: 'https://youtu.be/c70oFsvDDyM?si=Cuko7RbvyYpsWOHZ',
    stills: ['/avasarama_bg1.webp', '/avasarama_bg2.webp', '/avasarama_bg3.webp'],
    reelImage: '/avasarama_reel.webp',
    writtenBy: 'SRIRAM JALLEPALLI',
    cinematography: 'SAI SRAVAN TANGUTURI, HARSHA RELANGI, SRIRAM JALLEPALLI',
    editing: 'HARSHA RELANGI, SHYAM, SATHWIK MALLELA',
    music: 'PRITISH & CHARAK',
  },
  {
    id: '2',
    title: 'SWAPPED',
    productionNote: 'A simple transaction spirals into a dangerous conflict.',
    color: '#1a0d0d',
    rating: 'A',
    duration: '7:04 MINS',
    director: 'PHANINDRA SAI M',
    producer: 'SUPREME TALKIES',
    cast: 'JAYATEJ, MAHESHWARA VARMA, VARUN KUMAR, PHANINDRA SAI, SATHWIK, CHARAK',
    synopsis:
      'SWAPPED is a 7-minute crime-drama that revolves around two characters locked in a moment of confrontation—a controlled exchange that slowly turns into an unsettling conflict. As tension builds and intentions begin to unravel, what seemed like a simple transaction reveals deeper motives and hidden stakes. In the end, control slips, and the situation spirals into something far more dangerous than either of them anticipated.',
    specialNote: 'First short film in Supreme Talkies',
    videoLink: 'https://youtu.be/RFQQZdo3NsQ?si=HkTuXgjSXFTN1Wzc',
    stills: ['/swapped_bg1.webp', '/swapped_bg2.webp', '/swapped_bg3.webp'],
    reelImage: '/swapped_reel.webp',
    writtenBy: 'PHANINDRA SAI M',
    cinematography: 'PHANINDRA SAI',
    editing: 'SATHWIK MALLELA',
    music: 'CHARAK',
    associateDirector: 'CHARAN TEJA',
  },
  {
    id: '3',
    title: 'THE CINEPHILE - MONARCHY OF MADNESS',
    productionNote: 'A passion for cinema turns into uncontrollable madness.',
    color: '#0d1a0d',
    rating: 'UA',
    duration: '47:04 MINS',
    director: 'SATHWIK MALLELA',
    producer: 'RISHI NERELLA',
    cast: 'TRENDRY, NISSI JOSHI',
    synopsis:
      'Facing his final days and driven by one last wish, a cinephile clings to cinema, where passion turns dangerous and madness slowly finds its throne. As reality begins to blur with the stories he worships, his obsession deepens into something uncontrollable. In his final pursuit, he is forced to confront whether he is escaping life—or losing himself to it entirely.',
    specialNote: 'First psychological drama',
    videoLink: 'https://youtu.be/tgWnoyzBAxI?si=1E2ZOspdY_4Ro3dv',
    stills: ['/cinephile_bg1.webp', '/cinephile_bg2.webp', '/cinephile_bg4.webp'],
    reelImage: '/cinephile_reel.webp',
    writtenBy: 'SATHWIK MALLELA',
    cinematography: 'CHETAN ROHAN',
    editing: 'SATHWIK MALLELA',
    music: 'CHARAK',
    colourist: 'BHARATH GEMPALA',
    publicityDesign: 'HARSHA RELANGI',
  },
  {
    id: '4',
    title: 'BAKING SODA',
    productionNote: 'Bad judgment and a mysterious packet lead to chaos.',
    color: '#1a1a0a',
    rating: 'UA',
    duration: '8:41 MINS',
    director: 'SUMANTH ATLURI & HARI MADDIGUNTA',
    producer: 'SUPREME TALKIES',
    cast: 'HARI MADDIGUNTA, SUMANTH ATLURI, PRANAV',
    synopsis:
      'Two clueless friends discover a mysterious white powder packet and believe they’ve struck gold. Armed with nothing but confidence and bad judgment, they dive into a plan that slowly spirals out of control. As paranoia sets in and their assumptions grow wilder, their friendship is pushed to the edge. What started as a lucky break soon unravels into chaos, forcing them to confront the absurd consequences of their own imagination.',
    specialNote: 'First sitcom shortfilm and won 28th shortfilm contest',
    videoLink: 'https://youtu.be/1EE54FtME-4?si=eDpYsNxIP7m_3ixu',
    stills: ['/bs_bg1.webp', '/bs_bg2.webp', '/bs_bg3.webp'],
    reelImage: '/bs_reel.webp',
    writtenBy: 'SUMANTH ATLURI & HARI MADDIGUNTA',
    cinematography: 'PRANAV SAI SUBINAY',
    editing: 'SUMANTH ATLURI & HARI MADDIGUNTA',
    music: 'CHARAK',
    publicityDesign: 'HARSHA RELANGI',
  },
  {
    id: '5',
    title: 'BARKING DOGS',
    productionNote: 'A violent path of revenge blurs reality and inner voices.',
    color: '#1a0a0a',
    rating: 'A',
    duration: '10:47 MINS',
    director: 'Jeyadev',
    producer: 'SUPREME TALKIES',
    cast: 'Arivazhagan, Subramanian',
    synopsis:
      'A troubled man, haunted by anger and isolation, sets out on a violent path of revenge—only to find himself spiraling into a reality where his inner voices begin to take control. As the line between truth and illusion blurs, he is forced to confront the darkest corners of his own mind.',
    specialNote: 'First bilingual film',
    videoLink: 'https://www.youtube.com/watch?v=1eMPZ1l5hi4',
    stills: ['/bd_bg1.webp', '/bd_bg3.webp'],
    reelImage: '/bd_reel.webp',
    presentedBy: 'Supreme Talkies',
    teluguDubbingTeam: 'Telugu Dialogues by Sriram Jallepalli\nDubbed by Harsha Relangi, Charak',
    supremeTalkiesTeam: 'Content Heads: Harsha Relangi, Sriram Jallepalli\nManager: Hari Maddigunta\nDubbing Supervision: Charak',
    comingSoon: false,
  },
];
