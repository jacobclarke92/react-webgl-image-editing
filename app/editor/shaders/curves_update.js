import { curvesHashTable } from '../utils/colorUtils'
import Texture from '../Texture'

export default function(settings) {

	const channels = settings.channels || 'rgb';
	const curves = settings.curves;
	const curveLookup = curvesHashTable(curves);
	// make an array of r,g,b,a, r,g,b,a pixel values
	const rgbaData = [];
	for(let n of curveLookup) {
		rgbaData.push(n, n, n, 255);
	}

	// set rgb uniforms depending on the channels string
	this.uniforms({
		red:   channels.indexOf('r') >= 0,
		green: channels.indexOf('g') >= 0,
		blue:  channels.indexOf('b') >= 0,
	});

	// // create curve texture if not already existing
	if(!this.curveTexture) this.curveTexture = new Texture(this.gl, this.width, this.height);
	this.curveTexture.loadFromBytes(rgbaData, 256, 1);
	this.curveTexture.use(3);
	this.textureCache.push(this.curveTexture);
	this.gl.uniform1i(this.gl.getUniformLocation(this.program, "map"), 3);
}