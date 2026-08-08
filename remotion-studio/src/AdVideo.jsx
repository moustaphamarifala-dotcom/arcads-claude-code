const React = require('react');
const {
	AbsoluteFill,
	Audio,
	Img,
	Sequence,
	useCurrentFrame,
	useVideoConfig,
	interpolate,
	staticFile,
	Easing,
} = require('remotion');

const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);

// ───────────────────────── Ken Burns photo pan ─────────────────────────
const KenBurnsShot = ({photo, from, to, durationInFrames}) => {
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

	return (
		<AbsoluteFill style={{overflow: 'hidden', backgroundColor: '#000'}}>
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
		</AbsoluteFill>
	);
};

// ───────────────────────── Brand banner (top) ─────────────────────────
const BrandBanner = ({brand, accent}) => (
	<div
		style={{
			position: 'absolute',
			top: 60,
			left: '50%',
			transform: 'translateX(-50%)',
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

// ───────────────────────── Caption bar (dialogue / testimonial style) ─────────────────────────
const CaptionBar = ({text, speaker, accent}) => (
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
		<div style={{fontFamily: 'sans-serif', fontWeight: 700, fontSize: 40, color: '#fff', lineHeight: 1.3}}>{text}</div>
	</div>
);

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
	} = props;

	const shotsTotalFrames = shots.reduce((acc, s) => acc + Math.round(s.durationInSeconds * fps), 0);
	const ctaFrames = Math.round(ctaDurationInSeconds * fps);

	let cursor = 0;
	const shotSequences = shots.map((s, i) => {
		const durationInFrames = Math.round(s.durationInSeconds * fps);
		const seq = (
			<Sequence key={`shot-${i}`} from={cursor} durationInFrames={durationInFrames}>
				<KenBurnsShot
					photo={s.photo}
					from={s.from}
					to={s.to}
					durationInFrames={durationInFrames}
				/>
				{s.title ? (
					<TitleOverlay title={s.title} subtitle={s.subtitle} accent={accent} durationInFrames={durationInFrames} />
				) : null}
			</Sequence>
		);
		cursor += durationInFrames;
		return seq;
	});

	const captionSequences = captions.map((c, i) => {
		const from = Math.round(c.start * fps);
		const durationInFrames = Math.round((c.end - c.start) * fps);
		return (
			<Sequence key={`cap-${i}`} from={from} durationInFrames={durationInFrames}>
				<CaptionBar text={c.text} speaker={c.speaker} accent={accent} />
			</Sequence>
		);
	});

	return (
		<AbsoluteFill style={{backgroundColor: dark}}>
			{audioFile ? <Audio src={audioFile.startsWith('http') ? audioFile : staticFile(audioFile)} /> : null}

			<Sequence from={0} durationInFrames={shotsTotalFrames}>
				<AbsoluteFill>{shotSequences}</AbsoluteFill>
				<BrandBanner brand={brand} accent={accent} />
				<AbsoluteFill>{captionSequences}</AbsoluteFill>
			</Sequence>

			<Sequence from={shotsTotalFrames} durationInFrames={ctaFrames}>
				<CtaCard brand={brand} accent={accent} dark={dark} dark2={dark2} phone={phone} tagline={tagline} />
			</Sequence>
		</AbsoluteFill>
	);
};

module.exports = {AdVideo};
