import React, { useState, useEffect, useRef } from 'react';
import { 
  Sun, Moon, Zap, Shield, Cpu, Layers, 
  Terminal as TerminalIcon, BookOpen, Wand2, 
  Layout, Fingerprint, Activity, ListOrdered,
  FileCode, Github, Linkedin, ExternalLink, GitFork, MessageSquare, AlertCircle 
} from 'lucide-react';

// --- Premium Emerald Loading Screen ---
const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => (prev < 100 ? prev + 1 : 100));
    }, 15);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-wrapper">
      <div className="loading-logo-glow"></div>
      <div className="loader-content">
        <img src="/logo.webp" className="logo-loading" alt="Echo Logo" />
        <div className="loading-text-container">
          <h2 className="loading-title" style={{ letterSpacing: '8px' }}>ECHO NEURAL INTERFACE</h2>
          <p className="loading-status">
            {progress < 30 ? 'AUTHENTICATING_USER' : 
             progress < 60 ? 'LOADING_NEURAL_MODELS' : 
             progress < 90 ? 'RECOVERING_LOCAL_MEMORY' : 'SYSTEM_READY'}
          </p>
          <div className="progress-container" style={{ width: '300px', height: '1px' }}>
            <div className="progress-fill" style={{ width: `${progress}%`, animation: 'none' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Terminal Component ---
const Terminal = ({ command, output }: { command: string, output?: string }) => (
  <div className="code-container">
    <div className="code-header">
      <div className="dot-red"></div>
      <div className="dot-yellow"></div>
      <div className="dot-green"></div>
    </div>
    <pre>
      <span className="cmd">$ {command}</span>
      {output && <div style={{ color: 'var(--text-muted)', marginTop: '12px', fontSize: '0.9rem' }}>{output}</div>}
    </pre>
  </div>
);

// --- Doc Section Component ---
const DocSection = ({ id, label, children, onVisible }: { id: string, label: string, children: any, onVisible: (id: string) => void }) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onVisible(id);
          entry.target.classList.add('visible');
        }
      },
      { threshold: 0.05 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [id, onVisible]);

  return (
    <section id={id} ref={ref} className="section">
      <span className="section-label">{label}</span>
      {children}
    </section>
  );
};

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  url?: string;
}

interface NavGroup {
  group: string;
  icon: React.ReactNode;
  items: NavItem[];
}

function App() {
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [activeSection, setActiveSection] = useState('welcome');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  if (loading) return <LoadingScreen />;

  const navigation: NavGroup[] = [
    { 
      group: 'Foundations', 
      icon: <BookOpen size={14} />,
      items: [
        { id: 'welcome', label: 'Vision & UI', icon: <Layout size={16} /> },
        { id: 'setup', label: 'Instant Onboarding', icon: <Zap size={16} /> }
      ]
    },
    { 
      group: 'Neural Engine', 
      icon: <Cpu size={14} />,
      items: [
        { id: 'intelligence', label: 'Multi-Brain AI', icon: <Activity size={16} /> },
        { id: 'memory', label: 'Secure Memory', icon: <Fingerprint size={16} /> }
      ]
    },
    { 
      group: 'Architecture', 
      icon: <Layers size={14} />,
      items: [
        { id: 'workflows', label: 'Workflow Macros', icon: <Wand2 size={16} /> },
        { id: 'plugins-deep', label: 'Plugins Deep Dive', icon: <FileCode size={16} /> }
      ]
    },
    {
      group: 'Settings Mastery',
      icon: <Shield size={14} />,
      items: [
        { id: 'config-guide', label: 'Detailed Config', icon: <ListOrdered size={16} /> },
        { id: 'startup', label: 'Startup & RAM', icon: <Zap size={16} /> },
        { id: 'voice-guide', label: 'Voice Engines', icon: <Cpu size={16} /> }
      ]
    },
    {
      group: 'Reference',
      icon: <TerminalIcon size={14} />,
      items: [
        { id: 'cli', label: 'Command Line', icon: <TerminalIcon size={16} /> },
        { id: 'hud', label: 'HUD Interface', icon: <Layout size={16} /> }
      ]
    },
    {
      group: 'Connect',
      icon: <ExternalLink size={14} />,
      items: [
        { id: 'github-profile', label: 'GitHub Profile', icon: <Github size={16} />, url: 'https://github.com/MuhammadUsmanGM' },
        { id: 'linkedin', label: 'LinkedIn Profile', icon: <Linkedin size={16} />, url: 'https://www.linkedin.com/in/muhammad-usman-ai-dev' }
      ]
    }
  ];

  return (
    <div className="docs-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-container">
          <img src="/logo.webp" className="logo-img" alt="Echo Logo" />
        </div>

        <nav>
          {navigation.map(group => (
            <div key={group.group} className="nav-section">
              <h4 className="nav-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {group.icon} {group.group}
              </h4>
              {group.items.map(item => (
                item.url ? (
                  <a 
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-item external"
                    style={{ color: 'var(--accent-primary)', opacity: 0.8 }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </a>
                ) : (
                  <a 
                    key={item.id}
                    href={`#${item.id}`} 
                    className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </a>
                )
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Theme Toggle */}
      <button className="theme-toggle" onClick={toggleTheme} title="Toggle Theme">
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Main Content Area */}
      <main className="content-area">
        <DocSection id="welcome" label="Foundation_01" onVisible={setActiveSection}>
          <h1 className="hero-title">Precision AI.<br/>Ultimate Control.</h1>
          <p className="hero-subtitle">
            Echo is a high-performance system agent designed to handle your digital life through a beautiful, holographic neural interface.
          </p>
          
          <div className="feature-grid">
            <div className="feature-card">
              <div className="card-num">01</div>
              <h3>Glassmorphic UI</h3>
              <p className="text-content">A stunning, translucent interface that feels part of your OS. Accessible via <code>Ctrl + Shift + E</code>.</p>
            </div>
            <div className="feature-card">
              <div className="card-num">02</div>
              <h3>Low Latency</h3>
              <p className="text-content">Powered by Flash-optimized neural models, Echo responds to commands in sub-500ms intervals.</p>
            </div>
          </div>

          <div className="github-cta">
            <div className="cta-tag">OPEN_SOURCE_PROTOCOL</div>
            <h2 className="cta-title">Evolve the System</h2>
            <p className="cta-desc">Echo is built by the community. Fork the repository to add your own neural modules or leave a suggestion for the next iteration.</p>
            <a 
              href="https://github.com/MuhammadUsmanGM/Echo-Neural-Interface" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="cta-btn-premium"
            >
              <Github size={22} />
              <span>Fork or Suggest</span>
            </a>
          </div>
        </DocSection>

        <DocSection id="setup" label="Guide_02" onVisible={setActiveSection}>
          <h2 className="section-title">Zero-Friction Setup</h2>
          <p className="text-content">Unlike legacy assistants, Echo respects your time. The initial setup is a two-step process that takes less than 20 seconds.</p>
          
          <div className="step-item">
            <div className="step-num"><Shield size={18} /></div>
            <div className="step-content">
              <h4>Global Authentication</h4>
              <p className="text-content">Connect your API key from Google, OpenAI, Anthropic, or DeepSeek. Echo automatically configures the best model for your machine.</p>
            </div>
          </div>
          
          <div className="step-item">
            <div className="step-num"><Fingerprint size={18} /></div>
            <div className="step-content">
              <h4>Digital Identity</h4>
              <p className="text-content">Echo addresses you by your chosen name. No stiff "Sir" or "Mister" formalities—just a peer-to-peer relationship.</p>
            </div>
          </div>

          <Terminal command="echo setup" output="✓ Provider set to Gemini 2.0 Flash Lite. Welcome back, Usman." />
        </DocSection>

        <DocSection id="intelligence" label="Logic_03" onVisible={setActiveSection}>
          <h2 className="section-title">Multi-Model Intelligence</h2>
          <p className="text-content">Switch between the world's most capable AI "Brains" instantly. No complex reconfiguration required.</p>
          
          <div className="point-row">
            <div className="point-key">Adaptive Brains</div>
            <div className="point-val">Choose Gemini for speed, GPT-4o for precision, or Claude for complex coding tasks.</div>
          </div>
          <div className="point-row">
            <div className="point-key">Model Selection</div>
            <div className="point-val">Access the "Intelligence" hub in <code>echo config</code> to toggle between specific model versions.</div>
          </div>

          <div className="feature-grid">
            <div className="feature-card" style={{ borderColor: 'var(--accent-primary)' }}>
              <h3>Flash Models</h3>
              <p className="text-content">Perfect for system control, app launches, and quick facts. Minimal token usage and maximum speed.</p>
            </div>
            <div className="feature-card">
              <h3>Reasoning Models</h3>
              <p className="text-content">Ideal for long-form content generation, data analysis, and architecting complex code solutions.</p>
            </div>
          </div>
        </DocSection>

        <DocSection id="memory" label="Privacy_04" onVisible={setActiveSection}>
          <h2 className="section-title">Encrypted Local Memory</h2>
          <p className="text-content">Your data belongs to you. Period. Echo uses hardware-bound encryption to secure your preferences and history.</p>
          
          <div className="code-container" style={{ borderColor: 'var(--accent-primary)', background: 'rgba(16, 185, 129, 0.05)' }}>
            <pre>
              <span className="syntax-comment">// Security Protocol: Hardware-Locked</span><br/>
              <span className="syntax-keyword">Encryption:</span> AES-256-CBC with unique machine salt<br/>
              <span className="syntax-keyword">Persistence:</span> Encrypted persistence in ~/.echo-memory/<br/>
              <span className="syntax-keyword">Privacy:</span> 0% data shared for training
            </pre>
          </div>
          <p className="text-content">
            Manage your digital footprint using the <code>echo memory</code> suite to enable, disable, or purge history.
          </p>
        </DocSection>

        <DocSection id="workflows" label="Automation_05" onVisible={setActiveSection}>
          <h2 className="section-title">Workflow Macros</h2>
          <p className="text-content">Stop repeating yourself. Workflows allow you to chain complex system actions into a single keyword.</p>
          
          <div className="feature-grid">
            <div className="feature-card">
              <h3>Dev Mode</h3>
              <p className="text-content">"Echo, activate Dev mode" → Opens VS Code, starts Docker, and opens Jira in Chrome.</p>
            </div>
            <div className="feature-card">
              <h3>Deep Focus</h3>
              <p className="text-content">"Echo, deep focus" → Closes Slack, turns on Do Not Disturb, and plays Lo-Fi on Spotify.</p>
            </div>
          </div>
          
          <Terminal command="echo workflows" output="Entering interactive workflow builder..." />
        </DocSection>


        <DocSection id="plugins-deep" label="Core_06" onVisible={setActiveSection}>
          <h2 className="section-title">Universal Plugins & Deep Dive</h2>
          <p className="text-content">Echo's capability is literally infinite. Every system tool is a "System Action" that can be called by the LLM. You can extend this using our modular plugin architecture.</p>
          
          <div className="grid">
            <div className="point-row">
              <div className="point-key">Built-in Plugins</div>
              <div className="point-val">Productivity (Clock, Timer), System (App Launcher, Shell), and Web Search.</div>
            </div>
            <div className="point-row">
              <div className="point-key">Developer Kit</div>
              <div className="point-val">Run <code>echo plugins --create</code> to generate a scaffold for a new tool instantly.</div>
            </div>
          </div>

          <div className="code-container" style={{ marginTop: '20px' }}>
            <pre>
              <span className="syntax-comment">// Create a tool in seconds</span><br/>
              <span className="syntax-keyword">module.exports</span> = &#123;<br/>
              &nbsp;&nbsp;<span className="syntax-keyword">name:</span> <span className="syntax-string">'weather'</span>,<br/>
              &nbsp;&nbsp;<span className="syntax-keyword">commands:</span> &#123;<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="syntax-keyword">get_forecast:</span> (city) =&gt; &#123; ... &#125;<br/>
              &nbsp;&nbsp;&#125;<br/>
              &#125;;
            </pre>
          </div>
        </DocSection>

        <DocSection id="config-guide" label="Control_07" onVisible={setActiveSection}>
          <h2 className="section-title">Mastering Settings</h2>
          <p className="text-content">Accessible via <code>echo config</code>, this is the central nervous system of your Echo experience. Here is a breakdown of every module:</p>
          
          <div className="feature-grid">
            <div className="feature-card">
              <h3>🎨 Appearance</h3>
              <p className="text-content">Switch themes (Emerald, Purple, Gold) and adjust the HUD window size to your screen resolution.</p>
            </div>
            <div className="feature-card">
              <h3>🤖 AI Intelligence</h3>
              <p className="text-content">Connect providers. Mix-and-match: Use Gemini for quick tasks and GPT-4o for complex reasoning.</p>
            </div>
            <div className="feature-card">
              <h3>🧪 Plugin Manager</h3>
              <p className="text-content">Enable or disable specific neural tools. Keep your system lean by loading only what you need.</p>
            </div>
            <div className="feature-card">
              <h3>🧠 Memory Lab</h3>
              <p className="text-content">Toggle conversational history. Here you can also "Purify" Echo's memory, deleting all local learning.</p>
            </div>
          </div>
        </DocSection>

        <DocSection id="voice-guide" label="Audio_08" onVisible={setActiveSection}>
          <h2 className="section-title">Voice Engine Excellence</h2>
          <p className="text-content">Echo supports three distinct levels of speech recognition to match your privacy and hardware requirements.</p>
          
          <div className="step-item">
            <div className="step-num">01</div>
            <div className="step-content">
              <h4>Browser API (Native)</h4>
              <p className="text-content">Zero setup, zero cost. Uses your system's built-in recognition. Best for 90% of basic commands.</p>
            </div>
          </div>

          <div className="step-item">
            <div className="step-num">02</div>
            <div className="step-content">
              <h4>Whisper Cloud (OpenAI)</h4>
              <p className="text-content">Superior accuracy for complex sentences. Requires an OpenAI API key and an internet connection.</p>
            </div>
          </div>

          <div className="step-item" style={{ border: '1px solid var(--accent-primary)', borderRadius: '8px', padding: '15px' }}>
            <div className="step-num">03</div>
            <div className="step-content">
              <h4>Whisper Local (Private)</h4>
              <p className="text-content">The ultimate pro setup. Processes voice 100% on your local machine. No data leaves your room. Requires a one-time binary download via our setup wizard.</p>
            </div>
          </div>
        </DocSection>

        <DocSection id="startup" label="System_09" onVisible={setActiveSection}>
          <h2 className="section-title">Startup & Resources</h2>
          <p className="text-content">We respect your hardware. Echo defaults to <strong>Manual Mode</strong> to conserve RAM.</p>
          
          <div className="point-row">
            <div className="point-key">Manual Launch</div>
            <div className="point-val">Run <code>echo start</code> when needed. Consumes 0% resources when closed.</div>
          </div>
          <div className="point-row">
            <div className="point-key">Neural Hook (Boot)</div>
            <div className="point-val">Enable in <code>echo config</code> to have the "Ctrl+Shift+E" hotkey available instantly on login.</div>
          </div>
        </DocSection>

        <DocSection id="cli" label="Reference_10" onVisible={setActiveSection}>
          <h2 className="section-title">Command Line Reference</h2>
          <p className="text-content">Echo's CLI is built on a high-tier Commander framework. Common usage patterns:</p>
          
          <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="point-row">
              <div className="point-key"><code>echo start [--debug]</code></div>
              <div className="point-val">Launch the HUD. Use <code>--debug</code> to see neural logs.</div>
            </div>
            <div className="point-row">
              <div className="point-key"><code>echo config</code></div>
              <div className="point-val">Interactive settings hub. Changes take effect instantly.</div>
            </div>
            <div className="point-row">
              <div className="point-key"><code>echo startup [--enable|--disable]</code></div>
              <div className="point-val">Quickly set your boot launch preference without menus.</div>
            </div>
            <div className="point-row">
              <div className="point-key"><code>echo memory --clear</code></div>
              <div className="point-val">Nuclear option: Wipes all conversational memory local files.</div>
            </div>
            <div className="point-row">
              <div className="point-key"><code>echo docs</code></div>
              <div className="point-val">Launches this Documentation Hub on Port 1138.</div>
            </div>
          </div>
        </DocSection>

        <DocSection id="hud" label="UX_11" onVisible={setActiveSection}>
          <h2 className="section-title">The HUD Interface</h2>
          <p className="text-content">The Holographic HUD is your window into Echo's mind. Master these interactions:</p>
          
          <div className="feature-grid">
            <div className="feature-card">
              <h3>Hotkeys</h3>
              <p className="text-content">Trigger with <code>Ctrl + Shift + E</code>. Toggle between voice and text input with a single click on the central sphere.</p>
            </div>
            <div className="feature-card">
              <h3>Visual Feedback</h3>
              <p className="text-content">Spheres rotating slowly = Idle. High-speed spin = Thinking. Glowing Green = Transmitting speech.</p>
            </div>
          </div>
        </DocSection>

        <div className="community-section" style={{ marginTop: '8rem', borderTop: '1px solid var(--border)', paddingTop: '4rem' }}>
          <div className="section-label">COMMUNITY_PROTOCOL</div>
          <h2 className="section-title">Support & Growth</h2>
          <p className="text-content">Join the evolution of the Echo Neural Interface. Whether you're a developer or a visionary, your contribution matters.</p>
          
          <div className="feature-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            <a href="https://github.com/MuhammadUsmanGM/Echo-Neural-Interface/fork" target="_blank" rel="noopener noreferrer" className="feature-card community-card">
              <GitFork size={24} className="card-icon" />
              <h3>Fork Repository</h3>
              <p className="text-content" style={{ fontSize: '0.95rem' }}>Clone the source to your workshop and build your own custom neural modules.</p>
            </a>
            <a href="https://github.com/MuhammadUsmanGM/Echo-Neural-Interface/issues/new" target="_blank" rel="noopener noreferrer" className="feature-card community-card">
              <AlertCircle size={24} className="card-icon" />
              <h3>Report Issues</h3>
              <p className="text-content" style={{ fontSize: '0.95rem' }}>Found a glitch in the matrix? Let us know so we can patch the neural link.</p>
            </a>
            <a href="https://github.com/MuhammadUsmanGM/Echo-Neural-Interface/discussions" target="_blank" rel="noopener noreferrer" className="feature-card community-card">
              <MessageSquare size={24} className="card-icon" />
              <h3>Have Suggestions?</h3>
              <p className="text-content" style={{ fontSize: '0.95rem' }}>Share your vision for future updates and help shape the Echo ecosystem.</p>
            </a>
          </div>
        </div>

        <footer className="footer">
          <p className="footer-text">Built for the next generation of performance desktop interaction.</p>
          <div className="footer-socials" style={{ marginTop: '15px', display: 'flex', gap: '20px', justifyContent: 'center' }}>
            <a href="https://github.com/MuhammadUsmanGM/Echo-Neural-Interface" target="_blank" rel="noopener noreferrer" className="social-link" title="Source Code">
              <Github size={18} />
            </a>
            <a href="https://www.linkedin.com/in/muhammad-usman-ai-dev" target="_blank" rel="noopener noreferrer" className="social-link" title="LinkedIn">
              <Linkedin size={18} />
            </a>
          </div>
          <p className="footer-text" style={{ marginTop: '15px' }}>© 2026 Muhammad Usman | Echo Neural Interface. All Rights Reserved.</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
