/**
 * Defines a model as a mesh with materials
 */

// Import objects from other js files
import { Material } from './material.js';
import { TriangularMesh } from './mesh.js';
import { OBJLoader } from './obj_loader.js';

/**
 * Class defining a Model.
 * A Model controls one Mesh and at least one Material.
 * If no Material is assigned during File read, it assigns a default gray diffuse Material.
 * This class also controls drawing the model and receiving updated mvp matrices.
 * 
 * @param {TriangularMesh} mesh: The mesh read in from an .obj file
 * @param {array Materials} materials: An array of Material objects read in from .mtl file(s)
 * @param {array} localImagesBlobMap: A map of images for texturing read in from .mtl files.
 * ...
 */
export class Model {
    constructor(gl, mesh, materialLocs = [], materialMap = {}, materials = [], localImagesBlobMap = {}, mode = gl.TRIANGLES, type = gl.UNSIGNED_SHORT) {
        this.gl = gl;
        this.mesh = mesh;
        this.materials = materials; // Materials is an array of all materials this object has assigned
        this.materialLocs = materialLocs; // Array of strings with locations of .mtl files for this OBJ package. // TODO Needed?
        this.materialMap = materialMap; // Map/dict of which faces are which material, e.g. "Wood": [0 1 2], [0 1 5], etc.
        this.localImagesBlobMap = localImagesBlobMap;
        this.mode = mode;
        this.type = type;
    
    }
    
    /**
     * Draw the model on the screen for one frame, spinning
     * Each of these are 4x4 matrices.
     * @param {array} m: Model matrix. Moves, rotates, and/or scales model.
     * @param {array} v: View matrix. Sets position and orientation of camera.
     * @param {array} p: Projection matrix. Defines field of view.
     */
    drawModel(gl, m, v, p) {
        // Create basic material if none provided
        if (this.materials.length == 0) {
            const basicMat = new Material(gl);
            this.materials.push(basicMat);
        }

        gl.useProgram(program);
        
        // Apply uniforms to declare what materials will be doing
        for (const material of this.materials) {
            // Get name of this material
            let name = material.name;
            // Get which faces in materialMap are this material
            // If materialMap is not empty
            //if (materialMap.length == 0) {
            if (Object.keys(this.materialMap).length > 0) {
                // There are specific faces needing specific paintjobs
                //console.log("materialMap: ", this.materialMap);
                // TODO Remove mvLocation, no more multiplying outside shader
                const mvLocation = gl.getUniformLocation(program, "mv");
                const mLocation = gl.getUniformLocation(program, "m");
                const vLocation = gl.getUniformLocation(program, "v");
                const pLocation  = gl.getUniformLocation(program, "p");
                
                // Use the MVP matrices to define model location and animation
                gl.uniformMatrix4fv(mvLocation, false, m4mul(v, m));
                gl.uniformMatrix4fv(mLocation, false, m);
                gl.uniformMatrix4fv(vLocation, false, v);
                gl.uniformMatrix4fv(pLocation, false, p);
                
                gl.uniform3fv(gl.getUniformLocation(program, "lightDir"), new Float32Array([0.0, 1.0, 1.0]));
                gl.uniform3fv(gl.getUniformLocation(program, "lightColor"), new Float32Array([1.0, 1.0, 1.0]));
                
                material.applyUniforms(this.localImagesBlobMap);

                // geometry mode, geometry vertex count, geometry type
                // Needs to pull different parts of the mesh per material and its shader
                gl.drawElements(this.mode, this.mesh.f.length, this.type, 0);
            }
            
        }
        
    }
        
}