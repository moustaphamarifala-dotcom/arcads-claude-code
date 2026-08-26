const React = require('react');
const {
	AbsoluteFill,
	Audio,
	Img,
	OffthreadVideo,
	Sequence,
	useCurrentFrame,
	useVideoConfig,
	interpolate,
	staticFile,
	Easing,
} = require('remotion');

const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);

// ───────────────────────── Handheld camera shake ─────────────────────────
// Smooth pseudo-random drift (layered sine waves, not white noise) that reads
// as "held in the hand" rather than a glitch. `amount` in pixels at 1080-wide.
const useHandheldShake = (fps, amount = 0) => {
	const frame = useCurrentFrame();
	if (!amount) return {x: 0, y: 0, rotate: 0};
	const t = frame / fps;
	const x = amount * (Math.sin(t * 1.3) * 0.6 + Math.sin(t * 2.7 + 1.1) * 0.4);
	const y = amount * (Math.cos(t * 1.7 + 0.6) * 0.6 + Math.sin(t * 3.1) * 0.4);
	const rotate = (amount / 90) * Math.sin(t * 1.1 + 0.3);
	return {x, y, rotate};
};

// ───────────────────────── Ken Burns photo pan ─────────────────────────
const KenBurnsShot = ({photo, from, to, durationInFrames, fps, shake = 0}) => {
	const frame = useCurrentFrame();
	const k = easeInOut(Math.min(1, Math.max(0, frame / durationInFrames)));
	const lerp = (a, b) => a + (b - a) * k;
	const scale = lerp(from.zoom, to.zoom);
	const cx = lerp(from.x, to.x); // 0..1, focal point horizontal
	const cy = lerp(from.y, to.y); // 0..1, focal point vertical

	// Box scaled by `scale`, positioned so the focal point (cx,cy) stays centered.
	// Clamped so the box always fully covers the container (no gaps at low zoom).
	const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
	const boxPct = scale * 100;
	const leftPct = clamp(50 - cx * boxPct, 100 - boxPct, 0);
	const topPct = clamp(50 - cy * boxPct, 100 - boxPct, 0);
	const {x, y, rotate} = useHandheldShake(fps, shake);

	return (
		<AbsoluteFill style={{overflow: 'hidden', backgroundColor: '#000'}}>
			<div
				style={{
					position: 'absolute',
					inset: shake ? -60 : 0,
					transform: shake ? `translate(${x}px, ${y}px) rotate(${rotate}deg)` : undefined,
				}}
			>
				<Img
					src={photo.startsWith('http') ? photo : staticFile(photo)}
					style={{
						position: 'absolute',
						width: `${boxPct}%`,
						height: `${boxPct}%`,
						left: `${leftPct}%`,
						top: `${topPct}%`,
						objectFit: 'cover',
					}}
				/>
			</div>
		</AbsoluteFill>
	);
};

// ───────────────────────── Real footage shot (with slow drift zoom) ─────────────────────────
const VideoShot = ({fps, src, videoStartFrom = 0, durationInFrames, zoomTo = 1.08, volume = 0}) => {
	const frame = useCurrentFrame();
	const k = easeInOut(Math.min(1, Math.max(0, frame / durationInFrames)));
	const scale = 1 + (zoomTo - 1) * k;
	return (
		<AbsoluteFill style={{overflow: 'hidden', backgroundColor: '#000'}}>
			<OffthreadVideo
				src={src.startsWith('http') ? src : staticFile(src)}
				startFrom={Math.round(videoStartFrom * fps)}
				muted={volume === 0}
				volume={volume}
				style={{
					position: 'absolute',
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					transform: `scale(${scale})`,
					transformOrigin: 'center center',
				}}
			/>
		</AbsoluteFill>
	);
};

// ───────────────────────── Brand banner (top or center) ─────────────────────────
const BrandBanner = ({brand, accent, position = 'top'}) => {
	const frame = useCurrentFrame();
	const in_ = interpolate(frame, [0, 18], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
	const y = interpolate(frame, [0, 18], [-14, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
	const placement = position === 'center' ? {top: '50%', transform: `translate(-50%, -50%) translateY(${y}px)`} : {top: 60, transform: `translateX(-50%) translateY(${y}px)`};
	return (
		<div
			style={{
				position: 'absolute',
				left: '50%',
				...placement,
				opacity: in_,
				background: 'rgba(8,8,16,0.72)',
				borderRadius: 999,
				padding: '14px 34px',
				fontFamily: 'Georgia, serif',
				fontWeight: 800,
				fontSize: 40,
				color: accent,
				letterSpacing: 1,
				whiteSpace: 'nowrap',
			}}
		>
			{brand}
		</div>
	);
};

// ───────────────────────── Cinematic vignette / grade ─────────────────────────
// Subtle edge darkening so the eye settles on the center where captions live.
// Sits above the footage, below all text overlays — kept faint on purpose.
const Vignette = () => (
	<div
		style={{
			position: 'absolute',
			inset: 0,
			pointerEvents: 'none',
			background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 52%, rgba(0,0,0,0.38) 100%)',
		}}
	/>
);

// ───────────────────────── Title overlay (product style) ─────────────────────────
const TitleOverlay = ({title, subtitle, accent, durationInFrames}) => {
	const frame = useCurrentFrame();
	const fadeIn = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp'});
	const fadeOut = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
		extrapolateLeft: 'clamp',
	});
	const opacity = Math.min(fadeIn, fadeOut);
	return (
		<div
			style={{
				position: 'absolute',
				bottom: 300,
				left: 50,
				right: 50,
				opacity,
				background: 'rgba(8,8,16,0.68)',
				borderRadius: 28,
				padding: '30px 36px',
				textAlign: 'center',
			}}
		>
			<div style={{fontFamily: 'Georgia, serif', fontWeight: 800, fontSize: 66, color: accent, textShadow: '0 3px 6px rgba(0,0,0,.5)'}}>
				{title}
			</div>
			{subtitle ? (
				<div style={{fontFamily: 'sans-serif', fontSize: 34, color: '#fff', marginTop: 14}}>{subtitle}</div>
			) : null}
		</div>
	);
};

// ───────────────────────── Keyword emphasis (prices, phone, brand words) ─────────────────────────
// Splits `text` on the given substrings (case-insensitive) and marks the
// matched pieces so callers can render them in accent color.
const splitHighlights = (text, highlight = []) => {
	if (!highlight.length) return [{text, hit: false}];
	const pattern = highlight
		.filter(Boolean)
		.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
		.join('|');
	if (!pattern) return [{text, hit: false}];
	const re = new RegExp(`(${pattern})`, 'gi');
	return text.split(re).filter((s) => s !== '').map((s) => ({text: s, hit: re.test(s) && new RegExp(`^(${pattern})$`, 'i').test(s)}));
};

// ───────────────────────── Caption bar (dialogue / testimonial style) ─────────────────────────
const CaptionBar = ({text, speaker, accent, highlight}) => (
	<div
		style={{
			position: 'absolute',
			bottom: 220,
			left: 48,
			right: 48,
			background: 'rgba(10,10,25,0.82)',
			borderRadius: 30,
			padding: '26px 34px',
		}}
	>
		{speaker ? (
			<div style={{fontFamily: 'sans-serif', fontWeight: 800, fontSize: 32, color: accent, marginBottom: 8}}>
				{speaker}
			</div>
		) : null}
		<div style={{fontFamily: 'sans-serif', fontWeight: 700, fontSize: 40, color: '#fff', lineHeight: 1.3}}>
			{splitHighlights(text, highlight).map((p, i) => (
				<span key={i} style={{color: p.hit ? accent : '#fff'}}>
					{p.text}
				</span>
			))}
		</div>
	</div>
);

// ───────────────────────── Raw / native caption (no box, script font) ─────────────────────────
// Mimics the plain CapCut-style price/name label seen on native vendor videos
// — no background panel, no brand chrome, just text with a soft shadow so it
// reads on any footage. Use via a caption's `raw: true`.
const RawCaption = ({text}) => (
	<div
		style={{
			position: 'absolute',
			bottom: 420,
			left: 60,
			right: 60,
			fontFamily: 'Georgia, serif',
			fontStyle: 'italic',
			fontWeight: 600,
			fontSize: 46,
			color: '#fff',
			lineHeight: 1.25,
			whiteSpace: 'pre-line',
			textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 0 3px rgba(0,0,0,0.5)',
		}}
	>
		{text}
	</div>
);

// ───────────────────────── Animated badge (pill callout) ─────────────────────────
// A small always-on-top pill — "Stock limité", "Prêt à porter" — that slides
// in from the edge and settles. Attach via a shot's `badge: {text, side?}`.
const Badge = ({text, accent, dark, side = 'right'}) => {
	const frame = useCurrentFrame();
	const in_ = interpolate(frame, [0, 14], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.6))});
	const offset = interpolate(frame, [0, 14], [side === 'right' ? 60 : -60, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.6))});
	return (
		<div
			style={{
				position: 'absolute',
				top: 200,
				[side]: 40,
				transform: `translateX(${offset}px) scale(${0.85 + in_ * 0.15})`,
				opacity: in_,
				background: accent,
				color: dark,
				fontFamily: 'sans-serif',
				fontWeight: 800,
				fontSize: 30,
				padding: '14px 26px',
				borderRadius: 999,
				boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
				whiteSpace: 'nowrap',
			}}
		>
			{text}
		</div>
	);
};

// ───────────────────────── Karaoke caption bar (word-by-word highlight) ─────────────────────────
const KaraokeCaptionBar = ({words, accent, fps, groupStart, highlight = []}) => {
	const frame = useCurrentFrame();
	const t = groupStart + frame / fps;
	return (
		<div
			style={{
				position: 'absolute',
				bottom: 260,
				left: 60,
				right: 60,
				background: 'rgba(10,10,25,0.82)',
				borderRadius: 28,
				padding: '24px 30px',
				display: 'flex',
				flexWrap: 'wrap',
				gap: '0 14px',
				justifyContent: 'center',
			}}
		>
			{words.map((w, i) => {
				const active = t >= w.start && t < w.end;
				const spoken = t >= w.end;
				const isKeyword = highlight.some((h) => h && w.text.toLowerCase().includes(h.toLowerCase()));
				const color = active || isKeyword ? accent : spoken ? '#fff' : 'rgba(255,255,255,0.45)';
				return (
					<span
						key={i}
						style={{
							fontFamily: 'sans-serif',
							fontWeight: 800,
							fontSize: 42,
							color,
							transform: active ? 'scale(1.08)' : 'scale(1)',
							display: 'inline-block',
							transition: 'none',
						}}
					>
						{w.text}
					</span>
				);
			})}
		</div>
	);
};

// ───────────────────────── Shot crossfade wrapper ─────────────────────────
// The shot's Sequence starts `ovIn` frames before its nominal cut point so it
// can fade in on top of the previous (still-visible) shot. `ovIn` is 0 for
// the first shot, so this is a no-op there.
const ShotFade = ({ovIn, children}) => {
	const frame = useCurrentFrame();
	const opacity = ovIn > 0 ? interpolate(frame, [0, ovIn], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
	return <AbsoluteFill style={{opacity}}>{children}</AbsoluteFill>;
};

// ───────────────────────── Auto word timing for karaoke captions ─────────────────────────
// Splits `text` into words and distributes [start,end] proportionally to word
// length, so every caption gets a karaoke highlight even without hand-authored
// per-word timestamps.
const autoWordTimings = (text, start, end) => {
	const raw = text.split(/\s+/).filter(Boolean);
	if (!raw.length) return [];
	const weights = raw.map((w) => w.replace(/[.,!?;:]/g, '').length + 1);
	const totalWeight = weights.reduce((a, b) => a + b, 0);
	const span = end - start;
	let t = start;
	return raw.map((w, i) => {
		const dur = (weights[i] / totalWeight) * span;
		const wStart = t;
		const wEnd = t + dur;
		t = wEnd;
		return {text: w, start: wStart, end: wEnd};
	});
};

// ───────────────────────── CTA end card ─────────────────────────
const CtaCard = ({brand, accent, dark, dark2, phone, tagline}) => {
	const frame = useCurrentFrame();
	const pop = interpolate(frame, [0, 15], [0.92, 1], {
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.back(1.4)),
	});
	const opacity = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill
			style={{
				background: `linear-gradient(180deg, ${dark} 0%, ${dark2} 100%)`,
				justifyContent: 'center',
				alignItems: 'center',
				opacity,
			}}
		>
			<div style={{transform: `scale(${pop})`, textAlign: 'center'}}>
				<div style={{fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: 96, color: accent, lineHeight: 1.15, textShadow: '0 4px 8px rgba(0,0,0,.6)'}}>
					{brand.split(' ').length > 1 ? (
						<>
							{brand.split(' ').slice(0, 1)}
							<br />
							{brand.split(' ').slice(1).join(' ')}
						</>
					) : (
						brand
					)}
				</div>
				<div style={{width: 130, height: 6, background: accent, margin: '28px auto'}} />
				{tagline ? (
					<div style={{fontFamily: 'sans-serif', fontWeight: 700, fontSize: 40, color: '#fff', marginBottom: 36}}>
						{tagline}
					</div>
				) : null}
				{phone ? (
					<div
						style={{
							display: 'inline-block',
							background: '#25D366',
							color: '#fff',
							fontFamily: 'sans-serif',
							fontWeight: 800,
							fontSize: 54,
							padding: '24px 48px',
							borderRadius: 999,
						}}
					>
						{phone}
					</div>
				) : null}
			</div>
		</AbsoluteFill>
	);
};

// ───────────────────────── Root ad composition ─────────────────────────
const AdVideo = (props) => {
	const {fps} = useVideoConfig();
	const {
		brand = 'BAZIN MARI FALAH',
		accent = '#f5c542',
		dark = '#0c1130',
		dark2 = '#1f2650',
		audioFile,
		shots = [],
		captions = [],
		phone,
		tagline = 'Commandez sur WhatsApp',
		ctaDurationInSeconds = 4.5,
		transitionSeconds = 0.35,
		highlightWords = [],
		showBanner = true,
		showVignette = true,
		bannerPosition = 'top',
	} = props;
	// Phone number and brand name are always emphasized in captions unless the
	// caller already listed keywords of their own. Flattened to individual
	// tokens so word-by-word karaoke can match a multi-word phone number.
	const effectiveHighlight = (highlightWords.length ? highlightWords : [phone, brand].filter(Boolean))
		.flatMap((h) => h.toLowerCase().split(/\s+/))
		.filter(Boolean);

	const durations = shots.map((s) => Math.round(s.durationInSeconds * fps));
	const starts = [];
	{
		let c = 0;
		durations.forEach((d) => {
			starts.push(c);
			c += d;
		});
	}
	const shotsTotalFrames = durations.reduce((a, b) => a + b, 0);
	const ctaFrames = Math.round(ctaDurationInSeconds * fps);

	// Overlap at each internal boundary, clamped so it never exceeds either
	// neighboring shot's own length (avoids negative/degenerate durations).
	const defaultOverlap = Math.round(transitionSeconds * fps);
	const boundaryOverlap = durations.slice(0, -1).map((d, i) => {
		if (!defaultOverlap) return 0;
		return Math.max(0, Math.min(defaultOverlap, d, durations[i + 1]));
	});

	const shotSequences = shots.map((s, i) => {
		const durationInFrames = durations[i];
		const ovIn = i === 0 ? 0 : boundaryOverlap[i - 1];
		const ovOut = i === shots.length - 1 ? 0 : boundaryOverlap[i];
		const seqStart = starts[i] - ovIn;
		const seqDur = durationInFrames + ovIn + ovOut;
		return (
			<Sequence key={`shot-${i}`} from={seqStart} durationInFrames={seqDur}>
				<ShotFade ovIn={ovIn}>
					{s.type === 'video' ? (
						<VideoShot
							fps={fps}
							src={s.src}
							videoStartFrom={s.videoStartFrom || 0}
							durationInFrames={durationInFrames}
							zoomTo={s.zoomTo ?? 1.08}
							volume={s.volume ?? 0}
						/>
					) : (
						<KenBurnsShot
							photo={s.photo}
							from={s.from}
							to={s.to}
							durationInFrames={durationInFrames}
							fps={fps}
							shake={s.shake ?? 0}
						/>
					)}
					{s.title ? (
						<TitleOverlay title={s.title} subtitle={s.subtitle} accent={accent} durationInFrames={durationInFrames} />
					) : null}
					{s.badge ? (
						<Badge text={s.badge.text} accent={s.badge.accent ?? accent} dark={dark} side={s.badge.side ?? 'right'} />
					) : null}
				</ShotFade>
			</Sequence>
		);
	});

	const captionSequences = captions.map((c, i) => {
		const from = Math.round(c.start * fps);
		const durationInFrames = Math.round((c.end - c.start) * fps);
		const words = c.words || (c.plain || c.raw ? null : autoWordTimings(c.text, c.start, c.end));
		return (
			<Sequence key={`cap-${i}`} from={from} durationInFrames={durationInFrames}>
				{c.raw ? (
					<RawCaption text={c.text} />
				) : words && words.length ? (
					<KaraokeCaptionBar words={words} accent={accent} fps={fps} groupStart={c.start} highlight={effectiveHighlight} />
				) : (
					<CaptionBar text={c.text} speaker={c.speaker} accent={accent} highlight={effectiveHighlight} />
				)}
			</Sequence>
		);
	});

	return (
		<AbsoluteFill style={{backgroundColor: dark}}>
			{audioFile ? <Audio src={audioFile.startsWith('http') ? audioFile : staticFile(audioFile)} /> : null}

			<Sequence from={0} durationInFrames={shotsTotalFrames}>
				<AbsoluteFill>{shotSequences}</AbsoluteFill>
				{showVignette ? <Vignette /> : null}
				{showBanner ? <BrandBanner brand={brand} accent={accent} position={bannerPosition} /> : null}
				<AbsoluteFill>{captionSequences}</AbsoluteFill>
			</Sequence>

			{ctaFrames > 0 ? (
				<Sequence from={shotsTotalFrames} durationInFrames={ctaFrames}>
					<CtaCard brand={brand} accent={accent} dark={dark} dark2={dark2} phone={phone} tagline={tagline} />
				</Sequence>
			) : null}
		</AbsoluteFill>
	);
};

module.exports = {AdVideo};
