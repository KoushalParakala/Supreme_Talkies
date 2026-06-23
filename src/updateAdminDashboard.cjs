const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'Codes', 'Supreme talkies main', 'src', 'pages', 'dashboards', 'AdminDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. useState for section
content = content.replace(
  "const [section, setSection] = useState<'INBOX' | 'WRITERS' | 'PROJECTS' | 'PROJECT ROOMS' | 'CAMPAIGNS' | 'CREW' | 'TEMPLATES' | 'FILMS' | 'SCREENINGS'>('INBOX');",
  "const [section, setSection] = useState<'FILMS' | 'WRITERS' | 'PROJECTS' | 'PROJECT ROOMS' | 'MARKETING' | 'CAMPAIGNS' | 'CREW' | 'SCREENINGS'>('FILMS');"
);

// 2. INBOX state to MARKETING state
content = content.replace(
  `  // INBOX state
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [typeFilter, setTypeFilter] = useState('all');
  const [submissions, setSubmissions] = useState<any[]>([]);`,
  `  // MARKETING state
  const [marketingTab, setMarketingTab] = useState<'marketing_idea' | 'collab'>('marketing_idea');
  const [submissions, setSubmissions] = useState<any[]>([]);`
);

// 3. TEMPLATES state removal
content = content.replace(
  `  // TEMPLATES state
  const [dbTemplates, setDbTemplates] = useState<any[]>([]);
  const [newTemplate, setNewTemplate] = useState({ label: '', type: 'REPLY', subject: '', body: '' });
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [useTemplateModal, setUseTemplateModal] = useState<any>(null);
  const [templateVars, setTemplateVars] = useState({ writer_name: '', script_title: '', reviewer_name: '' });

  // PROJECT ROOMS upgrades`,
  `  // PROJECT ROOMS upgrades`
);

// 4. fetchData INBOX to MARKETING
content = content.replace(
  `      if (section === 'INBOX') {
        setDebugStep('Fetching INBOX submissions...');
        const { data, error: err } = await supabase.from('submissions').select('*, profiles(full_name, avatar_symbol, st_id)').order('created_at', { ascending: false });
        if (fetchId !== fetchIdRef.current) return;
        setDebugStep('INBOX fetch complete');
        if (err) throw err;
        setSubmissions(data || []);
      } else if (section === 'WRITERS') {`,
  `      if (section === 'MARKETING') {
        setDebugStep('Fetching MARKETING submissions...');
        const { data, error: err } = await supabase.from('submissions').select('*, profiles(full_name, avatar_symbol, st_id)').in('type', ['marketing_idea', 'collab']).order('created_at', { ascending: false });
        if (fetchId !== fetchIdRef.current) return;
        setDebugStep('MARKETING fetch complete');
        if (err) throw err;
        setSubmissions(data || []);
      } else if (section === 'WRITERS') {`
);

// 5. Remove TEMPLATES fetchData
content = content.replace(
  `      } else if (section === 'TEMPLATES') {
        const { data, error: err } = await supabase.from('admin_templates').select('*').order('created_at', { ascending: false });
        if (fetchId !== fetchIdRef.current) return;
        if (err) throw err;
        setDbTemplates(data || []);
      } else if (section === 'SCREENINGS') {`,
  `      } else if (section === 'SCREENINGS') {`
);

// 6. Remove saveTemplate & deleteTemplate functions
const tempActionsRegex = /  const saveTemplate = async \(\) => \{[\s\S]*?const createCampaign = async \(\) => \{/;
content = content.replace(tempActionsRegex, "  const createCampaign = async () => {");

// 7. Remove TEMPLATES constant
const tempConstRegex = /  const TEMPLATES = \[[\s\S]*?  \];\n\n  const copyToClipboard = \(text: string\) => \{/;
content = content.replace(tempConstRegex, "  const copyToClipboard = (text: string) => {");

// 8. Remove filteredSubmissions
const filteredRegex = /  const filteredSubmissions = useMemo\(\(\) => \n    submissions\.filter\(s => typeFilter === 'all' \|\| s\.type === typeFilter\)\n  , \[submissions, typeFilter\]\);\n\n  if \(!authLoading && !isAdmin\) \{/;
content = content.replace(filteredRegex, "  if (!authLoading && !isAdmin) {");

// 9. Tabs bar
content = content.replace(
  `{['INBOX', 'WRITERS', 'PROJECTS', 'PROJECT ROOMS', 'CAMPAIGNS', 'TEMPLATES', 'FILMS', 'SCREENINGS'].map(s => (`,
  `{['FILMS', 'WRITERS', 'PROJECTS', 'PROJECT ROOMS', 'MARKETING', 'CAMPAIGNS', 'SCREENINGS'].map(s => (`
);

// 10. Replace INBOX UI block with MARKETING UI block
const inboxUiRegex = /\{section === 'INBOX' && \([\s\S]*?\}\)\}\n              <\/div>\n            \)\}\n          <\/motion\.div>\n        \)\}\n        \{section === 'WRITERS' && \(/;

const newMarketingUi = `{section === 'MARKETING' && (
          <motion.div key="marketing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', borderBottom: '1px solid rgba(188,168,142,0.1)', paddingBottom: 16 }}>
              {['marketing_idea', 'collab'].map(type => (
                <button key={type} onClick={() => setMarketingTab(type as any)}
                  style={{
                    background: marketingTab === type ? 'rgba(188,168,142,0.1)' : 'none',
                    border: '1px solid rgba(188,168,142,0.1)',
                    padding: '8px 16px', fontFamily: 'Inter, monospace', fontSize: 10, letterSpacing: 2,
                    color: marketingTab === type ? '#BCA88E' : 'rgba(188,168,142,0.5)', cursor: 'pointer'
                  }}
                >
                  {type === 'marketing_idea' ? 'MARKETING IDEAS' : 'MARKETERS (COLLAB)'}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {submissions.filter(s => s.type === marketingTab).length === 0 && !loading && (
                <p style={{ textAlign: 'center', opacity: 0.3, fontSize: 11, padding: 40 }}>NO {marketingTab === 'marketing_idea' ? 'IDEAS' : 'MARKETERS'} FOUND</p>
              )}
              {submissions.filter(s => s.type === marketingTab).map(sub => (
                <div key={sub.id} style={{ padding: 24, border: '1px solid rgba(188,168,142,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontFamily: 'Inter, monospace', fontSize: 12, color: '#F0EBE0', opacity: 0.6 }}>{sub.profiles?.full_name || 'Unknown'}</span>
                      </div>
                      <div>
                        <p style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, color: '#F0EBE0', margin: 0 }}>
                          {sub.type === 'collab' ? sub.data?.platform : 'Marketing Idea'}
                        </p>
                        <p style={{ fontFamily: 'Inter, monospace', fontSize: 9, color: '#BCA88E', opacity: 0.5, letterSpacing: 3, margin: 0 }}>
                          {sub.profiles?.st_id ? (sub.profiles.st_id.startsWith('SUPR-') ? \`(\${sub.profiles.st_id})\` : \`(SUPR-\${sub.profiles.st_id})\`) : ''} · {sub.status?.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => updateSubStatus(sub.id, 'accepted')} style={{ background: 'none', border: '1px solid #BCA88E', color: '#BCA88E', fontSize: 9, padding: '4px 12px', cursor: 'pointer' }}>ACCEPT</button>
                      <button onClick={() => updateSubStatus(sub.id, 'archived')} style={{ background: 'none', border: '1px solid rgba(255,0,0,0.3)', color: 'rgba(255,0,0,0.5)', fontSize: 9, padding: '4px 12px', cursor: 'pointer' }}>ARCHIVE</button>
                    </div>
                  </div>
                  
                  {sub.type === 'marketing_idea' ? (
                    <div style={{ padding: 16, background: sub.data?.color || 'rgba(255,255,255,0.05)', color: '#1a1a1a', fontFamily: 'Inter, monospace', fontSize: 12, marginBottom: 20, borderRadius: 4 }}>
                      {sub.data?.text}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(255,255,255,0.02)', padding: 16, border: '1px solid rgba(188,168,142,0.05)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: 2, color: '#BCA88E', margin: '0 0 4px' }}>PLATFORM / HANDLE</p>
                          <p style={{ fontFamily: 'Inter, monospace', fontSize: 13, color: '#F0EBE0', margin: 0 }}>{sub.data?.platform}</p>
                        </div>
                        <div>
                          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: 2, color: '#BCA88E', margin: '0 0 4px' }}>FOLLOWER COUNT</p>
                          <p style={{ fontFamily: 'Inter, monospace', fontSize: 13, color: '#F0EBE0', margin: 0 }}>{sub.data?.follower_count}</p>
                        </div>
                      </div>
                      <div>
                        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 9, letterSpacing: 2, color: '#BCA88E', margin: '0 0 4px' }}>COLLAB IDEA</p>
                        <p style={{ fontFamily: 'Inter, monospace', fontSize: 13, color: '#F0EBE0', margin: 0, whiteSpace: 'pre-wrap' }}>{sub.data?.collab_idea}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
        {section === 'WRITERS' && (`;

content = content.replace(inboxUiRegex, newMarketingUi);

// 11. Remove TEMPLATES block entirely
const templatesBlockRegex = /        \{section === 'TEMPLATES' && \([\s\S]*?<\/motion\.div>\n        \)\}\n\n        \{section === 'FILMS' && \(/;
content = content.replace(templatesBlockRegex, "        {section === 'FILMS' && (");

// 12. Remove USE TEMPLATE MODAL entirely
const modalRegex = /      \{\/\* USE TEMPLATE MODAL \*\/\}[\s\S]*?<\/AnimatePresence>\n    <\/div>\n  \);\n\}/;
content = content.replace(modalRegex, "    </div>\n  );\n}");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated AdminDashboard.tsx');
