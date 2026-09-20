/**
 * Defines a model as a mesh with materials
 */

// Import objects from other js files
import { Material } from './material.js';
import { TriangularMesh } from './mesh.js';
import { OBJLoader } from './obj_loader.js';
import { BoundingBox } from './bounding_box.js';

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
    constructor(gl, type = gl.UNSIGNED_SHORT, mesh, boundingBox, materialLocs = [], materialMap = {}, materialsMapObjects = {}, localImagesBlobMap = {}, mode = gl.TRIANGLES) {
        this.gl = gl;
        this.mesh = mesh;
        this.boundingBox = boundingBox;
        this.materialsMapObjects = materialsMapObjects; // Materials is an array of all materials this object has assigned
        this.materialLocs = materialLocs; // Array of strings with locations of .mtl files for this OBJ package. // TODO Needed?
        this.materialMap = materialMap; // Map/dict of which faces are which material, e.g. "Wood": [0 1 2], [0 1 5], etc.
        this.localImagesBlobMap = localImagesBlobMap;
        this.mode = mode;
        this.type = type;
        this.byteSize = this.#getByteSize(type);
    
    }

    /**
     * 
     * @param {number} type : The type of gl index. Can be gl.UNSIGNED_BYTE, gl.UNSIGNED_SHORT, or gl.UNSIGNED_INT.
     * @returns byteOffset as integer. Can only be either 1, 2, or 4. Will return 1 if type is invalid.
     */
    #getByteSize(type) {
        // Naively assume byte offset of 1. Only correct for gl.UNSIGNED_BYTE, but keep as 1 in case something else passed in
        let byteOffset = 1;
        if (type === gl.UNSIGNED_SHORT) {
            byteOffset = 2;
        } else if (type === gl.UNSIGNED_INT) {
            byteOffset = 4;
        }

        //console.log("Type is ", type, " so byteOffset is ", byteOffset);
        return byteOffset;
    }
    
    /**
     * Draw the model on the screen for one frame, spinning
     * Each of these are 4x4 matrices.
     * @param {array} m: Model matrix. Moves, rotates, and/or scales model.
     * @param {array} v: View matrix. Sets position and orientation of camera.
     * @param {array} p: Projection matrix. Defines field of view.
     */
    drawModel(gl, m, v, p) {
        // Test to see vertex sizes
        //console.log("Number of vertices: ", this.mesh.v.length/3);
        //console.log("Number of normals: ", this.mesh.vn.length/3);
        //console.log("Number of uvs: ", this.mesh.vt.length/2);
        //console.log("Number of faces: ", this.mesh.f.length/3);
        // Create basic material if none provided
        /*
        if (Object.keys(this.materialsMapObjects).length == 0) {
            const basicMat = new Material(gl);
            //this.materials.push(basicMat);
            this.materialsMapObjects[basicMat.name] = basicMat;
        }
        */

        // Test boundingBox
        //console.log("Bounding box: ", this.boundingBox);

        // Default mtl
        const basicMat = new Material(gl);

        // Placeholder for the material to paint
        let material = null;

        // TODO Control which shader program is called based on illum
        gl.useProgram(program);

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

        // Apply uniforms to declare what materials will be doing
        if (Object.keys(this.materialMap).length > 0) { // Materials were declared in a map, even maybe a blank '' mtl
            //for (const material of this.materials) {
            for (const materialName of Object.keys(this.materialMap)) {
                // Get this material
                // TODO Fail gracefully if a material was declared in map but not loaded from a mtl file
                // Load default material instead
                //if (this.materials.has(materialName)
                //console.log(materialName, this.materialsMapObjects[materialName]);
                //console.log(Object.keys(this.materialMap));
                if ((materialName in this.materialsMapObjects)) { // Found this materialName in bag of Materials
                    material = this.materialsMapObjects[materialName];
                } else { // Did not find in bag, so paint this default 
                    material = basicMat;
                    // Add the basic material to paint this same range to map
                    //this.materialMap[material.name] = this.materialMap[materialName];
                    //console.log("Material map now is: ", this.materialMap);
                }
                
                // let name = material.name;
                // Get which faces in materialMap are this material
                material.applyUniforms(this.localImagesBlobMap);

                // If materialMap is not empty // TODO Fail gracefully if materialMap has values but not this material
                //if (Object.keys(this.materialMap).length > 0) {
                //if (this.materialMap.has(material.name)) {
                    // There are specific faces needing this specific paintjob
                    //console.log("materialMap: ", this.materialMap);

                    // geometry mode, geometry vertex count, geometry type
                    // Needs to pull different parts of the mesh per material and its shader
                    // gl.drawElements(mode, Number of faces to apply material to, type, offset to start looking for faces)
                    // gl.drawElements(this.mode, this.mesh.f.length, this.type, 0);
                //console.log(material.name, this.materialMap[materialName]);
                //console.log("Len all faces: ", this.mesh.f.length);
                //gl.disable(gl.CULL_FACE);
                //console.log("materialMap this mtl in model class looks like: ", this.materialMap[materialName]);
                //console.log("materialMap this mtl in model class looks like: ", this.materialMap[materialName]);
                for (const materialCall of this.materialMap[materialName]) {
                //for (const materialCall of this.materialMap["Material.004"]) {
                    //console.log(materialCall);
                    //gl.disable(gl.DEPTH_TEST)
                    //gl.enable(gl.CULL_FACE);
                    // Multiply offset by number of bytes used here to ensure it 
                    gl.drawElements(this.mode, materialCall[1], this.type, materialCall[0]*this.byteSize);
                    //console.log("This material ", materialName, "starts at offset ", materialCall[0], " and goes on for ", materialCall[1], " faces.");
                }
                
                //gl.drawElements(this.mode, this.materialMap[materialName][1], this.type, this.materialMap[materialName][0]);
                
                //gl.drawElements(this.mode, this.mesh.f.length, this.type, 0);

                //} else if (!this.materialMap.has(material.name)) {
                    // No specific faces mentioned for this material, so paint everything in this material
                    //gl.drawElements(this.mode, this.mesh.f.length, this.type, 0);
                    
            }
            
        } else {
            // No material map declared, so paint everything default material.
            basicMat.applyUniforms(this.localImagesBlobMap);
            // gl.drawElements(this.mode, this.mesh.f.length, this.type, 0);
            // TODO If vertex count goes above 65,535, switch model type from gl.UNSIGNED_SHORT to gl.UNSIGNED_INT
            // // and make the faces uint32 instead of uint16. Throw warning to user maybe that thier PC
            // // may not be able to handle so many vertices.
            //console.log("Render with ", this.mode, ", ", this.mesh.f.length, ", ", this.type);
            //gl.disable(gl.CULL_FACE);
            gl.drawElements(this.mode, this.mesh.f.length, this.type, 0);
        }
        
    }
        
}