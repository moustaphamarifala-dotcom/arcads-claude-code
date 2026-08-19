#!/usr/bin/env node
/**
 * Wrapper around `remotion render`: takes a JSON spec (see examples/*.json),
 * copies referenced media into public/, and renders the AdVideo composition.
 *
 * Usage: node render.js <spec.json> <output.mp4>
 */
const fs = require('fs');
const path = require('path');
const {execFileSync} = require('child_process');

const CHROME = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';

// Aspect ratios the composition can render at. Banner/captions are anchored
// to the top/bottom edges (not the canvas center), so they stay correctly
// placed at any of these — only the footage's object-fit:cover crop changes.
const FORMATS = {
	vertical: {width: 1080, height: 1920}, // TikTok / Reels / Stories
	square: {width: 1080, height: 1080}, // Feed (1:1)
	portrait4x5: {width: 1080, height: 1350}, // Feed (4:5)
};

const [, , specPath, outPath, format = 'vertical'] = process.argv;
if (!specPath || !outPath) {
	console.error('Usage: node render.js <spec.json> <output.mp4> [vertical|square|portrait4x5|all]');
	process.exit(1);
}
if (format !== 'all' && !FORMATS[format]) {
	console.error(`Unknown format "${format}". Use one of: vertical, square, portrait4x5, all`);
	process.exit(1);
}

const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const publicDir = path.join(__dirname, 'public');
fs.mkdirSync(publicDir, {recursive: true});

const copyIntoPublic = (srcPath, prefix) => {
	const ext = path.extname(srcPath);
	const name = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
	fs.copyFileSync(srcPath, path.join(publicDir, name));
	return name;
};

// Copy audio
if (spec.audioFile) {
	spec.audioFile = copyIntoPublic(spec.audioFile, 'audio');
}

// Copy shot media (photo or video)
(spec.shots || []).forEach((s, i) => {
	if (s.type === 'video') {
		s.src = copyIntoPublic(s.src, `shot${i}`);
	} else {
		s.photo = copyIntoPublic(s.photo, `shot${i}`);
	}
});

const formatsToRender = format === 'all' ? Object.keys(FORMATS) : [format];
const outExt = path.extname(outPath);
const outBase = outPath.slice(0, -outExt.length || undefined);

formatsToRender.forEach((fmt) => {
	const {width, height} = FORMATS[fmt];
	const fmtOutPath = format === 'all' ? `${outBase}-${fmt}${outExt}` : outPath;
	const fmtSpec = {...spec, width, height};

	const tmpProps = path.join(__dirname, `.props-${Date.now()}-${fmt}.json`);
	fs.writeFileSync(tmpProps, JSON.stringify(fmtSpec));

	try {
		execFileSync(
			'npx',
			[
				'remotion',
				'render',
				'src/index.js',
				'AdVideo',
				fmtOutPath,
				`--props=${tmpProps}`,
				`--browser-executable=${CHROME}`,
				'--gl=angle',
			],
			{cwd: __dirname, stdio: 'inherit'}
		);
		console.log('OK:', fmtOutPath);
	} finally {
		fs.unlinkSync(tmpProps);
	}
});
