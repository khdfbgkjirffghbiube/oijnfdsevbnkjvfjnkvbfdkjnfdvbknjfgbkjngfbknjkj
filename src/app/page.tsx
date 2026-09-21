import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleDollarSign,
  Gamepad2,
  Layers3,
  Radio,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

const streamers = [
  { name: "FOXxy", login: "foxxy_live", game: "Dota 2", viewers: "12,4K", letter: "F", accent: "coral", price: "от 300 ₽" },
  { name: "VLAD FORCE", login: "vlad_force", game: "Counter-Strike 2", viewers: "8,4K", letter: "V", accent: "purple", price: "от 250 ₽" },
  { name: "MASHU", login: "mashu_chat", game: "Just Chatting", viewers: "2,7K", letter: "M", accent: "cyan", price: "от 500 ₽" },
];

export default function Home() {
  return (
    <div className="site-shell">
      <header className="topbar landing-topbar">
        <a className="brand" href="#top" aria-label="TaskDrop">
          <span className="brand-mark"><Zap size={18} fill="currentColor" /></span>
          <span>TASKDROP</span>
        </a>
        <nav className="desktop-nav" aria-label="Основная навигация">
          <a href="#streamers">Стримеры</a>
          <a href="#how">Как это работает</a>
          <a href="#safety">Безопасность</a>
        </nav>
        <div className="header-actions">
          <a className="text-link hide-mobile" href="/app">Личный кабинет</a>
          <a className="button button-compact button-light" href="/api/auth/twitch">
            <Radio size={17} /> Войти
          </a>
        </div>
      </header>

      <main id="top">
        <section className="hero section-wrap">
          <div className="hero-copy">
            <div className="eyebrow"><span className="pulse-dot" /> Задания в прямом эфире</div>
            <h1>Твои идеи.<br /><span>Их стрим.</span></h1>
            <p className="hero-lead">
              Отправь стримеру задание и наблюдай, как оно оживает в эфире.
              Деньги защищены до момента выполнения.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="/app">Отправить задание <ArrowRight size={19} /></a>
              <a className="button button-ghost" href="#how">Как это работает</a>
            </div>
            <div className="hero-proof">
              <div className="mini-avatars" aria-hidden="true"><span>F</span><span>V</span><span>M</span><span>+9</span></div>
              <div><strong>12 000+</strong><small>заданий уже в эфире</small></div>
            </div>
          </div>

          <div className="hero-stage" aria-label="Пример задания">
            <div className="stage-glow" />
            <div className="floating-chip chip-one"><Radio size={15} /> LIVE · 12,4K</div>
            <div className="floating-chip chip-two"><Sparkles size={15} /> +900 ₽</div>
            <div className="stream-window">
              <div className="stream-window-bar">
                <div className="window-dots"><i /><i /><i /></div>
                <span>foxxy_live</span>
                <div className="live-pill"><span /> В ЭФИРЕ</div>
              </div>
              <div className="stream-scene">
                <div className="scene-noise" />
                <div className="scene-character">F</div>
                <div className="chat-rail"><span>огооо 🔥</span><span>давай!</span><span>это жёстко</span></div>
                <div className="obs-alert">
                  <div className="obs-icon"><Gamepad2 size={22} /></div>
                  <div><small>НОВОЕ ЗАДАНИЕ · 900 ₽</small><strong>Только саппортом</strong><p>Без покупки урона — только сейвы и варды</p></div>
                </div>
              </div>
              <div className="task-progress">
                <div className="progress-icon"><Check size={18} /></div>
                <div><small>ЗАДАНИЕ ПРИНЯТО</small><strong>Награда зарезервирована</strong></div>
                <span>900 ₽</span>
              </div>
            </div>
          </div>
        </section>

        <section className="trust-strip" id="safety">
          <div><ShieldCheck size={21} /><span><strong>Защита баланса</strong> Возврат при отказе</span></div>
          <div><Zap size={21} /><span><strong>Мгновенно</strong> Задание сразу в OBS</span></div>
          <div><CircleDollarSign size={21} /><span><strong>Честная выплата</strong> После выполнения</span></div>
        </section>

        <section className="section-wrap content-section" id="streamers">
          <div className="section-heading">
            <div><span className="section-kicker">СЕЙЧАС В ЭФИРЕ</span><h2>Выбери стримера</h2></div>
            <a href="/app">Смотреть всех <ChevronRight size={18} /></a>
          </div>
          <div className="streamer-grid">
            {streamers.map((streamer) => (
              <article className="streamer-card" key={streamer.login}>
                <div className={`streamer-cover cover-${streamer.accent}`}>
                  <span className="cover-letter">{streamer.letter}</span>
                  <div className="live-badge"><span /> LIVE</div>
                  <div className="viewer-count"><Radio size={13} /> {streamer.viewers}</div>
                </div>
                <div className="streamer-info">
                  <div><h3>{streamer.name}</h3><p>{streamer.game}</p></div>
                  <div className="price-tag">{streamer.price}</div>
                </div>
                <a className="card-action" href="/app">Предложить задание <ArrowRight size={17} /></a>
              </article>
            ))}
          </div>
        </section>

        <section className="how-section" id="how">
          <div className="section-wrap">
            <div className="center-heading">
              <span className="section-kicker">ТРИ ПРОСТЫХ ШАГА</span>
              <h2>От идеи до эфира</h2>
              <p>Ты предлагаешь. Стример решает. Сервис следит за расчётами.</p>
            </div>
            <div className="steps-grid">
              <article><span className="step-number">01</span><div className="step-icon"><Gamepad2 /></div><h3>Придумай задание</h3><p>Опиши идею, выбери стримера и назначь награду.</p></article>
              <article><span className="step-number">02</span><div className="step-icon"><Layers3 /></div><h3>Дождись решения</h3><p>Сумма резервируется. При отказе всё вернётся на баланс.</p></article>
              <article><span className="step-number">03</span><div className="step-icon"><Sparkles /></div><h3>Смотри выполнение</h3><p>Задание появляется в OBS, а награда уходит стримеру после выполнения.</p></article>
            </div>
          </div>
        </section>

        <section className="section-wrap final-cta">
          <div className="cta-orb" />
          <div><span className="section-kicker">ГОТОВ ПОПРОБОВАТЬ?</span><h2>Сделай следующий стрим<br />незабываемым.</h2></div>
          <a className="button button-dark" href="/app">Начать бесплатно <ArrowRight size={19} /></a>
        </section>
      </main>

      <footer className="footer section-wrap">
        <a className="brand" href="#top"><span className="brand-mark"><Zap size={18} fill="currentColor" /></span><span>TASKDROP</span></a>
        <p>Платформа заданий для прямых эфиров.</p>
        <span>© 2026 TaskDrop</span>
      </footer>
    </div>
  );
}
