import Texture from './Texture'

import { createProgramFromSources } from './utils/shaderUtils'
import { setBufferRectangle, getActiveUniforms, setUniform, setNumericUniform } from './utils/webglUtils'
import { isNumeric, isArray } from './utils/typeUtils'

import defaultVertexSource from './shaders/default_vertex.glsl'
import defaultFragmentSource from './shaders/default_fragment.glsl'

export default class Program {

    /**
     * Initialized the program and compiles the vertex and fragment sources
     * @param  {String} label               - For logging reference
     * @param  {Canvas} gl                  - WebGL instance being used
     * @param  {String} vertexSource        - Vertex source, otherwise uses default
     * @param  {String} fragmentSource      - Fragment source, otherwise uses default
     * @param  {function} updateFunction    - Update function, used to modify shader / update uniforms before a render
     * @return {<Program>}                  - Returns self so functions can be chained
     */
	constructor(label = '[[unlabeled]]', gl, vertexSource = defaultVertexSource, fragmentSource = defaultFragmentSource, updateFunction = () => {}) {
		if(!gl) throw 'No GL instance provided for shader';
		this.gl = gl;
		this.program = createProgramFromSources(this.gl, vertexSource, fragmentSource);

        this.updateFunction = updateFunction;
        this.label = label;
        this.width = 100;
        this.height = 100;

        return this;
	}

    /**
     * Destroys program
     */
	destroy() {
		this.gl.deleteProgram(this.program);
        this.program = null;
	}

    /**
     * Activates program
     * @return {<Program>}      - Returns self so functions can be chained
     */
    use() {
        this.gl.useProgram(this.program);
        return this;
    }

    /**
     * Updates program's u_resolution uniforms
     * @param  {Integer} width
     * @param  {Integer} height
     * @return {<Program>}      - Returns self so functions can be chained
     */
    resize(width, height) {
        this.use();

        const resolutionLocation = this.gl.getUniformLocation(this.program, "u_resolution");
        this.gl.uniform2f(resolutionLocation, width, height);
        this.width = width;
        this.height = height;

        return this;
    }

    update(settings, iteration = 0) {
        this.updateFunction.call(this, settings, iteration);
    }

    /**
     * Updates uniforms (or 'shader variables'), most of the hard work can be found in webglUtils
     * @param  {Object} uniforms    - Object of values to set
     * @return {self}               - returns self so functions can be chained 
     */
	uniforms(uniforms) {

		this.use();
        const gl = this.gl;
        const activeUniforms = getActiveUniforms(gl, this.program);

        for (let name in uniforms) {
            if(!activeUniforms.hasOwnProperty(name)) continue;
            if(!activeUniforms[name].location) continue;
            const activeInfo = activeUniforms[name];
            const location = activeInfo.location;

            const value = uniforms[name];
            if (isNumeric(value) || typeof value == 'boolean') {
                setNumericUniform(gl, activeInfo, name, value);
            /*}else if(isArray(value) && value.length && isArray(value[0])) {
                const isVec3 = value[0].length > 2;
                for(let i=0; i<value.length; i ++) {
                    const vecLocation = this.gl.getUniformLocation(this.program, name+'['+i+']');
                    if(vecLocation) {
                        if(isVec3) this.gl.uniform3fv(vecLocation, new Float32Array(value[i]));
                        else this.gl.uniform2fv(vecLocation, new Float32Array(value[i]));
                    }
                }
            }*/ 
            } else {
                setUniform(gl, activeInfo, name, value);
            }
        }

        return this;
	}

    /**
     * Defines textures in program, 
     * I don't think this is actually used as most custom textures are handled by a program's update function
     * @param  {Object} textures    - Object of textures to set
     * @return {<Program>}               - returns self so functions can be chained 
     */
	textures(textures) {
		this.use();
        for (let name in textures) {
            if (!textures.hasOwnProperty(name)) continue;
            this.gl.uniform1i(this.gl.getUniformLocation(this.program, name), textures[name]);
        }

        return this;
	}

    /**
     * Full warning ... I have no idea how this works
     * @return {<Program>} - returns self so functions can be chained 
     */
	willRender() {

        const gl = this.gl;
        
        // initializes a WebGLBuffer storing data such as vertices or colors
        if(!this.texCoordBuffer) this.texCoordBuffer = gl.createBuffer();

        // use tex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);

        // creates and initializes a buffer object's data store
        setBufferRectangle(gl, 0, 0, 1, 1);

        // get a_texCoord pointer
        const texCoordLocation = gl.getAttribLocation(this.program, "a_texCoord");
        if(texCoordLocation < 0) return this;

        // enables the generic vertex attribute array
        gl.enableVertexAttribArray(texCoordLocation);

        // define an array of generic vertex attribute data
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

        return this;
    }


    /**
     * Full warning ... I have no idea how this works
     * @return {<Program>} - returns self so functions can be chained 
     */
    didRender() {

        const gl = this.gl;
        if(!this.buffer) this.buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

        // look up where the vertex data needs to go.
        const positionLocation = gl.getAttribLocation(this.program, "a_position");

        //enables the generic vertex attribute array
        gl.enableVertexAttribArray(positionLocation);

        // define an array of generic vertex attribute data
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);


        // use this buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        // Set a rectangle the same size as the image.
        setBufferRectangle(gl, 0, 0, this.width, this.height);

        // set texture back to 0 -- e.g. when another activeTexture is used to set a uniform
        this.gl.activeTexture(this.gl.TEXTURE0);

        return this;
    }

    /**
     * I guess I know how this works?
     * @return {<Program>} - returns self so functions can be chained 
     */
    draw() {
        const gl = this.gl;
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        return this;
    }

}
