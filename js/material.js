/**
 * Defines material for an object
 * If calls from mtl file are not provided,
 * this method includes a blank constructor to create
 * a basic default material (gray, diffuse, Lambertian lighting).
 */

// Import objects from other js files
import { TriangularMesh } from './mesh.js';
import { Model } from './model.js';
import { OBJLoader } from './obj_loader.js';

// TODO Add more constructor values. 
/**
 * Material class.
 * @param {Webgl Object} gl: WebGL canvas header
 * @param {string} name: Name of this material
 * @param {array} Ka: Ambient color in RGB
 * @param {array} Kd: Diffuse color in RGB
 * @param {array} Ks: Specular color in RGB
 * @param {string} textureReference: File location for any texture file for this material
 * ...
 */
export class Material {
    // This constructor will create generic grey diffuse Material if name and other attributes aren't manually set.
    constructor(gl, name = "basicMaterial") {
        this.gl = gl;
        this.name = name;
        this.Ka = [0.0, 0.0, 0.0];
        this.Kd = [0.5, 0.5, 0.5]; 
        this.Ks = [0.0, 0.0, 0.0]; 
        this.Tr = 0.0; 
        this.illum = 1; 
        this.d = 1.0;
        this.Ns = 0.0;
        this.sharpness = 0;
        this.Ni = 1.0;
        this.map_Ka = "";
        this.map_Kd = ""; 
        this.map_Ks = "";
        this.map_Ns = "";
        this.map_d = "";
        this.disp = ""; 
        this.decal = ""; 
        this.bump = "";
        
        this.textureReference = "";
    }
    
    /**
     * Make a basic material
     * @param {array} localImagesBlobMap: array of loaded texture images' memory handles
     */
    applyUniforms(localImagesBlobMap) {
        // Look up where to inject variables to fragment shader
        const color_KdLoc = gl.getUniformLocation(program, "color_Kd");
        const color_KaLoc = gl.getUniformLocation(program, "color_Ka");
        const color_KsLoc = gl.getUniformLocation(program, "color_Ks");
        const NsLoc = gl.getUniformLocation(program, "Ns");
        const useTexLoc = gl.getUniformLocation(program, "u_useTexture"); // The bool
        const samplerLoc = gl.getUniformLocation(program, "u_textureSampler");
        // Pass them in
        gl.uniform4fv(color_KdLoc, [...this.Kd, this.d]); 
        gl.uniform3fv(color_KaLoc, this.Ka);
        gl.uniform3fv(color_KsLoc, this.Ks);
        gl.uniform1f(NsLoc, this.Ns);
        // Call the image per map
        const activeTexture = localImagesBlobMap[this.map_Kd];
        if (this.map_Kd.length > 0 && activeTexture) {
            // Set u_useTexture to true (1)
            gl.uniform1i(useTexLoc, 1);
            // Activate texture slot unit 0
            gl.activeTexture(gl.TEXTURE0);
            // Bind the image memory handle from the array
            gl.bindTexture(gl.TEXTURE_2D, activeTexture);
            // Tell sampler uniform to read from unit 0
            gl.uniform1i(samplerLoc, 0);
            
        } else {
            // Set u_useTexture to false (0). Paint solid color, not texture.
            gl.uniform1i(useTexLoc, 0);
        }
        
    }
    
}