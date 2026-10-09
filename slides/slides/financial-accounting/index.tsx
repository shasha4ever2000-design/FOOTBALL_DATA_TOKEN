import {
  type DesignSystem,
  MorphElement,
  type Page,
  type SlideMeta,
  type SlideTransition,
  Step,
  Steps,
  useIsActivePage,
  useSlidePageNumber,
} from '@open-slide/core';
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';

export const design: DesignSystem = {
  palette: { bg: '#f3ecd8', text: '#1e2b24', accent: '#1f5e42' },
  fonts: {
    display: 'Georgia, "Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif',
    body: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif',
  },
  typeScale: { hero: 140, body: 36 },
  radius: 6,
};

// Ledger-paper extras that sit outside the DesignSystem shape.
const ink = {
  red: '#a63a2e',
  muted: '#6c6a58',
  line: '#cbbf9c',
  ruled: 'rgba(52, 96, 120, 0.13)',
  margin: 'rgba(166, 58, 46, 0.42)',
  card: 'rgba(255, 252, 240, 0.72)',
  accentSoft: 'rgba(31, 94, 66, 0.08)',
};

const mono = '"SF Mono", "IBM Plex Mono", Menlo, Consolas, ui-monospace, monospace';

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const EASE_OUT = 'cubic-bezier(0, 0, 0.2, 1)';
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';
const HOLD: Keyframe[] = [{ opacity: 1 }, { opacity: 1 }];
const MORPH_MS = 820;
const COUNT_MS = 1100;

// ── Transitions ─────────────────────────────────────────────────────────────

// Rise: the house cut.
export const transition: SlideTransition = {
  duration: 260,
  exit: { duration: 260, easing: EASE_IN, keyframes: HOLD },
  enter: {
    duration: 260,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(6px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
  },
};

// Settle: cover and chapter openers.
const settle: SlideTransition = {
  duration: 280,
  exit: { duration: 280, easing: EASE_IN, keyframes: HOLD },
  enter: {
    duration: 280,
    easing: EASE_OUT,
    keyframes: [
      { opacity: 0, transform: 'translateY(12px)', filter: 'blur(4px)' },
      { opacity: 1, transform: 'translateY(0)', filter: 'blur(0)' },
    ],
  },
};

// The equation glides from centre stage into the worked example's corner.
const morphCut: SlideTransition = {
  duration: 300,
  exit: { duration: 300, easing: EASE_IN, keyframes: HOLD },
  enter: { duration: 300, easing: EASE_OUT, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
  morph: { duration: MORPH_MS, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
};

// ── Motion CSS ──────────────────────────────────────────────────────────────
// Base styles are the resting state; keyframes only say where things come from.
// Inactive instances (thumbnails, overview, morph snapshots) carry data-still.
// The `.fa-s*` classes start when their enclosing <Step> flips to revealed.
const css = `
  .fa { animation-timing-function: ${EASE}; animation-fill-mode: both; }
  @keyframes fa-rise { from { opacity: 0; transform: translateY(14px); } }
  @keyframes fa-fade { from { opacity: 0; } }
  @keyframes fa-draw { from { transform: scaleX(0); } }
  @keyframes fa-drop { from { transform: scaleY(0); } }
  .fa-rise { animation-name: fa-rise; animation-duration: 0.8s; }
  .fa-fade { animation-name: fa-fade; animation-duration: 0.7s; }
  .fa-draw { animation-name: fa-draw; animation-duration: 1s; transform-origin: left center; }
  .fa-drop { animation-name: fa-drop; animation-duration: 0.8s; transform-origin: top center; }
  [data-osd-step="revealed"] .fa-srise { animation: fa-rise 0.6s ${EASE} both; }
  [data-osd-step="revealed"] .fa-sdraw { animation: fa-draw 0.7s ${EASE} both; transform-origin: left center; }
  [data-osd-step="revealed"] .fa-sdrop { animation: fa-drop 0.6s ${EASE} both; transform-origin: bottom center; }
  [data-still] .fa, [data-still] .fa-srise, [data-still] .fa-sdraw, [data-still] .fa-sdrop { animation: none !important; }
  @media (prefers-reduced-motion: reduce) {
    .fa, .fa-srise, .fa-sdraw, .fa-sdrop { animation: none !important; }
  }
`;

// ── Shared building blocks ──────────────────────────────────────────────────

const fill: CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  background: 'var(--osd-bg)',
  color: 'var(--osd-text)',
  fontFamily: 'var(--osd-font-body)',
  WebkitFontSmoothing: 'antialiased',
};

const body: CSSProperties = {
  position: 'absolute',
  left: 180,
  right: 160,
  top: 116,
  bottom: 150,
  display: 'flex',
  flexDirection: 'column',
};

const eyebrow: CSSProperties = {
  fontFamily: mono,
  fontSize: 22,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--osd-accent)',
  lineHeight: 1.4,
};

const heading: CSSProperties = {
  fontFamily: 'var(--osd-font-display)',
  fontSize: 72,
  fontWeight: 700,
  lineHeight: 1.15,
  letterSpacing: '-0.01em',
  margin: '16px 0 0',
};

const fmt = new Intl.NumberFormat('en-US');

const Footer = () => {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={{
        position: 'absolute',
        left: 180,
        right: 160,
        bottom: 56,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        fontFamily: mono,
        fontSize: 20,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: ink.muted,
      }}
    >
      <span>Principles of Financial Accounting</span>
      <span>
        p. {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
    </div>
  );
};

// The ruled ledger sheet every page is drawn on.
const Paper = ({ children, footer = true }: { children: ReactNode; footer?: boolean }) => {
  const active = useIsActivePage();
  return (
    <div style={fill} data-still={active ? undefined : ''}>
      <style>{css}</style>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent 59px, ${ink.ruled} 59px, ${ink.ruled} 60px)`,
          backgroundPosition: '0 28px',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 112,
          width: 6,
          borderLeft: `2px solid ${ink.margin}`,
          borderRight: `2px solid ${ink.margin}`,
          pointerEvents: 'none',
        }}
      />
      {children}
      {footer && <Footer />}
    </div>
  );
};

// Accountants double-underline a final total.
const DoubleRule = ({
  width,
  delay = 0,
  className = 'fa fa-draw',
}: {
  width: number;
  delay?: number;
  className?: string;
}) => (
  <div
    className={className}
    style={{
      width,
      height: 10,
      borderTop: '3px solid var(--osd-accent)',
      borderBottom: '3px solid var(--osd-accent)',
      animationDelay: `${delay}s`,
    }}
  />
);

// Counts up to `value` when its <Step> is revealed (or on mount outside a Step).
// Jumping in with the step already showing renders the settled number.
const CountUp = ({
  value,
  prefix = '',
  signed = false,
  dash = false,
}: {
  value: number;
  prefix?: string;
  signed?: boolean;
  dash?: boolean;
}) => {
  const active = useIsActivePage();
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    setShown(value);
    if (!active || value === 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const run = () => {
      cancelAnimationFrame(raf);
      setShown(0);
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / COUNT_MS);
        setShown(Math.round(value * (1 - (1 - p) ** 3)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const step = ref.current?.closest('[data-osd-step]');
    if (!step) {
      run();
      return () => cancelAnimationFrame(raf);
    }
    let revealed = step.getAttribute('data-osd-step') === 'revealed';
    const observer = new MutationObserver(() => {
      const now = step.getAttribute('data-osd-step') === 'revealed';
      if (now && !revealed) run();
      if (!now) {
        cancelAnimationFrame(raf);
        setShown(value);
      }
      revealed = now;
    });
    observer.observe(step, { attributes: true, attributeFilter: ['data-osd-step'] });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [active, value]);

  let text: string;
  if (value === 0 && dash) text = '—';
  else {
    const sign = shown < 0 ? '−' : signed && value > 0 ? '+' : '';
    text = `${sign}${prefix}${fmt.format(Math.abs(shown))}`;
  }
  return <span ref={ref}>{text}</span>;
};

const Card = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div
    style={{
      background: ink.card,
      border: `1.5px solid ${ink.line}`,
      borderRadius: 'var(--osd-radius)',
      padding: '32px 40px',
      height: '100%',
      boxSizing: 'border-box',
      ...style,
    }}
  >
    {children}
  </div>
);

// ── 01 Cover ────────────────────────────────────────────────────────────────

const Cover: Page = () => (
  <Paper footer={false}>
    <div
      style={{
        position: 'absolute',
        left: 180,
        right: 160,
        top: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div className="fa fa-fade" style={{ ...eyebrow, fontSize: 26, animationDelay: '0.1s' }}>
        A field guide to the books
      </div>
      <h1
        className="fa fa-rise"
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 'var(--osd-size-hero)',
          fontWeight: 700,
          lineHeight: 1.04,
          letterSpacing: '-0.02em',
          margin: '36px 0 40px',
          animationDelay: '0.2s',
        }}
      >
        Principles of
        <br />
        Financial Accounting
      </h1>
      <DoubleRule width={980} delay={0.7} />
      <p
        className="fa fa-rise"
        style={{
          fontSize: 38,
          lineHeight: 1.5,
          color: ink.muted,
          maxWidth: 1060,
          margin: '40px 0 0',
          animationDelay: '1s',
        }}
      >
        How businesses record what happens to them — and turn it into reports people can trust.
      </p>
    </div>
    <div
      className="fa fa-fade"
      style={{ position: 'absolute', right: 160, bottom: 120, width: 380, animationDelay: '1.3s' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          fontFamily: mono,
          fontSize: 30,
          color: ink.muted,
          paddingBottom: 12,
        }}
      >
        <span>Dr</span>
        <span>Cr</span>
      </div>
      <div style={{ height: 3, background: ink.muted }} />
      <div style={{ width: 3, height: 150, background: ink.muted, margin: '0 auto' }} />
    </div>
  </Paper>
);
Cover.transition = settle;

// ── 02 What it's for ────────────────────────────────────────────────────────

const ReaderCard = ({ who, question }: { who: string; question: string }) => (
  <div className="fa-srise" style={{ height: '100%' }}>
    <Card>
      <div
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 36,
          fontWeight: 700,
          lineHeight: 1.2,
        }}
      >
        {who}
      </div>
      <div
        style={{ fontSize: 30, fontStyle: 'italic', lineHeight: 1.45, color: ink.muted, marginTop: 12 }}
      >
        {question}
      </div>
    </Card>
  </div>
);

const Purpose: Page = () => (
  <Paper>
    <div style={body}>
      <div style={eyebrow}>Before we start</div>
      <h2 style={heading}>Financial accounting, in one sentence</h2>
      <p
        style={{
          fontSize: 'var(--osd-size-body)',
          lineHeight: 1.5,
          margin: '28px 0 0',
          maxWidth: 1500,
        }}
      >
        It records a business's transactions and turns them into standard reports for people
        outside the company.
      </p>
      <div style={{ ...eyebrow, color: ink.muted, marginTop: 48 }}>Who reads the reports</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 32,
          marginTop: 16,
        }}
      >
        <Steps>
          <Step>
            <ReaderCard who="Investors" question="“Is this a good place for my money?”" />
          </Step>
          <Step>
            <ReaderCard who="Lenders" question="“Can they pay us back?”" />
          </Step>
          <Step>
            <ReaderCard who="Regulators & tax" question="“Are they following the rules?”" />
          </Step>
          <Step>
            <ReaderCard who="Managers & staff" question="“How did we actually do?”" />
          </Step>
        </Steps>
      </div>
      <Steps>
        <Step>
          <p style={{ fontSize: 28, lineHeight: 1.5, color: ink.muted, margin: '40px 0 0' }}>
            The rulebooks: <b style={{ color: 'var(--osd-text)' }}>US GAAP</b> in the United States,{' '}
            <b style={{ color: 'var(--osd-text)' }}>IFRS</b> in most other countries.
          </p>
        </Step>
      </Steps>
    </div>
  </Paper>
);

// ── 03 Agenda ───────────────────────────────────────────────────────────────

const AgendaRow = ({ n, title, note }: { n: string; title: string; note: string }) => (
  <div
    className="fa-srise"
    style={{
      display: 'grid',
      gridTemplateColumns: '120px 1fr auto',
      alignItems: 'baseline',
      padding: '22px 0',
      borderBottom: `1.5px solid ${ink.line}`,
    }}
  >
    <span style={{ fontFamily: mono, fontSize: 30, color: 'var(--osd-accent)' }}>{n}</span>
    <span style={{ fontFamily: 'var(--osd-font-display)', fontSize: 46, lineHeight: 1.2 }}>
      {title}
    </span>
    <span style={{ fontSize: 30, fontStyle: 'italic', color: ink.muted }}>{note}</span>
  </div>
);

const Agenda: Page = () => (
  <Paper>
    <div style={body}>
      <div style={eyebrow}>Contents</div>
      <h2 style={heading}>Four chapters</h2>
      <div style={{ marginTop: 48, borderTop: '3px solid var(--osd-accent)' }}>
        <Steps>
          <Step>
            <AgendaRow n="01" title="The accounting equation" note="A = L + E" />
          </Step>
          <Step>
            <AgendaRow n="02" title="Debits & credits" note="Double-entry bookkeeping" />
          </Step>
          <Step>
            <AgendaRow n="03" title="The ground rules" note="Assumptions, principles, constraints" />
          </Step>
          <Step>
            <AgendaRow n="04" title="Statements & the cycle" note="From transaction to report" />
          </Step>
        </Steps>
      </div>
    </div>
  </Paper>
);

// ── Chapter openers ─────────────────────────────────────────────────────────

const Chapter = ({ n, title, lede }: { n: string; title: string; lede: string }) => (
  <Paper>
    <div
      style={{
        position: 'absolute',
        left: 180,
        right: 160,
        top: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div
        className="fa fa-fade"
        style={{
          fontFamily: mono,
          fontSize: 160,
          lineHeight: 1,
          color: 'var(--osd-accent)',
          opacity: 0.9,
        }}
      >
        {n}
      </div>
      <h2
        className="fa fa-rise"
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 116,
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          margin: '28px 0 36px',
          animationDelay: '0.15s',
        }}
      >
        {title}
      </h2>
      <DoubleRule width={720} delay={0.5} />
      <p
        className="fa fa-rise"
        style={{
          fontSize: 38,
          lineHeight: 1.5,
          fontStyle: 'italic',
          color: ink.muted,
          margin: '36px 0 0',
          animationDelay: '0.75s',
        }}
      >
        {lede}
      </p>
    </div>
  </Paper>
);

const ChapterEquation: Page = () => (
  <Chapter n="01" title="The accounting equation" lede="One line that every set of books obeys." />
);
ChapterEquation.transition = settle;

// ── 05 The equation ─────────────────────────────────────────────────────────

const EquationText = () => (
  <>
    <span style={{ color: 'var(--osd-accent)' }}>A</span>
    <span style={{ color: ink.muted, fontWeight: 400 }}>&nbsp;=&nbsp;</span>
    <span style={{ color: ink.red }}>L</span>
    <span style={{ color: ink.muted, fontWeight: 400 }}>&nbsp;+&nbsp;</span>
    <span>E</span>
  </>
);

// Big and small boxes share one aspect ratio (0.3×) so the morph scales evenly.
const eqBig: CSSProperties = {
  position: 'absolute',
  left: 180,
  top: 220,
  width: 1580,
  height: 260,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--osd-font-display)',
  fontSize: 220,
  fontWeight: 700,
  lineHeight: 1,
  color: 'var(--osd-text)',
};

const eqSmall: CSSProperties = {
  ...eqBig,
  left: 1286,
  top: 116,
  width: 474,
  height: 78,
  fontSize: 66,
};

const Term = ({
  letter,
  name,
  text,
  color,
}: {
  letter: string;
  name: string;
  text: string;
  color: string;
}) => (
  <div className="fa-srise" style={{ borderTop: `3px solid ${color}`, paddingTop: 20 }}>
    <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 40, fontWeight: 700 }}>
      <span style={{ color, fontFamily: mono, marginRight: 16 }}>{letter}</span>
      {name}
    </div>
    <div style={{ fontSize: 30, lineHeight: 1.5, color: ink.muted, marginTop: 12 }}>{text}</div>
  </div>
);

const Equation: Page = () => (
  <Paper>
    <div style={body}>
      <div style={eyebrow}>The foundation</div>
    </div>
    <MorphElement id="equation">
      <div style={eqBig}>
        <EquationText />
      </div>
    </MorphElement>
    <div
      style={{
        position: 'absolute',
        left: 180,
        right: 160,
        top: 560,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 60,
      }}
    >
      <Steps>
        <Step>
          <Term
            letter="A"
            name="Assets"
            color="var(--osd-accent)"
            text="What the business owns — cash, stock, equipment, money owed to it."
          />
        </Step>
        <Step>
          <Term
            letter="L"
            name="Liabilities"
            color={ink.red}
            text="What the business owes to others — loans, unpaid bills, wages due."
          />
        </Step>
        <Step>
          <Term
            letter="E"
            name="Equity"
            color="var(--osd-text)"
            text="What's left for the owners — money they put in plus profits kept."
          />
        </Step>
      </Steps>
    </div>
  </Paper>
);
Equation.transition = morphCut;

// ── 06 Worked example ───────────────────────────────────────────────────────

const txGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 280px 280px 280px',
  alignItems: 'baseline',
  columnGap: 24,
};

const Amount = ({ children, color }: { children: ReactNode; color?: string }) => (
  <span style={{ fontFamily: mono, fontSize: 32, textAlign: 'right', color }}>{children}</span>
);

const TxRow = ({
  n,
  label,
  a,
  l,
  e,
}: {
  n: string;
  label: string;
  a: number;
  l: number;
  e: number;
}) => (
  <div
    className="fa-srise"
    style={{ ...txGrid, padding: '14px 0', borderBottom: `1.5px solid ${ink.line}` }}
  >
    <span style={{ fontSize: 34, lineHeight: 1.3 }}>
      <span style={{ fontFamily: mono, fontSize: 24, color: ink.muted, marginRight: 20 }}>{n}</span>
      {label}
    </span>
    <Amount color={a < 0 ? ink.red : undefined}>
      <CountUp value={a} signed dash />
    </Amount>
    <Amount color={l < 0 ? ink.red : undefined}>
      <CountUp value={l} signed dash />
    </Amount>
    <Amount color={e < 0 ? ink.red : undefined}>
      <CountUp value={e} signed dash />
    </Amount>
  </div>
);

const Example: Page = () => (
  <Paper>
    <MorphElement id="equation">
      <div style={eqSmall}>
        <EquationText />
      </div>
    </MorphElement>
    <div style={body}>
      <div style={eyebrow}>Worked example · a small cleaning business</div>
      <h2 style={{ ...heading, fontSize: 64 }}>The equation always balances</h2>
      <div style={{ marginTop: 40 }}>
        <div
          style={{
            ...txGrid,
            fontFamily: mono,
            fontSize: 22,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: ink.muted,
            paddingBottom: 12,
            borderBottom: '3px solid var(--osd-accent)',
          }}
        >
          <span>Transaction</span>
          <span style={{ textAlign: 'right' }}>Assets</span>
          <span style={{ textAlign: 'right' }}>= Liabilities</span>
          <span style={{ textAlign: 'right' }}>+ Equity</span>
        </div>
        <Steps>
          <Step>
            <TxRow n="1" label="Owner invests cash" a={50000} l={0} e={50000} />
          </Step>
          <Step>
            <TxRow n="2" label="Buys a van on credit" a={20000} l={20000} e={0} />
          </Step>
          <Step>
            <TxRow n="3" label="Earns revenue, paid in cash" a={8000} l={0} e={8000} />
          </Step>
          <Step>
            <TxRow n="4" label="Pays rent in cash" a={-3000} l={0} e={-3000} />
          </Step>
          <Step>
            <div className="fa-srise" style={{ ...txGrid, padding: '18px 0 0' }}>
              <span
                style={{ fontFamily: 'var(--osd-font-display)', fontSize: 36, fontWeight: 700 }}
              >
                Balance
              </span>
              <TotalCell value={75000} />
              <TotalCell value={20000} />
              <TotalCell value={55000} />
            </div>
          </Step>
        </Steps>
      </div>
      <Steps>
        <Step>
          <p style={{ fontSize: 32, lineHeight: 1.5, fontStyle: 'italic', color: ink.muted, margin: '32px 0 0' }}>
            Every transaction changes at least two things — so the two sides never drift apart.
          </p>
        </Step>
      </Steps>
    </div>
  </Paper>
);
Example.transition = morphCut;

const TotalCell = ({ value }: { value: number }) => (
  <span
    style={{
      fontFamily: mono,
      fontSize: 34,
      fontWeight: 700,
      textAlign: 'right',
      justifySelf: 'end',
      paddingBottom: 6,
      borderBottom: '6px double var(--osd-accent)',
      color: 'var(--osd-accent)',
    }}
  >
    <CountUp value={value} />
  </span>
);

// ── 07 Chapter: debits & credits ────────────────────────────────────────────

const ChapterDebits: Page = () => (
  <Chapter n="02" title="Debits & credits" lede="Two sides to every story — written down twice." />
);
ChapterDebits.transition = settle;

// ── 08 T-account ────────────────────────────────────────────────────────────

const TEntry = ({ label, amount, delay }: { label: string; amount: string; delay: number }) => (
  <div className="fa fa-rise" style={{ animationDelay: `${delay}s`, marginBottom: 22 }}>
    <div style={{ fontSize: 24, fontStyle: 'italic', color: ink.muted, lineHeight: 1.3 }}>
      {label}
    </div>
    <div style={{ fontFamily: mono, fontSize: 36, lineHeight: 1.3 }}>{amount}</div>
  </div>
);

const TAccount: Page = () => (
  <Paper>
    <div style={body}>
      <div style={eyebrow}>The T-account</div>
      <h2 style={heading}>Debit means left. Credit means right.</h2>
      <div style={{ display: 'flex', gap: 100, marginTop: 56 }}>
        <div style={{ width: 680, flexShrink: 0 }}>
          <div
            style={{
              textAlign: 'center',
              fontFamily: 'var(--osd-font-display)',
              fontSize: 40,
              fontWeight: 700,
              paddingBottom: 10,
            }}
          >
            Cash
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: mono,
              fontSize: 22,
              letterSpacing: '0.12em',
              color: ink.muted,
              padding: '0 12px 8px',
            }}
          >
            <span>DEBIT (DR)</span>
            <span>CREDIT (CR)</span>
          </div>
          <div className="fa fa-draw" style={{ height: 4, background: 'var(--osd-text)' }} />
          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <div
              className="fa fa-drop"
              style={{
                position: 'absolute',
                left: 338,
                top: 0,
                width: 4,
                height: 220,
                background: 'var(--osd-text)',
                animationDelay: '0.3s',
              }}
            />
            <div style={{ padding: '24px 32px 0 12px' }}>
              <TEntry label="Owner investment" amount="50,000" delay={0.6} />
              <TEntry label="Cleaning revenue" amount="8,000" delay={0.8} />
            </div>
            <div style={{ padding: '24px 12px 0 32px', color: ink.red }}>
              <TEntry label="Rent paid" amount="3,000" delay={1.0} />
            </div>
          </div>
          <div
            className="fa fa-fade"
            style={{
              marginTop: 40,
              display: 'flex',
              alignItems: 'baseline',
              gap: 24,
              padding: '0 12px',
              animationDelay: '1.3s',
            }}
          >
            <span style={{ fontSize: 28, fontStyle: 'italic', color: ink.muted }}>Balance</span>
            <span
              style={{
                fontFamily: mono,
                fontSize: 40,
                fontWeight: 700,
                color: 'var(--osd-accent)',
                borderBottom: '6px double var(--osd-accent)',
              }}
            >
              55,000 Dr
            </span>
          </div>
        </div>
        <ul style={{ fontSize: 34, lineHeight: 1.5, margin: 0, paddingLeft: 36 }}>
          <Steps>
            <Step>
              <li style={{ marginBottom: 28 }}>
                <b>Debit (Dr)</b> — an amount on the left side.
              </li>
            </Step>
            <Step>
              <li style={{ marginBottom: 28 }}>
                <b>Credit (Cr)</b> — an amount on the right side.
              </li>
            </Step>
            <Step>
              <li style={{ marginBottom: 28 }}>
                Every transaction posts <b>equal</b> debits and credits.
              </li>
            </Step>
            <Step>
              <li style={{ color: ink.muted, fontStyle: 'italic' }}>
                The words mean left and right — not good or bad.
              </li>
            </Step>
          </Steps>
        </ul>
      </div>
    </div>
  </Paper>
);

// ── 09 Normal balances ──────────────────────────────────────────────────────

const BalanceRow = ({
  letter,
  word,
  eg,
  color,
}: {
  letter: string;
  word: string;
  eg: string;
  color: string;
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 28, padding: '10px 0' }}>
    <span
      style={{
        fontFamily: 'var(--osd-font-display)',
        fontSize: 72,
        fontWeight: 700,
        lineHeight: 1,
        width: 64,
        color,
      }}
    >
      {letter}
    </span>
    <div>
      <div style={{ fontSize: 40, lineHeight: 1.2 }}>{word}</div>
      <div style={{ fontSize: 26, lineHeight: 1.4, fontStyle: 'italic', color: ink.muted }}>{eg}</div>
    </div>
  </div>
);

const SideCard = ({ title, color, children }: { title: string; color: string; children: ReactNode }) => (
  <div className="fa-srise" style={{ height: '100%' }}>
    <Card style={{ borderTop: `6px solid ${color}` }}>
      <div style={{ ...eyebrow, color, marginBottom: 12 }}>{title}</div>
      {children}
    </Card>
  </div>
);

const NormalBalances: Page = () => (
  <Paper>
    <div style={body}>
      <div style={eyebrow}>Normal balances</div>
      <h2 style={heading}>Which side makes it go up?</h2>
      <p style={{ fontSize: 34, lineHeight: 1.5, color: ink.muted, margin: '20px 0 0' }}>
        Each account grows on one side and shrinks on the other.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 40 }}>
        <Steps>
          <Step>
            <SideCard title="Debit increases" color="var(--osd-accent)">
              <BalanceRow letter="D" word="Dividends (drawings)" eg="Payouts to owners" color="var(--osd-accent)" />
              <BalanceRow letter="E" word="Expenses" eg="Rent, wages, electricity" color="var(--osd-accent)" />
              <BalanceRow letter="A" word="Assets" eg="Cash, stock, equipment" color="var(--osd-accent)" />
            </SideCard>
          </Step>
          <Step>
            <SideCard title="Credit increases" color={ink.red}>
              <BalanceRow letter="L" word="Liabilities" eg="Loans, unpaid bills" color={ink.red} />
              <BalanceRow letter="E" word="Equity" eg="Owner's capital, retained profit" color={ink.red} />
              <BalanceRow letter="R" word="Revenue" eg="Sales, fees earned" color={ink.red} />
            </SideCard>
          </Step>
        </Steps>
      </div>
      <Steps>
        <Step>
          <p style={{ fontSize: 30, lineHeight: 1.5, margin: '32px 0 0' }}>
            Memory trick: <b style={{ fontFamily: mono, color: 'var(--osd-accent)' }}>DEA</b>
            <span style={{ fontFamily: mono, color: ink.muted }}> · </span>
            <b style={{ fontFamily: mono, color: ink.red }}>LER</b> — left side, then right side.
          </p>
        </Step>
      </Steps>
    </div>
  </Paper>
);

// ── 10 Journal entries ──────────────────────────────────────────────────────

const jGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '160px 1fr 240px 240px',
  alignItems: 'baseline',
  columnGap: 24,
};

const JournalEntry = ({
  date,
  debit,
  credit,
  amount,
  memo,
}: {
  date: string;
  debit: string;
  credit: string;
  amount: string;
  memo: string;
}) => (
  <div className="fa-srise" style={{ borderBottom: `1.5px solid ${ink.line}`, padding: '10px 0 14px' }}>
    <div style={{ ...jGrid, padding: '8px 0' }}>
      <span style={{ fontFamily: mono, fontSize: 26, color: ink.muted }}>{date}</span>
      <span style={{ fontSize: 34 }}>{debit}</span>
      <span style={{ fontFamily: mono, fontSize: 32, textAlign: 'right' }}>{amount}</span>
      <span />
    </div>
    <div style={{ ...jGrid, padding: '8px 0' }}>
      <span />
      <span style={{ fontSize: 34, paddingLeft: 64 }}>{credit}</span>
      <span />
      <span style={{ fontFamily: mono, fontSize: 32, textAlign: 'right', color: ink.red }}>
        {amount}
      </span>
    </div>
    <div style={{ ...jGrid }}>
      <span />
      <span style={{ fontSize: 26, fontStyle: 'italic', color: ink.muted }}>{memo}</span>
    </div>
  </div>
);

const Journal: Page = () => (
  <Paper>
    <div style={body}>
      <div style={eyebrow}>The journal</div>
      <h2 style={heading}>Writing it down: the journal entry</h2>
      <div style={{ marginTop: 48 }}>
        <div
          style={{
            ...jGrid,
            fontFamily: mono,
            fontSize: 22,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: ink.muted,
            paddingBottom: 12,
            borderBottom: '3px solid var(--osd-accent)',
          }}
        >
          <span>Date</span>
          <span>Account</span>
          <span style={{ textAlign: 'right' }}>Debit</span>
          <span style={{ textAlign: 'right' }}>Credit</span>
        </div>
        <Steps>
          <Step>
            <JournalEntry
              date="Mar 3"
              debit="Equipment (van)"
              credit="Accounts payable"
              amount="20,000"
              memo="Bought a delivery van on 30-day credit"
            />
          </Step>
          <Step>
            <JournalEntry
              date="Mar 9"
              debit="Cash"
              credit="Service revenue"
              amount="8,000"
              memo="Cleaning job, paid on completion"
            />
          </Step>
        </Steps>
      </div>
      <Steps>
        <Step>
          <div
            className="fa-srise"
            style={{
              marginTop: 40,
              padding: '22px 32px',
              background: ink.accentSoft,
              borderLeft: '6px solid var(--osd-accent)',
              fontSize: 32,
              lineHeight: 1.5,
            }}
          >
            Debits first, credits indented below — and the two columns must always add up to the
            same total.
          </div>
        </Step>
      </Steps>
    </div>
  </Paper>
);

// ── 11 Chapter: ground rules ────────────────────────────────────────────────

const ChapterRules: Page = () => (
  <Chapter n="03" title="The ground rules" lede="Why two accountants get the same answer." />
);
ChapterRules.transition = settle;

// ── 12–14 Assumptions, principles, constraints ─────────────────────────────

const RuleCard = ({ tag, title, text }: { tag: string; title: string; text: string }) => (
  <div className="fa-srise" style={{ height: '100%' }}>
    <Card>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
        <span style={{ fontFamily: mono, fontSize: 24, color: 'var(--osd-accent)' }}>{tag}</span>
        <span
          style={{
            fontFamily: 'var(--osd-font-display)',
            fontSize: 40,
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ fontSize: 32, lineHeight: 1.5, color: ink.muted, marginTop: 16 }}>{text}</div>
    </Card>
  </div>
);

const ruleGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 32,
  marginTop: 56,
};

const Assumptions: Page = () => (
  <Paper>
    <div style={body}>
      <div style={eyebrow}>Ground rules · 1 of 3</div>
      <h2 style={heading}>Four assumptions under every report</h2>
      <div style={ruleGrid}>
        <Steps>
          <Step>
            <RuleCard
              tag="A1"
              title="Economic entity"
              text="The business's books are kept separate from the owner's own money."
            />
          </Step>
          <Step>
            <RuleCard
              tag="A2"
              title="Going concern"
              text="We assume the business will keep running for the foreseeable future."
            />
          </Step>
          <Step>
            <RuleCard
              tag="A3"
              title="Monetary unit"
              text="Everything is measured in one stable currency, like dollars."
            />
          </Step>
          <Step>
            <RuleCard
              tag="A4"
              title="Time period"
              text="A business's life is cut into periods — months, quarters, years."
            />
          </Step>
        </Steps>
      </div>
    </div>
  </Paper>
);

const Principles: Page = () => (
  <Paper>
    <div style={body}>
      <div style={eyebrow}>Ground rules · 2 of 3</div>
      <h2 style={heading}>Four principles for recording</h2>
      <div style={ruleGrid}>
        <Steps>
          <Step>
            <RuleCard
              tag="P1"
              title="Historical cost"
              text="Record assets at what you actually paid, not a guess at today's value."
            />
          </Step>
          <Step>
            <RuleCard
              tag="P2"
              title="Revenue recognition"
              text="Count revenue when it's earned — when you deliver — not when cash arrives."
            />
          </Step>
          <Step>
            <RuleCard
              tag="P3"
              title="Expense recognition"
              text="Also called matching: record costs in the period of the revenue they helped earn."
            />
          </Step>
          <Step>
            <RuleCard
              tag="P4"
              title="Full disclosure"
              text="Tell readers anything that would change their view, in the notes if needed."
            />
          </Step>
        </Steps>
      </div>
    </div>
  </Paper>
);

const Constraints: Page = () => (
  <Paper>
    <div style={body}>
      <div style={eyebrow}>Ground rules · 3 of 3</div>
      <h2 style={heading}>Constraints: the judgement calls</h2>
      <div style={ruleGrid}>
        <Steps>
          <Step>
            <RuleCard
              tag="C1"
              title="Materiality"
              text="Amounts too small to change a decision can be handled simply."
            />
          </Step>
          <Step>
            <RuleCard
              tag="C2"
              title="Consistency"
              text="Use the same methods every year so periods can be compared."
            />
          </Step>
          <Step>
            <RuleCard
              tag="C3"
              title="Prudence"
              text="Also called conservatism: when unsure, don't overstate assets or profit."
            />
          </Step>
          <Step>
            <RuleCard
              tag="C4"
              title="Cost vs. benefit"
              text="Information should be worth more than it costs to produce."
            />
          </Step>
        </Steps>
      </div>
    </div>
  </Paper>
);

// ── 15 Accrual vs. cash ─────────────────────────────────────────────────────

const MonthCell = ({ month, amount }: { month: string; amount: number }) => (
  <div
    style={{
      flex: 1,
      padding: '20px 24px',
      border: `1.5px solid ${ink.line}`,
      borderRadius: 'var(--osd-radius)',
      background: amount > 0 ? ink.accentSoft : 'transparent',
    }}
  >
    <div style={{ fontFamily: mono, fontSize: 22, letterSpacing: '0.12em', color: ink.muted }}>
      {month}
    </div>
    <div
      style={{
        fontFamily: mono,
        fontSize: 60,
        lineHeight: 1.15,
        marginTop: 6,
        color: amount > 0 ? 'var(--osd-accent)' : ink.muted,
      }}
    >
      <CountUp value={amount} prefix="$" />
    </div>
  </div>
);

const BasisCard = ({
  name,
  rule,
  dec,
  jan,
}: {
  name: string;
  rule: string;
  dec: number;
  jan: number;
}) => (
  <div className="fa-srise" style={{ height: '100%' }}>
    <Card>
      <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 44, fontWeight: 700, lineHeight: 1.2 }}>
        {name}
      </div>
      <div style={{ fontSize: 30, fontStyle: 'italic', color: ink.muted, lineHeight: 1.5, marginTop: 8 }}>
        {rule}
      </div>
      <div style={{ display: 'flex', gap: 24, marginTop: 28 }}>
        <MonthCell month="DECEMBER" amount={dec} />
        <MonthCell month="JANUARY" amount={jan} />
      </div>
    </Card>
  </div>
);

const AccrualVsCash: Page = () => (
  <Paper>
    <div style={body}>
      <div style={eyebrow}>Timing</div>
      <h2 style={heading}>Accrual vs. cash: when does it count?</h2>
      <p style={{ fontSize: 'var(--osd-size-body)', lineHeight: 1.5, margin: '24px 0 0' }}>
        You finish a <b>$5,000</b> job on 20 December. The client pays on 15 January.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 48 }}>
        <Steps>
          <Step>
            <BasisCard name="Cash basis" rule="Counts it when the money moves." dec={0} jan={5000} />
          </Step>
          <Step>
            <BasisCard name="Accrual basis" rule="Counts it when the work is done." dec={5000} jan={0} />
          </Step>
        </Steps>
      </div>
      <Steps>
        <Step>
          <p style={{ fontSize: 28, lineHeight: 1.5, color: ink.muted, margin: '36px 0 0' }}>
            Financial statements under US GAAP and IFRS use the <b style={{ color: 'var(--osd-text)' }}>accrual basis</b>.
          </p>
        </Step>
      </Steps>
    </div>
  </Paper>
);

// ── 16 Chapter: statements & cycle ──────────────────────────────────────────

const ChapterStatements: Page = () => (
  <Chapter n="04" title="Statements & the cycle" lede="From a single receipt to the annual report." />
);
ChapterStatements.transition = settle;

// ── 17 The four statements ──────────────────────────────────────────────────

const StatementCard = ({
  title,
  question,
  formula,
}: {
  title: string;
  question: string;
  formula: string;
}) => (
  <div className="fa-srise" style={{ height: '100%' }}>
    <Card>
      <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 40, fontWeight: 700, lineHeight: 1.2 }}>
        {title}
      </div>
      <div style={{ fontSize: 32, fontStyle: 'italic', lineHeight: 1.5, color: ink.muted, marginTop: 10 }}>
        {question}
      </div>
      <div
        style={{
          fontFamily: mono,
          fontSize: 24,
          color: 'var(--osd-accent)',
          marginTop: 18,
          paddingTop: 14,
          borderTop: `1.5px dashed ${ink.line}`,
        }}
      >
        {formula}
      </div>
    </Card>
  </div>
);

const Statements: Page = () => (
  <Paper>
    <div style={body}>
      <div style={eyebrow}>The output</div>
      <h2 style={heading}>Four financial statements</h2>
      <div style={ruleGrid}>
        <Steps>
          <Step>
            <StatementCard
              title="Income statement"
              question="Did we make a profit this period?"
              formula="Revenue − Expenses = Net income"
            />
          </Step>
          <Step>
            <StatementCard
              title="Balance sheet"
              question="What do we own and owe on one day?"
              formula="Assets = Liabilities + Equity"
            />
          </Step>
          <Step>
            <StatementCard
              title="Statement of changes in equity"
              question="How did the owners' stake change?"
              formula="Opening + Net income − Dividends = Closing"
            />
          </Step>
          <Step>
            <StatementCard
              title="Cash flow statement"
              question="Where did the cash come from and go?"
              formula="Operating · Investing · Financing"
            />
          </Step>
        </Steps>
      </div>
    </div>
  </Paper>
);

// ── 18 How they connect ─────────────────────────────────────────────────────

const FlowBox = ({
  x,
  y,
  title,
  sub,
  strong = false,
}: {
  x: number;
  y: number;
  title: string;
  sub: string;
  strong?: boolean;
}) => (
  <div
    className="fa-srise"
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: 380,
      height: 170,
      boxSizing: 'border-box',
      padding: '28px 32px',
      background: strong ? ink.accentSoft : ink.card,
      border: strong ? '3px solid var(--osd-accent)' : `1.5px solid ${ink.line}`,
      borderRadius: 'var(--osd-radius)',
    }}
  >
    <div style={{ fontFamily: 'var(--osd-font-display)', fontSize: 34, fontWeight: 700, lineHeight: 1.2 }}>
      {title}
    </div>
    <div style={{ fontSize: 26, fontStyle: 'italic', color: ink.muted, marginTop: 10 }}>{sub}</div>
  </div>
);

const ArrowRight = ({ x, y, width, label }: { x: number; y: number; width: number; label: string }) => (
  <>
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y - 48,
        width,
        textAlign: 'center',
        fontSize: 26,
        fontStyle: 'italic',
        color: 'var(--osd-accent)',
      }}
    >
      {label}
    </div>
    <div
      className="fa-sdraw"
      style={{ position: 'absolute', left: x, top: y, width, height: 3, background: 'var(--osd-accent)' }}
    >
      <div
        style={{
          position: 'absolute',
          right: -4,
          top: -8,
          width: 0,
          height: 0,
          borderLeft: '16px solid var(--osd-accent)',
          borderTop: '9.5px solid transparent',
          borderBottom: '9.5px solid transparent',
        }}
      />
    </div>
  </>
);

const ArrowUp = ({ x, y, height, label }: { x: number; y: number; height: number; label: string }) => (
  <>
    <div
      style={{
        position: 'absolute',
        left: x - 230,
        top: y + height / 2 - 18,
        width: 200,
        textAlign: 'right',
        fontSize: 26,
        fontStyle: 'italic',
        color: 'var(--osd-accent)',
      }}
    >
      {label}
    </div>
    <div
      className="fa-sdrop"
      style={{ position: 'absolute', left: x, top: y, width: 3, height, background: 'var(--osd-accent)' }}
    >
      <div
        style={{
          position: 'absolute',
          left: -8,
          top: -12,
          width: 0,
          height: 0,
          borderBottom: '16px solid var(--osd-accent)',
          borderLeft: '9.5px solid transparent',
          borderRight: '9.5px solid transparent',
        }}
      />
    </div>
  </>
);

const Connect: Page = () => (
  <Paper>
    <div style={body}>
      <div style={eyebrow}>One story, four views</div>
      <h2 style={heading}>How the statements connect</h2>
      <div style={{ position: 'relative', height: 560, marginTop: 40 }}>
        <Steps>
          <Step>
            <FlowBox x={0} y={60} title="Income statement" sub="Revenue − expenses" />
          </Step>
          <Step>
            <ArrowRight x={400} y={145} width={180} label="Net income" />
            <FlowBox x={600} y={60} title="Changes in equity" sub="Profit kept or paid out" />
          </Step>
          <Step>
            <ArrowRight x={1000} y={145} width={180} label="Closing equity" />
            <FlowBox x={1200} y={60} title="Balance sheet" sub="A = L + E" strong />
          </Step>
          <Step>
            <ArrowUp x={1389} y={248} height={100} label="Ending cash" />
            <FlowBox x={1200} y={360} title="Cash flow statement" sub="Cash in and out" />
          </Step>
          <Step>
            <p
              className="fa-srise"
              style={{
                position: 'absolute',
                left: 0,
                top: 380,
                width: 900,
                margin: 0,
                fontSize: 32,
                lineHeight: 1.5,
              }}
            >
              Net income links the first three. Cash links the last one to the balance sheet.
            </p>
          </Step>
        </Steps>
      </div>
    </div>
  </Paper>
);

// ── 19 The accounting cycle ─────────────────────────────────────────────────

const CycleStep = ({ n, title }: { n: string; title: string }) => (
  <div className="fa-srise" style={{ height: '100%' }}>
    <Card style={{ padding: '24px 30px' }}>
      <div style={{ fontFamily: mono, fontSize: 26, color: 'var(--osd-accent)' }}>{n}</div>
      <div
        style={{
          fontFamily: 'var(--osd-font-display)',
          fontSize: 34,
          fontWeight: 700,
          lineHeight: 1.25,
          marginTop: 10,
        }}
      >
        {title}
      </div>
    </Card>
  </div>
);

const Cycle: Page = () => (
  <Paper>
    <div style={body}>
      <div style={eyebrow}>Every period, on repeat</div>
      <h2 style={heading}>The accounting cycle</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridAutoRows: 180,
          gap: 28,
          marginTop: 56,
        }}
      >
        <Steps>
          <Step>
            <CycleStep n="01" title="Identify transactions" />
          </Step>
          <Step>
            <CycleStep n="02" title="Journalize" />
          </Step>
          <Step>
            <CycleStep n="03" title="Post to the ledger" />
          </Step>
          <Step>
            <CycleStep n="04" title="Trial balance" />
          </Step>
          <Step>
            <CycleStep n="05" title="Adjusting entries" />
          </Step>
          <Step>
            <CycleStep n="06" title="Adjusted trial balance" />
          </Step>
          <Step>
            <CycleStep n="07" title="Prepare statements" />
          </Step>
          <Step>
            <CycleStep n="08" title="Close the books" />
          </Step>
        </Steps>
      </div>
      <Steps>
        <Step>
          <p style={{ fontSize: 32, lineHeight: 1.5, fontStyle: 'italic', color: ink.muted, margin: '40px 0 0' }}>
            <span style={{ fontFamily: mono, fontStyle: 'normal', color: 'var(--osd-accent)' }}>08 → 01</span>
            &nbsp;&nbsp;Temporary accounts reset to zero, and the next period begins.
          </p>
        </Step>
      </Steps>
    </div>
  </Paper>
);

// ── 20 Recap ────────────────────────────────────────────────────────────────

const RecapRow = ({ n, children }: { n: string; children: ReactNode }) => (
  <div
    className="fa-srise"
    style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: 40,
      padding: '16px 0',
      borderBottom: `1.5px solid ${ink.line}`,
    }}
  >
    <span style={{ fontFamily: mono, fontSize: 28, color: 'var(--osd-accent)', width: 50 }}>{n}</span>
    <span style={{ fontSize: 38, lineHeight: 1.3 }}>{children}</span>
  </div>
);

const Recap: Page = () => (
  <Paper>
    <div style={body}>
      <div style={eyebrow}>Closing the books</div>
      <h2 style={heading}>Five things to remember</h2>
      <div style={{ marginTop: 40, borderTop: '3px solid var(--osd-accent)' }}>
        <Steps>
          <Step>
            <RecapRow n="1">
              <b>Assets = Liabilities + Equity</b> — always.
            </RecapRow>
          </Step>
          <Step>
            <RecapRow n="2">Every entry has equal debits and credits.</RecapRow>
          </Step>
          <Step>
            <RecapRow n="3">Revenue counts when earned; expenses follow the revenue.</RecapRow>
          </Step>
          <Step>
            <RecapRow n="4">Shared assumptions and principles make reports comparable.</RecapRow>
          </Step>
          <Step>
            <RecapRow n="5">Four statements tell one connected story.</RecapRow>
          </Step>
        </Steps>
      </div>
      <Steps>
        <Step>
          <div style={{ display: 'flex', alignItems: 'center', gap: 40, marginTop: 48 }}>
            <DoubleRule width={200} className="fa-sdraw" />
            <span
              style={{
                fontFamily: 'var(--osd-font-display)',
                fontSize: 48,
                fontWeight: 700,
                color: 'var(--osd-accent)',
              }}
            >
              Thank you — questions?
            </span>
          </div>
        </Step>
      </Steps>
    </div>
  </Paper>
);

// ── Deck ────────────────────────────────────────────────────────────────────

export const meta: SlideMeta = {
  title: 'Principles of Financial Accounting',
  createdAt: '2026-10-09T00:22:29.872Z',
};

export const notes: (string | undefined)[] = [
  `Welcome. Today is a tour of how businesses keep their books.
No maths beyond adding and subtracting — promise.`,
  `Start with the "why". Financial accounting is for outsiders: people who can't walk into the office and ask.
Click through the four readers and the question each one brings.
Close on the rulebooks: GAAP in the US, IFRS almost everywhere else.`,
  'Four chapters. The first two are mechanics, the third is the rules, the fourth is the output.',
  'Chapter one. If you remember a single line from today, it is this one.',
  `Assets equal liabilities plus equity.
Reveal each term. Stress that equity is a leftover: whatever the owners would keep if every debt were paid.`,
  `Watch the equation move up to the corner — it stays with us for the whole example.
Go row by row. After each one, ask the room: are both sides still equal?
Rent is the interesting one: cash goes down AND equity goes down, because expenses reduce profit.
End on the totals: 75,000 on the left, 20,000 plus 55,000 on the right.`,
  'Chapter two: how we write all this down without losing track.',
  `The T-account is just a picture of one account: left side, right side.
This is our cash from the example — in 50,000 and 8,000, out 3,000, leaving 55,000.
Last bullet matters most: debit is not good, credit is not bad. They are directions.`,
  `Which side increases an account depends on its type.
Left card first, then right. Then the memory trick: DEA-LER.
The opposite side always decreases the account.`,
  `A journal entry is the diary line before anything hits the ledger.
Two entries from our example: the van bought on credit, and the cleaning job paid in cash.
Point out the layout habit: debits first, credits indented.`,
  'Chapter three: the shared rules that make one company comparable with another.',
  `Assumptions are the background beliefs.
Economic entity is the one owners break most often — mixing personal spending with the business.`,
  `Principles are the recording rules.
Revenue and expense recognition together are the heart of accrual accounting — next slides show why.`,
  `Constraints are where judgement comes in.
Prudence: when in doubt, lean towards the less rosy number.`,
  `Same job, two answers. Reveal cash basis, then accrual.
Ask: which one shows December's real performance? Accrual — the work was done in December.`,
  'Final chapter: the reports themselves, and the routine that produces them.',
  `Four statements, four questions. Read the question on each card, not the formula.
Note the balance sheet formula — our old friend from chapter one.`,
  `This is the bit people miss: the statements are linked.
Click through: profit flows into equity, equity lands on the balance sheet, and the cash flow statement explains the cash line.`,
  `The cycle repeats every period. Click through all eight quickly.
Spend a moment on adjusting entries — that's where accrual accounting actually happens.`,
  `Recap the five points, then open for questions.`,
];

export default [
  Cover,
  Purpose,
  Agenda,
  ChapterEquation,
  Equation,
  Example,
  ChapterDebits,
  TAccount,
  NormalBalances,
  Journal,
  ChapterRules,
  Assumptions,
  Principles,
  Constraints,
  AccrualVsCash,
  ChapterStatements,
  Statements,
  Connect,
  Cycle,
  Recap,
] satisfies Page[];
