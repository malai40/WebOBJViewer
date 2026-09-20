/**
 * Defines mesh object 
 * This defines an object as a collection of uncolored triangles
 * in 3D space.
 */

// Import objects from other js files
import { Material } from './material.js';
import { Model } from './model.js';
import { OBJLoader } from './obj_loader.js';

export class TriangularMesh {
    constructor(gl, v, f, vn = [], vt = [], materialLocs = [], smooth_shaded = true, buffer_usage = gl.STATIC_DRAW, num_shader = 0) {
        // TODO Fix num_shader. The shaders are hard-coded in vertex_shader, so num_shader should probably always be 0 to respect.
        this.gl = gl;
        this.v = v; // Vertices in flat array as XYZ
        this.f = f; // Which vertices create each triangle in the mesh
        this.vn = vn; // Vertex normals. If not supplied by user, later we calculate.
        this.vt = vt; // Texture coordinates. If not supplied by user, ignore textures.
        
        // Declare VAO to record these next steps
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);
        
        // 1) Create position buffer
        const posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        const v_f32 = new Float32Array(this.v);
        gl.bufferData(gl.ARRAY_BUFFER, v_f32, buffer_usage);
        
        // Enable vertex attrib array in shader num_shader (0 by default)
        // 3 for triangles.
        gl.vertexAttribPointer(num_shader, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(num_shader);
        
        // 2) Create normal buffer
        const normBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
        let vn_f32 = null;
        if (this.vn.length == 0) {
            // We must calculate normals since user didn't supply them
            if (smooth_shaded) {
                // TODO Define normals per vertex using geometric normals of faces
                // Assign those to each vertex
                vn_f32 = new Float32Array(this.vn);
            } else {
                // TODO Define normals per vertex using geometric normals of faces
                // Assign those to each vertex
                vn_f32 = new Float32Array(this.vn);
            }            
        } else {
            vn_f32 = new Float32Array(this.vn);
        }
        gl.bufferData(gl.ARRAY_BUFFER, vn_f32, buffer_usage);   

        // Enable vertex attrib array in shader num_shader+1 (1 by default)
        // 3 for triangles.
        gl.vertexAttribPointer(num_shader+1, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(num_shader+1);
        
        // 3) Create texture buffer if provided
        if (this.vt.length > 0) {
            const texBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
            const vt_f32 = new Float32Array(this.vt);
            gl.bufferData(gl.ARRAY_BUFFER, vt_f32, buffer_usage);   

            // Enable vertex attrib array in shader num_shader+1 (1 by default)
            // 2 for uv coordinates.
            gl.vertexAttribPointer(num_shader+2, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(num_shader+2);   
        }
        
        // 4) Create face buffer
        const faceBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, faceBuffer);
        // f_uint16 version for wide capability, but wont work with meshes above 65,353 vertices.
        let f_uint16or32 = null;
        if ((this.v.length / 3) < 65536) {
            f_uint16or32 = new Uint16Array(this.f);
        } else {
            f_uint16or32 = new Uint32Array(this.f);
        }
        //const f_uint16 = new Uint16Array(this.f);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, f_uint16or32, buffer_usage);
        
       // f_u version for high vertex support
        //const f_uint32 = new Uint32Array(this.f);
 
        /*
        let maxIndex = 0;
        const f_uint32 = new Uint32Array(this.f.flat());
        for (let i = 0; i < f_uint32.length; i++) {
            if (f_uint32[i] > maxIndex) {
                maxIndex = f_uint32[i];
            }
        }
        */

        //console.log("Max index requested:", maxIndex);
        //console.log("Total vertices available:", 130953);
        
        
        //gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, f_uint32, buffer_usage);


        // Bind vertex arrays to gl and close the VAO recording.
        // TODO Debug this erasing everything. Then uncomment.
        //gl.bindVertexArray(null);

    }
    /**
     * Function to calculate normals given three vertices.
     * @param {array} v: Array of vertices in format [X1 Y1 Z1 X2 Y2 Z2 X3 Y3 Z3 ...]
     */
    #getTriangleNormal(v) {
        // Find the normal of a given triangle
        // If vn is not available for this triangle, 
        // // pass this result into vertex shader instead
        // WebGL only takes vertex normals, not face normals
        // // so need to loop through faces, get face normal using this,
        // // add to each vertex's normal count, then normalize all
        // // vertex normals to get vertex normals.
        p0 = v.slice(0,3);
        p1 = v.slice(3,6);
        p2 = v.slice(6,9);
        
        p2_p1 = sub(p2, p1);
        p0_p1 = sub(p0, p1);
        
        return normalize(cross(p2_p1, p0_p1));
    }

    /**
     * Function to calculate vertex normal given vertex and that face's normal
     * @param {array} v: Array of vertices in format [X1 Y1 Z1] 
     * @param {*} triNorm: Normal of triangle touching this vertex
     * TODO
     */
    #getVertexNormal(v, triNorm) {
        return;
    }
}