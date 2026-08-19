const React = require('react');
const {Composition} = require('remotion');
const {AdVideo} = require('./AdVideo.jsx');

const FPS = 30;

const calculateMetadata = ({props}) => {
	const shotsSeconds = (props.shots || []).reduce((acc, s) => acc + s.durationInSeconds, 0);
	const ctaSeconds = props.ctaDurationInSeconds ?? 4.5;
	const durationInFrames = Math.max(1, Math.round((shotsSeconds + ctaSeconds) * FPS));
	return {durationInFrames, fps: FPS, width: props.width ?? 1080, height: props.height ?? 1920};
};

const RemotionRoot = () => {
	return (
		<Composition
			id="AdVideo"
			component={AdVideo}
			fps={FPS}
			width={1080}
			height={1920}
			durationInFrames={150}
			calculateMetadata={calculateMetadata}
			defaultProps={{
				brand: 'BAZIN MARI FALAH',
				accent: '#f5c542',
				dark: '#0c1130',
				dark2: '#1f2650',
				audioFile: null,
				shots: [],
				captions: [],
				phone: null,
				tagline: 'Commandez sur WhatsApp',
				ctaDurationInSeconds: 4.5,
			}}
		/>
	);
};

module.exports = {RemotionRoot};
