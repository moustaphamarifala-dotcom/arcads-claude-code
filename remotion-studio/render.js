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

const [, , specPath, outPath] = process.argv;
if (!specPath || !outPath) {
	console.error('Usage: node render.js <spec.json> <output.mp4>');
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

const tmpProps = path.join(__dirname, `.props-${Date.now()}.json`);
fs.writeFileSync(tmpProps, JSON.stringify(spec));

try {
	execFileSync(
		'npx',
		[
			'remotion',
			'render',
			'src/index.js',
			'AdVideo',
			outPath,
			`--props=${tmpProps}`,
			`--browser-executable=${CHROME}`,
			'--gl=angle',
		],
		{cwd: __dirname, stdio: 'inherit'}
	);
	console.log('OK:', outPath);
} finally {
	fs.unlinkSync(tmpProps);
}
