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
        this.gl = gl; // TODO Delete?
        this.name = name; // Implemented.
        this.Ka = [0.0, 0.0, 0.0]; // Implemented.
        this.Kd = [0.5, 0.5, 0.5];  // Implemented.
        this.Ks = [0.0, 0.0, 0.0];  // Implemented.
        this.Tr = 0.0; 
        this.illum = 1; 
        this.d = 1.0; // Implemented fully?
        this.Ns = 0.0; // Implemented.
        this.sharpness = 0;
        this.Ni = 1.0;
        this.map_Ka = ""; // Implemented.
        this.map_Kd = "";  // Implemented.
        this.map_Ks = ""; // Implemented.
        this.map_Ns = ""; // TODO What does this map do?
        this.map_d = ""; // TODO What does this map do?
        this.disp = ""; 
        this.decal = ""; 
        this.bump = "";
        
        this.textureReference = "";

        this.blendu_Ka = 0;
        this.blendv_Ka = 0;
        this.cc_Ka = 0;
        this.clamp_Ka = 0;
        this.mm_base_Ka = 0.0;
        this.mm_gain_Ka = 0.0;
        this.o_Ka = [0.0, 0.0, 0.0];
        this.s_Ka = [1.0, 1.0, 1.0]; // Scale the Ka texture by u (horizontal), v (vertical), w (depth/tessellation of displacement, optional).
        this.t_Ka = [0.0, 0.0, 0.0];
        this.texres_Ka = 0.0;

        this.blendu_Kd = 0;
        this.blendv_Kd = 0;
        this.cc_Kd = 0;
        this.clamp_Kd = 0;
        this.mm_base_Kd = 0.0;
        this.mm_gain_Kd = 0.0;
        this.o_Kd = [0.0, 0.0, 0.0];
        this.s_Kd = [1.0, 1.0, 1.0]; // Scale the Kd texture by u (horizontal), v (vertical), w (depth/tessellation of displacement, optional).
        this.t_Kd = [0.0, 0.0, 0.0];
        this.texres_Kd = 0.0;

        this.blendu_Ks = 0;
        this.blendv_Ks = 0;
        this.cc_Ks = 0;
        this.clamp_Ks = 0;
        this.mm_base_Ks = 0.0;
        this.mm_gain_Ks = 0.0;
        this.o_Ks = [0.0, 0.0, 0.0];
        this.s_Ks = [1.0, 1.0, 1.0]; // Scale the Ks texture by u (horizontal), v (vertical), w (depth/tessellation of displacement, optional).
        this.t_Ks = [0.0, 0.0, 0.0];
        this.texres_Ks = 0.0;

        this.blendu_d = 0;
        this.blendv_d = 0;
        this.cc_d = 0;
        this.clamp_d = 0;
        this.mm_base_d = 0.0;
        this.mm_gain_d = 0.0;
        this.o_d = [0.0, 0.0, 0.0];
        this.s_d = [1.0, 1.0, 1.0]; // Scale the d texture by u (horizontal), v (vertical), w (depth/tessellation of displacement, optional).
        this.t_d = [0.0, 0.0, 0.0];
        this.texres_d = 0.0;

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
        const useTexLoc_Ka = gl.getUniformLocation(program, "u_useTexture_Ka"); // The bool
        const useTexLoc_Ks = gl.getUniformLocation(program, "u_useTexture_Ks"); // The bool
        const useTexLoc_d = gl.getUniformLocation(program, "u_useTexture_d"); // The bool
        const samplerLoc = gl.getUniformLocation(program, "u_textureSampler");
        const samplerLoc_Ka = gl.getUniformLocation(program, "u_textureSampler_Ka");
        const samplerLoc_Ks = gl.getUniformLocation(program, "u_textureSampler_Ks");
        const samplerLoc_d = gl.getUniformLocation(program, "u_textureSampler_d");
        const scaleLoc = gl.getUniformLocation(program, "s_Kd");
        const scaleLoc_Ka = gl.getUniformLocation(program, "s_Ka");
        const scaleLoc_Ks = gl.getUniformLocation(program, "s_Ks");
        const scaleLoc_d = gl.getUniformLocation(program, "s_d");
        
        
        
        
        // Pass them in
        gl.uniform4fv(color_KdLoc, [...this.Kd, this.d]); 
        gl.uniform3fv(color_KaLoc, this.Ka);
        gl.uniform3fv(color_KsLoc, this.Ks);
        gl.uniform1f(NsLoc, this.Ns);
        // Call the image per map
        //console.log("Loaded Kd textures: ", this.map_Kd);
        //console.log("Loaded localImagesBlobMap: ", localImagesBlobMap);
        //console.log("This texture: ", localImagesBlobMap[this.map_Kd]);
        const activeTexture = localImagesBlobMap[this.map_Kd];
        if (this.map_Kd.length > 0 && activeTexture) {
            //console.log("Loading texture.");
            // Set u_useTexture to true (1)
            gl.uniform1i(useTexLoc, 1);
            // Activate texture slot unit 0
            gl.activeTexture(gl.TEXTURE0);
            // Bind the image memory handle from the array
            gl.bindTexture(gl.TEXTURE_2D, activeTexture);
            // Tell sampler uniform to read from unit 0
            gl.uniform1i(samplerLoc, 0);
            // Tell scale for this map what to scale by
            //console.log("s_Kd for ", this.name, " material is ", this.s_Kd);
            gl.uniform3f(scaleLoc, ...this.s_Kd);
        } else {
            // Set u_useTexture to false (0). Paint solid color, not texture.
            gl.uniform1i(useTexLoc, 0);
        }

        const activeTexture_Ka = localImagesBlobMap[this.map_Ka];
        if (this.map_Ka.length > 0 && activeTexture_Ka) {
            // Set u_useTexture to true (1)
            gl.uniform1i(useTexLoc_Ka, 1);
            // Activate texture slot unit 1 // TODO Is this how to have multiple textures in same material?
            gl.activeTexture(gl.TEXTURE1);
            // Bind the image memory handle from the array
            gl.bindTexture(gl.TEXTURE_2D, activeTexture_Ka);
            // Tell sampler uniform to read from unit 1
            gl.uniform1i(samplerLoc_Ka, 1);
            // Tell scale for this map what to scale by
            gl.uniform3f(scaleLoc_Ka, ...this.s_Ka);     
        } else {
            // Set u_useTexture to false (0). Paint solid color, not texture.
            gl.uniform1i(useTexLoc_Ka, 0);
        }        

        const activeTexture_Ks = localImagesBlobMap[this.map_Ks];
        if (this.map_Ks.length > 0 && activeTexture_Ks) {
            // Set u_useTexture to true (1)
            gl.uniform1i(useTexLoc_Ks, 1);
            // Activate texture slot unit 2 // TODO Is this how to have multiple textures in same material?
            gl.activeTexture(gl.TEXTURE2);
            // Bind the image memory handle from the array
            gl.bindTexture(gl.TEXTURE_2D, activeTexture_Ks);
            // Tell sampler uniform to read from unit 1
            gl.uniform1i(samplerLoc_Ks, 2);      
            // Tell scale for this map what to scale by
            gl.uniform3f(scaleLoc_Ks, ...this.s_Ks);       
        } else {
            // Set u_useTexture to false (0). Paint solid color, not texture.
            gl.uniform1i(useTexLoc_Ks, 0);
        }

        const activeTexture_d = localImagesBlobMap[this.map_d];
        if (this.map_d.length > 0 && activeTexture_d) {
            //console.log("Loading d texture.");
            // Set u_useTexture to true (1)
            gl.uniform1i(useTexLoc_d, 1);
            // Activate texture slot unit 3
            gl.activeTexture(gl.TEXTURE3);
            // Bind the image memory handle from the array
            gl.bindTexture(gl.TEXTURE_2D, activeTexture_d);
            // Tell sampler uniform to read from unit 0
            gl.uniform1i(samplerLoc_d, 3);
            // Tell scale for this map what to scale by
            //console.log("s_Kd for ", this.name, " material is ", this.s_Kd);
            gl.uniform3f(scaleLoc_d, ...this.s_d);
        } else {
            // Set u_useTexture to false (0). Paint solid color, not texture.
            gl.uniform1i(useTexLoc_d, 0);
        }

    }
    
}